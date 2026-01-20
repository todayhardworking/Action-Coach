import { NextResponse } from "next/server";
import OpenAI from "openai";

interface GenerateQuestionsRequest {
  userInput?: string;
}

interface GenerateQuestionsResponse {
  questions: string[];
}

//
// ─────────────────────────────────────────
// SYSTEM PROMPT (Compact, JSON-safe)
// ─────────────────────────────────────────
//
const systemPrompt = `
You generate *three short clarifying questions* to help a user define a goal or problem.
Return ONLY a JSON object:

{
  "questions": [string, string, string]
}

Rules:
- Ask exactly 3 short conversational questions.
- No advice, no solutions, no steps.
- No bullet points or numbering.
- All output must be valid JSON only.
`;

//
// ─────────────────────────────────────────
// Sanitizers
// ─────────────────────────────────────────
//
function sanitizeQuestion(q: any): string {
  if (typeof q !== "string") return "";
  const trimmed = q.trim();
  return trimmed.endsWith("?") ? trimmed : trimmed + "?";
}

function sanitizeQuestions(raw: any): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => sanitizeQuestion(item))
    .filter((q) => q.length > 1)
    .slice(0, 3);
}

//
// ─────────────────────────────────────────
// Safe JSON parser (no regex fallback)
// ─────────────────────────────────────────
//
function safeParseQuestions(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return sanitizeQuestions(parsed.questions);
  } catch {
    return [];
  }
}

//
// ─────────────────────────────────────────
// API ROUTE
// ─────────────────────────────────────────
//
export async function POST(request: Request) {
  let body: GenerateQuestionsRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userInput =
    typeof body.userInput === "string" ? body.userInput.trim() : "";

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
    // Call OpenAI Responses API
    //
    const completion = await (openai as any).responses.create({
      model: "gpt-4o",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `User wants help with: "${userInput}". Generate exactly 3 clarifying questions.`
        }
      ]
    });

    const raw = completion.output_text ?? "";
    const questions = safeParseQuestions(raw);

    if (questions.length !== 3) {
      throw new Error("Model did not return exactly 3 questions.");
    }

    return NextResponse.json({ questions } satisfies GenerateQuestionsResponse);
  } catch (err) {
    console.error("Failed to generate clarifying questions:", err);
    return NextResponse.json(
      { error: "Failed to generate clarifying questions." },
      { status: 500 }
    );
  }
}
