import { auth } from "./firebaseClient";

export type SmartFields = {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timebound: string;
};

export type RepeatConfig = {
  onDays?: string[];
  dayOfMonth?: number;
};

export type ActionPlanItem = {
  actionId: string;
  targetId: string;
  title: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly" | "once";
  repeatConfig?: RepeatConfig;
  order?: number;
  completedDates: string[];
  isArchived: boolean;
  createdAt: string;
  userDeadline?: string;
};

interface GenerateQuestionsResponse {
  questions: string[];
  error?: string;
}

interface GenerateSmartResponse {
  goalTitle: string;
  smart: {
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBased: string;
  };
  error?: string;
}

interface GenerateActionsResponse {
  actions: ActionPlanItem[];
  error?: string;
}

interface SaveGoalResponse {
  success?: boolean;
  targetId?: string;
  error?: string;
}

export function toApiSmart(smart: SmartFields) {
  return {
    specific: smart.specific,
    measurable: smart.measurable,
    achievable: smart.achievable,
    relevant: smart.relevant,
    timeBased: smart.timebound,
  };
}

export function normalizeSmart(smart: GenerateSmartResponse["smart"]): SmartFields {
  return {
    specific: smart.specific ?? "",
    measurable: smart.measurable ?? "",
    achievable: smart.achievable ?? "",
    relevant: smart.relevant ?? "",
    timebound: smart.timeBased ?? "",
  };
}

async function handleJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Something went wrong.");
  }
  return data;
}

async function buildAuthHeaders(additional: HeadersInit = {}) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be signed in to continue.");
  }

  const token = await currentUser.getIdToken();
  return {
    ...additional,
    Authorization: `Bearer ${token}`,
  };
}

export async function generateQuestions(goalTitle: string) {
  const response = await fetch("/api/generate-questions", {
    method: "POST",
    headers: await buildAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ userInput: goalTitle }),
  });

  const data = await handleJson<GenerateQuestionsResponse>(response);
  return data.questions;
}

export async function generateSmart(goalTitle: string, answers: string[]) {
  const response = await fetch("/api/generate-smart", {
    method: "POST",
    headers: await buildAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ userInput: goalTitle, answers }),
  });

  const data = await handleJson<GenerateSmartResponse>(response);
  return { goalTitle: data.goalTitle, smart: normalizeSmart(data.smart) };
}

export async function generateActions(goalTitle: string, smart: SmartFields) {
  const response = await fetch("/api/generate-actions", {
    method: "POST",
    headers: await buildAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ goalTitle, smart: toApiSmart(smart) }),
  });

  const data = await handleJson<GenerateActionsResponse>(response);
  return data.actions.map((action, index) => ({
    ...action,
    order: action.order ?? index + 1,
    userDeadline: "",
  }));
}

export async function generateMoreActions(
  goalTitle: string,
  smart: SmartFields,
  previousActions: ActionPlanItem[],
) {
  const response = await fetch("/api/generate-more-actions", {
    method: "POST",
    headers: await buildAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      goalTitle,
      smart: toApiSmart(smart),
      previousActions: previousActions.map((action) => ({
        title: action.title,
        description: action.description,
      })),
    }),
  });

  const data = await handleJson<GenerateActionsResponse>(response);
  return data.actions.map((action, index) => ({
    ...action,
    order: action.order ?? index + 1,
    userDeadline: "",
  }));
}

export interface SaveGoalPayload {
  uid: string;
  goalTitle: string;
  smart: SmartFields;
  actions: ActionPlanItem[];
  questions?: string[];
  createdAt?: string;
}

export async function saveGoalData(payload: SaveGoalPayload) {
  const response = await fetch("/api/save-goal-data", {
    method: "POST",
    headers: await buildAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      userId: payload.uid,
      goalTitle: payload.goalTitle,
      smart: toApiSmart(payload.smart),
      actions: payload.actions.map((action) => ({
        title: action.title,
        deadline: action.userDeadline?.trim() || "",
        description: action.description?.trim() || "",
      })),
    }),
  });

  return handleJson<SaveGoalResponse>(response);
}
