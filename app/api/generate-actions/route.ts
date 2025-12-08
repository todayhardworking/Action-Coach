import { NextResponse } from "next/server";
import OpenAI from "openai";
import { v4 as uuid } from "uuid";

interface SmartBreakdown {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBased: string;
}

interface GenerateActionsRequest {
  goalTitle?: string;
  smart?: Partial<SmartBreakdown>;
  targetId?: string;
}

type Frequency = "daily" | "weekly" | "monthly" | "once";

interface RepeatConfig {
  onDays?: string[];
  dayOfMonth?: number;
}

interface ActionSuggestion {
  actionId: string;
  targetId: string;
  title: string;
  description?: string;
  frequency: Frequency;
  repeatConfig?: RepeatConfig;
  completedDates: string[];
  isArchived: boolean;
  createdAt: string;
}

interface GenerateActionsResponse {
  actions: ActionSuggestion[];
}

//
// ─────────────────────────────────────────
// SYSTEM PROMPT (Compact & Stable)
// ─────────────────────────────────────────
//
const systemPrompt = `
You create simple, practical actions for a SMART goal.
Return ONLY a JSON object with this structure:

{
  "actions": [
    {
      "actionId": string,
      "targetId": string,
      "title": string,
      "description": string,
      "frequency": "daily" | "weekly" | "monthly" | "once",
      "repeatConfig": { "onDays": [...], "dayOfMonth": number },
      "completedDates": [],
      "isArchived": boolean,
      "createdAt": timestamp
    }
  ]
}

Rules:
- Generate 6 to 10 actions.
- Keep titles short and actionable.
- Descriptions must be 2–3 friendly sentences.
- If frequency is daily or once → omit repeatConfig.
- Keep JSON valid. No text outside the JSON object.
`;

//
// ─────────────────────────────────────────
// Sanitize helpers
// ─────────────────────────────────────────
//
const sanitizeText = (v: unknown) =>
  typeof v === "string" ? v.trim() : "";

function sanitizeFrequency(v: unknown): Frequency {
  const f = typeof v === "string" ? v.trim().toLowerCase() : "";
  return ["daily", "weekly", "monthly", "once"].includes(f)
    ? (f as Frequency)
    : "once";
}

function sanitizeRepeatConfig(raw: any): RepeatConfig | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const validDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  const onDays = Array.isArray(raw.onDays)
    ? raw.onDays
        .map((d: any) => (typeof d === "string" ? d.toLowerCase().trim() : ""))
        .filter((d: string) => validDays.includes(d))
    : undefined;

  const dayOfMonth =
    typeof raw.dayOfMonth === "number" &&
    raw.dayOfMonth >= 1 &&
    raw.dayOfMonth <= 31
      ? Math.floor(raw.dayOfMonth)
      : undefined;

  if (!onDays?.length && !dayOfMonth) return undefined;

  return {
    ...(onDays?.length ? { onDays } : {}),
    ...(dayOfMonth ? { dayOfMonth } : {})
  };
}

function sanitizeTimestamp(v: any): string | null {
  const date = new Date(v);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

//
// ─────────────────────────────────────────
// Parse assistant JSON safely
// ─────────────────────────────────────────
//
function safeParseActions(raw: string, targetId: string): ActionSuggestion[] {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed.actions)) return [];

  const now = new Date().toISOString();

  return parsed.actions
    .map((a: any) => {
      const title = sanitizeText(a.title);
      if (!title) return null;

      return {
        actionId: sanitizeText(a.actionId) || uuid(),
        targetId,
        title,
        description: sanitizeText(a.description) || undefined,
        frequency: sanitizeFrequency(a.frequency),
        repeatConfig: sanitizeRepeatConfig(a.repeatConfig),
        completedDates: [],
        isArchived: false,
        createdAt: sanitizeTimestamp(a.createdAt) ?? now
      } as ActionSuggestion;
    })
    .filter((a: any) => a !== null)
    .slice(0, 10);
}

//
// ─────────────────────────────────────────
// MAIN API ROUTE
// ─────────────────────────────────────────
//
export async function POST(request: Request) {
  let body: GenerateActionsRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const goalTitle = sanitizeText(body.goalTitle);
  const smart = body.smart;
  const targetId = sanitizeText(body.targetId);

  if (!goalTitle) {
    return NextResponse.json({ error: "goalTitle is required." }, { status: 400 });
  }

  if (
    !smart ||
    !smart.specific ||
    !smart.measurable ||
    !smart.achievable ||
    !smart.relevant ||
    !smart.timeBased
  ) {
    return NextResponse.json({ error: "SMART fields are required." }, { status: 400 });
  }

  if (!targetId) {
    return NextResponse.json(
      { error: "targetId is required to link actions to a goal." },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OpenAI key." }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey });

  try {
    //
    // Call OpenAI Responses API
    //
    const completion = await openai.responses.create({
      model: "gpt-4o",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `
Goal: "${goalTitle}"
SMART:
- Specific: ${smart.specific}
- Measurable: ${smart.measurable}
- Achievable: ${smart.achievable}
- Relevant: ${smart.relevant}
- Time-Based: ${smart.timeBased}

Generate 6-10 actions.
          `
        }
      ]
    });

    const raw = completion.output_text ?? "";
    const actions = safeParseActions(raw, targetId);

    if (actions.length < 6 || actions.length > 10) {
      throw new Error("Invalid number of actions produced.");
    }

    return NextResponse.json({ actions } satisfies GenerateActionsResponse);
  } catch (err) {
    console.error("Failed to generate actions:", err);
    return NextResponse.json(
      { error: "Failed to generate actions." },
      { status: 500 }
    );
  }
}
