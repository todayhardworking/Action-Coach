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
}

interface GenerateMoreActionsRequest {
  goalTitle?: string;
  smart?: SmartBreakdown;
  previousActions?: PreviousAction[];
}

interface ActionIdea {
  title: string;
  description?: string;
  recommendedDeadline?: string;
}

interface GenerateMoreActionsResponse {
  actions: ActionIdea[];
}

const systemPrompt = `You are a friendly coach who proposes fresh, practical actions for a SMART goal.
Return ONLY a JSON object with this exact shape:
{
  "actions": [
    {
      "title": string,
      "description": string,
      "recommendedDeadline": string
    }
  ]
}
Rules:
- Generate 4 to 8 new actions that are meaningfully different from any provided previous actions.
- Avoid overlapping, rephrasing, or merging previous ideas. Introduce new angles (resources, accountability, routines, checkpoints).
- Each action must be clear, concise, and tied to the SMART goal.
- Titles should be short and action-oriented, without repeating SMART text.
- Description in 3-4 sentences and easy to understand.
- recommendedDeadline can be things like "3 days", "1 week", "daily", or "monthly".
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

function sanitizeActions(actions: ActionIdea[]): ActionIdea[] {
  const cleaned = actions
    .map((action) => ({
      title: sanitizeText(action.title),
      description: sanitizeText(action.description),
      recommendedDeadline: sanitizeText(action.recommendedDeadline),
    }))
    .filter((action) => action.title.length > 0);

  return cleaned
    .map(({ title, description, recommendedDeadline }) => ({
      title,
      ...(description ? { description } : {}),
      ...(recommendedDeadline ? { recommendedDeadline } : {}),
    }))
    .slice(0, 8);
}

function extractActions(content: string): ActionIdea[] {
  const attemptParse = (text: string): ActionIdea[] => {
    try {
      const parsed = JSON.parse(text) as Partial<GenerateMoreActionsResponse>;
      if (Array.isArray(parsed.actions)) {
        return sanitizeActions(
          parsed.actions.filter(
            (item): item is ActionIdea => typeof item === 'object' && item !== null,
          ),
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
Previously suggested actions:\n${previousActions
            .map((action, index) => `${index + 1}. ${action.title}${action.description ? ` - ${action.description}` : ''}`)
            .join('\n') || 'None provided'}
Generate 4-8 new action ideas that are clearly different from all previous actions.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const actions = extractActions(content);

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
