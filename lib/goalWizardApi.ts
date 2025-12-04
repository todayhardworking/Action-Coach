export type SmartData = {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timebound: string;
};

export type ActionSuggestion = {
  title: string;
  description?: string;
  recommendedDeadline?: string;
};

export type FinalGoalPayload = {
  uid: string;
  createdAt: string;
  goalTitle: string;
  questions: string[];
  smart: SmartData;
  actions: { title: string; deadline: string }[];
};

async function handleJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as { error?: string } & T;

  if (!response.ok) {
    const message = typeof data.error === 'string' && data.error.length > 0 ? data.error : 'Request failed.';
    throw new Error(message);
  }

  return data;
}

export async function generateQuestions(goalTitle: string): Promise<string[]> {
  const response = await fetch('/api/generate-questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userInput: goalTitle }),
    cache: 'no-store',
    next: { revalidate: 0 },
  });

  const data = await handleJsonResponse<{ questions?: unknown }>(response);

  const questions = Array.isArray(data.questions)
    ? data.questions.filter((item): item is string => typeof item === 'string').map((item) => item.trim())
    : [];

  if (questions.length === 0) {
    throw new Error('No questions were returned.');
  }

  return questions;
}

export async function generateSmart(goalTitle: string, answers: string[]): Promise<{ goalTitle: string; smart: SmartData }>
{
  const response = await fetch('/api/generate-smart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userInput: goalTitle, answers }),
    cache: 'no-store',
    next: { revalidate: 0 },
  });

  const data = await handleJsonResponse<{ goalTitle?: string; smart?: { timeBased?: string } & Partial<SmartData> }>(response);

  const smart = data.smart;

  if (
    !data.goalTitle ||
    !smart ||
    !smart.specific ||
    !smart.measurable ||
    !smart.achievable ||
    !smart.relevant ||
    !(smart.timebound || smart.timeBased)
  ) {
    throw new Error('SMART data is incomplete.');
  }

  return {
    goalTitle: data.goalTitle,
    smart: {
      specific: smart.specific,
      measurable: smart.measurable,
      achievable: smart.achievable,
      relevant: smart.relevant,
      timebound: smart.timebound ?? smart.timeBased ?? '',
    },
  };
}

export async function generateActions(goalTitle: string, smart: SmartData): Promise<ActionSuggestion[]> {
  const response = await fetch('/api/generate-actions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      goalTitle,
      smart: {
        specific: smart.specific,
        measurable: smart.measurable,
        achievable: smart.achievable,
        relevant: smart.relevant,
        timeBased: smart.timebound,
      },
    }),
    cache: 'no-store',
    next: { revalidate: 0 },
  });

  const data = await handleJsonResponse<{ actions?: ActionSuggestion[] }>(response);

  if (!Array.isArray(data.actions) || data.actions.length === 0) {
    throw new Error('No actions were returned.');
  }

  return data.actions;
}

export async function saveGoal(payload: FinalGoalPayload): Promise<{ success: boolean; targetId?: string }> {
  const response = await fetch('/api/save-goal-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: payload.uid,
      goalTitle: payload.goalTitle,
      smart: {
        specific: payload.smart.specific,
        measurable: payload.smart.measurable,
        achievable: payload.smart.achievable,
        relevant: payload.smart.relevant,
        timeBased: payload.smart.timebound,
      },
      actions: payload.actions,
      createdAt: payload.createdAt,
    }),
    cache: 'no-store',
    next: { revalidate: 0 },
  });

  return handleJsonResponse<{ success: boolean; targetId?: string }>(response);
}
