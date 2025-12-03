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
}

interface ActionIdea {
  title: string;
  description?: string;
  recommendedDeadline?: string;
}

interface GenerateActionsResponse {
  actions: ActionIdea[];
}

const systemPrompt = `You are a friendly coach who creates practical, beginner-friendly actions based on a SMART goal.
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
- Generate between 6 and 10 actions.
- Each action must be clear, concise, and directly tied to the SMART goal.
- Include a mix of quick wins, medium steps, and slightly longer tasks.
- Avoid overlapping or redundant tasks.
- Titles should be short and action-oriented, without repeating SMART text.
- Description and recommendedDeadline are optional but must be strings when provided.
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
    .slice(0, 10);
}

function extractActions(content: string): ActionIdea[] {
  const attemptParse = (text: string): ActionIdea[] => {
    try {
      const parsed = JSON.parse(text) as Partial<GenerateActionsResponse>;
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
          content: `Goal title: "${goalTitle}"\nSMART details:\n- Specific: ${smart.specific}\n- Measurable: ${smart.measurable}\n- Achievable: ${smart.achievable}\n- Relevant: ${smart.relevant}\n- Time-based: ${smart.timeBased}\nGenerate 6-10 action ideas as instructed.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const actions = extractActions(content);

    if (actions.length < 6 || actions.length > 10) {
      throw new Error('Unable to parse 6-10 actions from the AI response.');
    }

    return NextResponse.json({ actions } satisfies GenerateActionsResponse);
  } catch (error) {
    console.error('Failed to generate actions.', { error });
    return NextResponse.json({ error: 'Failed to generate actions.' }, { status: 500 });
  }
}
