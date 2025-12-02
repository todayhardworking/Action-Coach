import { NextResponse } from 'next/server';
import OpenAI from 'openai';

interface GenerateQuestionsRequest {
  userInput?: string;
}

interface GenerateQuestionsResponse {
  questions: string[];
}

const systemPrompt = `You are a friendly assistant helping a beginner describe their goal or problem.
Return ONLY a JSON object with a \"questions\" array containing exactly three short, conversational clarifying questions.
The questions should NOT include advice, steps, SMART breakdowns, or solutions.
Avoid numbered lists, bullet points, and any text outside the JSON object.`;

function sanitizeQuestions(candidates: string[]): string[] {
  const cleaned = candidates
    .map((question) => question.trim())
    .filter((question) => question.length > 0)
    .map((question) => (question.endsWith('?') ? question : `${question}?`));

  return cleaned.slice(0, 3);
}

function extractQuestions(content: string): string[] {
  const attemptParse = (text: string): string[] => {
    try {
      const parsed = JSON.parse(text) as Partial<GenerateQuestionsResponse>;
      if (Array.isArray(parsed.questions)) {
        return sanitizeQuestions(parsed.questions.filter((item): item is string => typeof item === 'string'));
      }
    } catch {
      // Ignore parse errors and continue with fallback parsing strategies.
    }
    return [];
  };

  const fromDirectJson = attemptParse(content);
  if (fromDirectJson.length === 3) {
    return fromDirectJson;
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const fromEmbeddedJson = attemptParse(jsonMatch[0]);
    if (fromEmbeddedJson.length === 3) {
      return fromEmbeddedJson;
    }
  }

  const questionMatches = content.match(/[^?]+\?/g) ?? [];
  const fromQuestions = sanitizeQuestions(questionMatches);
  if (fromQuestions.length === 3) {
    return fromQuestions;
  }

  return [];
}

export async function POST(request: Request) {
  let body: GenerateQuestionsRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const userInput = typeof body.userInput === 'string' ? body.userInput.trim() : '';

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
          content: `User target or problem: "${userInput}"\nGenerate three clarifying questions only.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const questions = extractQuestions(content);

    if (questions.length !== 3) {
      throw new Error('Unable to parse three questions from the AI response.');
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Failed to generate clarifying questions.', { error });
    return NextResponse.json({ error: 'Failed to generate clarifying questions.' }, { status: 500 });
  }
}
