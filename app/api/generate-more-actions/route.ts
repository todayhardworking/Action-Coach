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

interface PreviousAction {
  title?: string;
  description?: string;
}

interface GenerateMoreActionsRequest {
  goalTitle?: string;
  smart?: Partial<SmartBreakdown>;
  previousActions?: PreviousAction[];
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

interface GenerateMoreActionsResponse {
  actions: ActionSuggestion[];
}

//
// ─────────────────────────────────────────
// SYSTEM PROMPT (Compact & JSON-Stable)
// ─────────────────────────────────────────
//
const systemPrompt = `
You create additional practical actions for a SMART goal.
Return ONLY a JSON object:

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
- Generate 4 to 8 new actions.
- MUST be different from previous actions.
- Titles are short and actionable.
- Description is 2–3 friendly sentences.
- Omit repeatConfig for daily/once.
- Keep JSON valid.
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
// Parse JSON safely
// ─────────────────────────────────────────
//
function safeParseActions(
  raw: string,
  targetId: string
): ActionSuggestion[] {
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
    .filter(Boolean)
    .slice(0, 8);
}

//
// ─────────────────────────────────────────
// MAIN API ROUTE
// ─────────────────────────────────────────
//
export async function POST(request: Request) {
  let body: GenerateMoreActionsRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const goalTitle = sanitizeText(body.goalTitle);
  const smart = body.smart;
  const targetId = sanitizeText(body.targetId);

  const previousActions = Array.isArray(body.previousActions)
    ? body.previousActions
        .map((p) => sanitizeText(p.title))
        .filter((t) => t.length > 0)
    : [];

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
      { error: "targetId is required." },
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
    // Call new Responses API
    //
    const completion = await openai.responses.create({
      model: "gpt-4o",
      temperature: 0.8,
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

Previous Actions:
${previousActions.length ? previousActions.join(", ") : "None"}

Generate 4–8 new actions that are clearly different.
          `
        }
      ]
    });

    const raw = completion.output_text ?? "";
    const actions = safeParseActions(raw, targetId);

    if (actions.length < 4 || actions.length > 8) {
      throw new Error("Invalid number of actions produced.");
    }

    //
    // Remove duplicates
    //
    const filtered = actions.filter(
      (a) =>
        !previousActions.some(
          (prev) => prev.toLowerCase() === a.title.toLowerCase()
        )
    );

    if (filtered.length === 0) {
      return NextResponse.json(
        { error: "Generated actions duplicated previous suggestions." },
        { status: 400 }
      );
    }

    return NextResponse.json({ actions: filtered } satisfies GenerateMoreActionsResponse);
  } catch (err) {
    console.error("Failed to generate more actions:", err);
    return NextResponse.json(
      { error: "Failed to generate additional actions." },
      { status: 500 }
    );
  }
}
