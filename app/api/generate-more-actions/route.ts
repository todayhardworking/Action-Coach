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

interface PreviousAction {
  title?: string;
  description?: string;
  frequency?: string;
}

interface GenerateMoreActionsRequest {
  goalTitle?: string;
  smart?: SmartBreakdown;
  previousActions?: PreviousAction[];
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
  completedDates: string[];
  isArchived: boolean;
  createdAt: string;
}

interface GenerateMoreActionsResponse {
  actions: ActionSuggestion[];
}

const systemPrompt = `You are a friendly coach who proposes fresh, practical actions for a SMART goal.
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
      "completedDates": [timestamp, ...],
      "isArchived": boolean,
      "createdAt": timestamp
    }
  ]
}
Rules:
- Generate 4 to 8 new actions that are meaningfully different from any provided previous actions.
- Avoid overlapping, rephrasing, or merging previous ideas. Introduce new angles (resources, accountability, routines, checkpoints).
- Each action must be clear, concise, and tied to the SMART goal.
- Titles should be short and action-oriented, without repeating SMART text.
- Description in 3-4 sentences and easy to understand.
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
    .map((action) => {
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
        completedDates,
        isArchived: Boolean(action.isArchived) && action.isArchived === true ? true : false,
        createdAt,
        ...(description ? { description } : {}),
        ...(repeatConfig ? { repeatConfig } : {}),
      };

      return cleanedAction;
    })
    .filter((action): action is ActionSuggestion => action !== null)
    .slice(0, 8);

  return cleaned;
}

function extractActions(content: string, fallbackTargetId: string): ActionSuggestion[] {
  const attemptParse = (text: string): ActionSuggestion[] => {
    try {
      const parsed = JSON.parse(text) as Partial<GenerateMoreActionsResponse>;
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
  if (direct.length >= 4) {
    return direct;
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const embedded = attemptParse(jsonMatch[0]);
    if (embedded.length >= 4) {
      return embedded;
    }
  }

  return [];
}

export async function POST(request: Request) {
  let body: GenerateMoreActionsRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const goalTitle = sanitizeText(body.goalTitle);
  const smart = sanitizeSmart(body.smart);
  const targetId = sanitizeText(body.targetId);
  const previousActions = Array.isArray(body.previousActions)
    ? body.previousActions
        .map((item) => ({ title: sanitizeText(item.title), description: sanitizeText(item.description) }))
        .filter((item) => item.title)
    : [];

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
      temperature: 0.8,
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
Previously suggested actions:\n${
            previousActions
              .map((action, index) => `${index + 1}. ${action.title}${
                action.description ? ` - ${action.description}` : ''
              }`)
              .join('\n') || 'None provided'
          }
Generate 4-8 new action ideas that are clearly different from all previous actions.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const actions = extractActions(content, targetId);

    if (actions.length < 4 || actions.length > 8) {
      throw new Error('Unable to parse 4-8 actions from the AI response.');
    }

    const filtered = actions.filter(
      (action) => !previousActions.some((prev) => prev.title.toLowerCase() === action.title.toLowerCase()),
    );

    if (filtered.length === 0) {
      return NextResponse.json({ error: 'Generated actions duplicated previous suggestions.' }, { status: 400 });
    }

    return NextResponse.json({ actions: filtered } satisfies GenerateMoreActionsResponse);
  } catch (error) {
    console.error('Failed to generate additional actions.', { error });
    return NextResponse.json({ error: 'Failed to generate additional actions.' }, { status: 500 });
  }
}
