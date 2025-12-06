import crypto from 'crypto';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

interface SmartBreakdown {
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
  timeBased?: string;
}

interface GenerateActionsRequest {
  goalTitle?: string;
  smart?: SmartBreakdown;
  targetId?: string;
}

type Frequency = 'daily' | 'weekly' | 'monthly' | 'once';

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
  order?: number;
  completedDates: string[];
  isArchived: boolean;
  createdAt: string;
}

interface GenerateActionsResponse {
  actions: ActionSuggestion[];
}

const systemPrompt = `You are a friendly coach who creates practical, beginner-friendly actions based on a SMART goal.
Return ONLY a JSON object with this exact shape:
{
  "actions": [
    {
      "actionId": string,
      "targetId": string,
      "title": string,
      "description": string,
      "frequency": "daily" | "weekly" | "monthly" | "once",
      "repeatConfig": {
        "onDays": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        "dayOfMonth": number
      },
      "order": number,
      "completedDates": [timestamp, ...],
      "isArchived": boolean,
      "createdAt": timestamp
    }
  ]
}
Rules:
- Generate between 6 and 10 actions.
- Each action must be clear, concise, and directly tied to the SMART goal.
- Include a mix of quick wins, medium steps, and slightly longer tasks.
- Avoid overlapping or redundant tasks.
- Titles should be short and action-oriented, without repeating SMART text.
- Description in 3-4 sentences that is easy to understand.
- frequency must be one of: daily, weekly, monthly, or once.
- repeatConfig is only needed when frequency is weekly or monthly (for daily or once, keep it empty or null).
- completedDates should be an array of timestamps (can be empty).
- createdAt should be a timestamp for when the suggestion was created.
- Do not add any extra fields or commentary.
Ensure JSON is valid.`;

function sanitizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeSmart(smart?: SmartBreakdown): SmartBreakdown | null {
  if (!smart) return null;

  const specific = sanitizeText(smart.specific);
  const measurable = sanitizeText(smart.measurable);
  const achievable = sanitizeText(smart.achievable);
  const relevant = sanitizeText(smart.relevant);
  const timeBased = sanitizeText(smart.timeBased);

  if (specific && measurable && achievable && relevant && timeBased) {
    return { specific, measurable, achievable, relevant, timeBased };
  }

  return null;
}

function sanitizeFrequency(value: unknown): Frequency {
  const frequency = typeof value === 'string' ? value.toLowerCase().trim() : '';
  return ['daily', 'weekly', 'monthly', 'once'].includes(frequency)
    ? (frequency as Frequency)
    : 'once';
}

function sanitizeRepeatConfig(value: unknown): RepeatConfig | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const config = value as RepeatConfig;
  const onDays = Array.isArray(config.onDays)
    ? config.onDays
        .map((day) => (typeof day === 'string' ? day.toLowerCase().trim() : ''))
        .filter((day) => ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(day))
    : undefined;

  const dayOfMonth =
    typeof config.dayOfMonth === 'number' && config.dayOfMonth >= 1 && config.dayOfMonth <= 31
      ? Math.floor(config.dayOfMonth)
      : undefined;

  if ((onDays && onDays.length > 0) || dayOfMonth) {
    return { ...(onDays && onDays.length > 0 ? { onDays } : {}), ...(dayOfMonth ? { dayOfMonth } : {}) };
  }

  return undefined;
}

function sanitizeTimestamp(value: unknown): string | null {
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
}

function sanitizeActions(actions: Partial<ActionSuggestion>[], fallbackTargetId: string): ActionSuggestion[] {
  const now = new Date().toISOString();

  const cleaned = actions
    .map((action, index) => {
      const title = sanitizeText(action.title);
      if (!title) return null;

      const frequency = sanitizeFrequency(action.frequency);
      const repeatConfig = sanitizeRepeatConfig(action.repeatConfig);
      const createdAt = sanitizeTimestamp(action.createdAt) ?? now;
      const completedDates = Array.isArray(action.completedDates)
        ? action.completedDates
            .map((date) => sanitizeTimestamp(date))
            .filter((date): date is string => Boolean(date))
        : [];

      const description = sanitizeText(action.description);

      const cleanedAction: ActionSuggestion = {
        actionId: sanitizeText(action.actionId) || crypto.randomUUID(),
        targetId: sanitizeText(action.targetId) || fallbackTargetId,
        title,
        frequency,
        order: typeof action.order === 'number' ? action.order : index + 1,
        completedDates,
        isArchived: Boolean(action.isArchived) && action.isArchived === true ? true : false,
        createdAt,
        ...(description ? { description } : {}),
        ...(repeatConfig ? { repeatConfig } : {}),
      };

      return cleanedAction;
    })
    .filter((action): action is ActionSuggestion => action !== null)
    .slice(0, 10);

  return cleaned;
}

function extractActions(content: string, fallbackTargetId: string): ActionSuggestion[] {
  const attemptParse = (text: string): ActionSuggestion[] => {
    try {
      const parsed = JSON.parse(text) as Partial<GenerateActionsResponse>;
      if (Array.isArray(parsed.actions)) {
        const parsedActions = parsed.actions as unknown[];

        return sanitizeActions(
          parsedActions.filter(
            (item): item is Partial<ActionSuggestion> => typeof item === 'object' && item !== null,
          ),
          fallbackTargetId,
        );
      }
    } catch {
      // Ignore parse errors and continue with fallback parsing strategies.
    }
    return [];
  };

  const direct = attemptParse(content);
  if (direct.length >= 6) {
    return direct;
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const embedded = attemptParse(jsonMatch[0]);
    if (embedded.length >= 6) {
      return embedded;
    }
  }

  return [];
}

export async function POST(request: Request) {
  let body: GenerateActionsRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const goalTitle = sanitizeText(body.goalTitle);
  const smart = sanitizeSmart(body.smart);
  const targetId = sanitizeText(body.targetId);

  if (!goalTitle || !smart) {
    return NextResponse.json({ error: 'goalTitle and SMART fields are required.' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI configuration is missing.' }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Goal title: "${goalTitle}"
SMART details:
- Specific: ${smart.specific}
- Measurable: ${smart.measurable}
- Achievable: ${smart.achievable}
- Relevant: ${smart.relevant}
- Time-based: ${smart.timeBased}
Generate 6-10 action ideas as instructed.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const actions = extractActions(content, targetId);

    if (actions.length < 6 || actions.length > 10) {
      throw new Error('Unable to parse 6-10 actions from the AI response.');
    }

    return NextResponse.json({ actions } satisfies GenerateActionsResponse);
  } catch (error) {
    console.error('Failed to generate actions.', { error });
    return NextResponse.json({ error: 'Failed to generate actions.' }, { status: 500 });
  }
}
