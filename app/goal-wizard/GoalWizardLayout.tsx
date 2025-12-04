"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ActionSuggestion,
  FinalGoalPayload,
  SmartData,
  generateActions,
  generateQuestions,
  generateSmart,
  saveGoal,
} from "../../lib/goalWizardApi";
import Step1GoalTitle from "./Step1GoalTitle";
import Step2Questions from "./Step2Questions";
import Step3Smart from "./Step3Smart";
import Step4Actions from "./Step4Actions";

export type WizardAction = ActionSuggestion & {
  selected: boolean;
  userDeadline: string;
};

export type WizardContextValue = {
  step: number;
  goalTitle: string;
  userId: string;
  questions: string[];
  answers: string[];
  smart: SmartData;
  actions: WizardAction[];
  loading: {
    questions: boolean;
    smart: boolean;
    actions: boolean;
    saving: boolean;
  };
  error: string | null;
  setGoalTitle: (title: string) => void;
  setUserId: (uid: string) => void;
  setQuestions: (questions: string[]) => void;
  setAnswers: (answers: string[]) => void;
  setSmart: (smart: SmartData) => void;
  setActions: (actions: WizardAction[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  requestQuestions: () => Promise<void>;
  requestSmart: () => Promise<void>;
  requestActions: () => Promise<void>;
  saveGoalData: () => Promise<void>;
  resetError: () => void;
};

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

const initialSmart: SmartData = {
  specific: "",
  measurable: "",
  achievable: "",
  relevant: "",
  timebound: "",
};

const storageKey = "goal-wizard-state-v1";

function loadStoredState(): Partial<WizardContextValue> | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Partial<WizardContextValue>) : null;
  } catch {
    return null;
  }
}

function persistState(value: {
  step: number;
  goalTitle: string;
  userId: string;
  questions: string[];
  answers: string[];
  smart: SmartData;
  actions: WizardAction[];
}) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(storageKey, JSON.stringify(value));
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within GoalWizardLayout");
  return ctx;
}

export default function GoalWizardLayout() {
  const stored = useMemo(loadStoredState, []);
  const [step, setStep] = useState(Math.min(Math.max(stored?.step ?? 1, 1), 4));
  const [goalTitle, setGoalTitle] = useState(stored?.goalTitle ?? "");
  const [userId, setUserId] = useState(stored?.userId ?? "");
  const [questions, setQuestions] = useState<string[]>(stored?.questions ?? []);
  const [answers, setAnswers] = useState<string[]>(stored?.answers ?? []);
  const [smart, setSmart] = useState<SmartData>(stored?.smart ?? { ...initialSmart });
  const [actions, setActions] = useState<WizardAction[]>(stored?.actions ?? []);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState({ questions: false, smart: false, actions: false, saving: false });

  useEffect(() => {
    persistState({ step, goalTitle, userId, questions, answers, smart, actions });
  }, [step, goalTitle, userId, questions, answers, smart, actions]);

  const resetError = () => setError(null);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const requestQuestions = async () => {
    if (!goalTitle.trim()) {
      setError("Please enter a goal title to continue.");
      return;
    }
    setLoading((prev) => ({ ...prev, questions: true }));
    setError(null);
    setStatusMessage(null);
    try {
      const generated = await generateQuestions(goalTitle.trim());
      setQuestions(generated);
      setAnswers(generated.map(() => ""));
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate questions.");
    } finally {
      setLoading((prev) => ({ ...prev, questions: false }));
    }
  };

  const requestSmart = async () => {
    if (!goalTitle.trim()) {
      setError("Add a goal title first.");
      return;
    }
    setLoading((prev) => ({ ...prev, smart: true }));
    setError(null);
    setStatusMessage(null);
    try {
      const generated = await generateSmart(goalTitle.trim(), answers.map((answer) => answer.trim()));
      setGoalTitle(generated.goalTitle);
      setSmart(generated.smart);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate SMART details.");
    } finally {
      setLoading((prev) => ({ ...prev, smart: false }));
    }
  };

  const requestActions = async () => {
    const smartValues = Object.values(smart).map((value) => value.trim());
    if (smartValues.some((value) => value.length === 0)) {
      setError("Fill in each SMART field before creating actions.");
      return;
    }
    setLoading((prev) => ({ ...prev, actions: true }));
    setError(null);
    setStatusMessage(null);
    try {
      const generated = await generateActions(goalTitle.trim(), smart);
      setActions(
        generated.map((action) => ({
          ...action,
          selected: true,
          userDeadline: "",
        })),
      );
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate actions.");
    } finally {
      setLoading((prev) => ({ ...prev, actions: false }));
    }
  };

  const saveGoalData = async () => {
    const selectedActions = actions.filter((action) => action.selected && action.title.trim().length > 0);

    if (!userId.trim()) {
      setError("Please provide your user ID before saving.");
      return;
    }

    if (selectedActions.length === 0) {
      setError("Select at least one action to save.");
      return;
    }

    if (selectedActions.some((action) => !action.userDeadline)) {
      setError("Please choose a deadline for each selected action.");
      return;
    }

    setLoading((prev) => ({ ...prev, saving: true }));
    setError(null);
    setStatusMessage(null);

    const payload: FinalGoalPayload = {
      uid: userId.trim(),
      createdAt: new Date().toISOString(),
      goalTitle: goalTitle.trim(),
      questions,
      smart,
      actions: selectedActions.map((action) => ({
        title: action.title.trim(),
        deadline: action.userDeadline,
      })),
    };

    try {
      await saveGoal(payload);
      setStatusMessage("Goal saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save goal.");
    } finally {
      setLoading((prev) => ({ ...prev, saving: false }));
    }
  };

  const contextValue: WizardContextValue = {
    step,
    goalTitle,
    userId,
    questions,
    answers,
    smart,
    actions,
    loading,
    error,
    setGoalTitle,
    setUserId,
    setQuestions,
    setAnswers,
    setSmart,
    setActions,
    nextStep,
    prevStep,
    requestQuestions,
    requestSmart,
    requestActions,
    saveGoalData,
    resetError,
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <Step1GoalTitle />;
      case 2:
        return <Step2Questions />;
      case 3:
        return <Step3Smart />;
      case 4:
      default:
        return <Step4Actions />;
    }
  };

  return (
    <WizardContext.Provider value={contextValue}>
      <main className='min-h-screen bg-neutral-100 font-["SF Pro Text",system-ui,-apple-system,"Segoe UI",sans-serif] text-neutral-900'>
        <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 pb-24 pt-10 sm:pt-12">
          <header className="space-y-2">
            <p className="text-sm font-medium text-[#007AFF]">Goal Wizard</p>
            <h1 className="text-4xl font-semibold tracking-tight">Create your goal</h1>
            <p className="text-sm text-neutral-500">Guided steps inspired by iOS to refine your goal with AI.</p>
          </header>
          {error ? (
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-[#d93025] shadow-sm">
              {error}
            </div>
          ) : null}
          {statusMessage ? (
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-[#0f9d58] shadow-sm">
              {statusMessage}
            </div>
          ) : null}
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
            <div className="border-b border-neutral-200 px-5 py-4 text-sm text-neutral-500">Step {step} of 4</div>
            <div className="p-5 sm:p-6 transition-all duration-300 ease-in-out">{renderStepContent()}</div>
          </div>
        </div>
      </main>
    </WizardContext.Provider>
  );
}
