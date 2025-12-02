import { NextResponse } from 'next/server';
import OpenAI from 'openai';

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

const systemPrompt = `You are a friendly goal-setting coach.
Return ONLY a JSON object with these exact fields:
{
  "goalTitle": string (6-12 words),
  "smart": {
    "specific": string,
    "measurable": string,
    "achievable": string,
    "relevant": string,
    "timeBased": string
  }
}
Requirements:
- Use a warm, conversational tone.
- Reflect the user's goal or problem and any clarifying answers.
- Each SMART field should be 1-2 sentences.
- Do not suggest actions or solutions yet.
- Do not add extra fields or commentary.
- Ensure JSON is valid.`;

function sanitizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeAnswers(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 3);
}

function sanitizeSmart(smart: Partial<SmartBreakdown>): SmartBreakdown | null {
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

function extractSmart(content: string): GenerateSmartResponse | null {
  const attemptParse = (text: string): GenerateSmartResponse | null => {
    try {
      const parsed = JSON.parse(text) as Partial<GenerateSmartResponse>;
      const goalTitle = sanitizeText(parsed.goalTitle);
      const smart = parsed.smart ? sanitizeSmart(parsed.smart) : null;

      if (goalTitle && smart) {
        return { goalTitle, smart };
      }
    } catch {
      // Ignore parse errors and continue with fallback parsing strategies.
    }
    return null;
  };

  const direct = attemptParse(content);
  if (direct) {
    return direct;
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const embedded = attemptParse(jsonMatch[0]);
    if (embedded) {
      return embedded;
    }
  }

  return null;
}

export async function POST(request: Request) {
  let body: GenerateSmartRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const userInput = sanitizeText(body.userInput);
  const answers = sanitizeAnswers(body.answers);

  if (!userInput) {
    return NextResponse.json({ error: 'userInput is required.' }, { status: 400 });
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
          content: `Goal or problem: "${userInput}"\nClarifying answers: ${answers.length > 0 ? answers.join(' | ') : 'None provided'}.\nGenerate the SMART breakdown as instructed.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const parsed = extractSmart(content);

    if (!parsed) {
      throw new Error('Unable to parse SMART breakdown from the AI response.');
    }

    return NextResponse.json(parsed satisfies GenerateSmartResponse);
  } catch (error) {
    console.error('Failed to generate SMART breakdown.', { error });
    return NextResponse.json({ error: 'Failed to generate SMART breakdown.' }, { status: 500 });
  }
}
