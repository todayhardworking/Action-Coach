import { NextResponse } from "next/server";
import OpenAI from "openai";

interface GenerateSmartRequest {
  userInput?: string;
  answers?: unknown;
}

interface SmartBreakdown {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBased: string;
}

interface GenerateSmartResponse {
  goalTitle: string;
  smart: SmartBreakdown;
}

//
// ─────────────────────────────────────────
// SYSTEM PROMPT (Compact & JSON-Stable)
// ─────────────────────────────────────────
//
const systemPrompt = `
You generate a simple SMART breakdown based on the user’s goal.
Return ONLY a JSON object:

{
  "goalTitle": string,
  "smart": {
    "specific": string,
    "measurable": string,
    "achievable": string,
    "relevant": string,
    "timeBased": string
  }
}

Rules:
- goalTitle must be 6–12 words.
- Each SMART field must be 1–2 friendly sentences.
- No solutions or action steps.
- No extra fields.
- JSON must be valid.
`;

//
// ─────────────────────────────────────────
// Sanitizers
// ─────────────────────────────────────────
//
const sanitizeText = (v: unknown) =>
  typeof v === "string" ? v.trim() : "";

function sanitizeAnswers(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 3);
}

function sanitizeSmart(obj: any): SmartBreakdown | null {
  if (!obj || typeof obj !== "object") return null;

  const fields = [
    "specific",
    "measurable",
    "achievable",
    "relevant",
    "timeBased"
  ] as const;

  const cleaned: any = {};

  for (const f of fields) {
    const val = sanitizeText(obj[f]);
    if (!val) return null;
    cleaned[f] = val;
  }

  return cleaned as SmartBreakdown;
}

//
// ─────────────────────────────────────────
// Safe JSON extractor (no regex)
// ─────────────────────────────────────────
//
function safeParseSmart(raw: string): GenerateSmartResponse | null {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const goalTitle = sanitizeText(parsed.goalTitle);
  const smart = sanitizeSmart(parsed.smart);

  if (!goalTitle || !smart) return null;

  return { goalTitle, smart };
}

//
// ─────────────────────────────────────────
// MAIN API ROUTE
// ─────────────────────────────────────────
//
export async function POST(request: Request) {
  let body: GenerateSmartRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userInput = sanitizeText(body.userInput);
  const answers = sanitizeAnswers(body.answers);

  if (!userInput) {
    return NextResponse.json({ error: "userInput is required." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OpenAI API key." }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey });

  try {
    //
    // Call new Responses API
    //
    const completion = await (openai as any).responses.create({
      model: "gpt-4o",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `
User goal: "${userInput}"
Clarifying answers: ${answers.length ? answers.join(" | ") : "None"}
Generate the SMART breakdown only.
          `
        }
      ]
    });

    const raw = completion.output_text ?? "";
    const parsed = safeParseSmart(raw);

    if (!parsed) {
      throw new Error("Failed to parse SMART JSON response.");
    }

    return NextResponse.json(parsed satisfies GenerateSmartResponse);
  } catch (err) {
    console.error("Failed to generate SMART breakdown:", err);
    return NextResponse.json(
      { error: "Failed to generate SMART breakdown." },
      { status: 500 }
    );
  }
}
