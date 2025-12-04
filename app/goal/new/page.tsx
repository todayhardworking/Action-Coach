"use client";

import { useMemo, useState } from "react";
import { RequireAuth } from "../../../components/auth/RequireAuth";

type SmartFields = {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBased: string;
};

type ActionItem = {
  title: string;
  description?: string;
  recommendedDeadline?: string;
  userDeadline?: string;
};

type GenerateQuestionsResponse = {
  questions: string[];
  error?: string;
};

type GenerateSmartResponse = {
  goalTitle: string;
  smart: SmartFields;
  error?: string;
};

type GenerateActionsResponse = {
  actions: ActionItem[];
  error?: string;
};

const inputClasses =
  "w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500";

const initialSmart: SmartFields = {
  specific: "",
  measurable: "",
  achievable: "",
  relevant: "",
  timeBased: "",
};

const stepTitles = [
  "Step 1 · Describe Your Goal", 
  "Step 2 · Clarifying Questions", 
  "Step 3 · SMART Breakdown", 
  "Step 4 · Action Suggestions",
];

export default function NewGoalPage() {
  const [step, setStep] = useState(1);
  const [userInput, setUserInput] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [goalTitle, setGoalTitle] = useState("");
  const [smart, setSmart] = useState<SmartFields>({ ...initialSmart });
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTitle = useMemo(() => stepTitles[step - 1] ?? "Goal Setup", [step]);

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleGenerateQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput }),
      });

      const data: GenerateQuestionsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate questions.");
      }

      const receivedQuestions = data.questions ?? [];
      setQuestions(receivedQuestions);
      setAnswers(receivedQuestions.map(() => ""));
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSmart = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput, answers }),
      });

      const data: GenerateSmartResponse = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate SMART breakdown.");
      }

      setGoalTitle(data.goalTitle);
      setSmart(data.smart);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateActions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalTitle, smart }),
      });

      const data: GenerateActionsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate actions.");
      }

      const receivedActions = data.actions ?? [];
      setActions(
        receivedActions.map((action) => ({
          ...action,
          userDeadline: "",
        })),
      );
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    const payload = {
      userInput,
      questions,
      answers,
      goalTitle,
      smart,
      actions,
    };

    console.log("Goal payload", payload);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800" htmlFor="user-input">
                What goal or problem are you working on?
              </label>
              <textarea
                id="user-input"
                className={`${inputClasses} min-h-[180px]`}
                placeholder="Describe what you want to achieve or solve..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Step 1 of 4</span>
              <button
                className="bg-blue-600 text-white rounded-xl px-4 py-2 shadow hover:bg-blue-700 disabled:opacity-50"
                onClick={handleGenerateQuestions}
                disabled={loading}
              >
                Next
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {questions.length === 0 ? (
                <p className="text-slate-700">No questions yet. Try generating again.</p>
              ) : (
                questions.map((question, index) => (
                  <div className="space-y-2" key={question}>
                    <p className="text-sm font-medium text-slate-800">{question}</p>
                    <textarea
                      className={`${inputClasses} min-h-[120px]`}
                      placeholder="Your answer..."
                      value={answers[index] ?? ""}
                      onChange={(e) =>
                        setAnswers((prev) => {
                          const updated = [...prev];
                          updated[index] = e.target.value;
                          return updated;
                        })
                      }
                    />
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between">
              <button
                className="text-sm text-slate-600 hover:text-slate-900"
                type="button"
                onClick={handleBack}
              >
                Back
              </button>
              <button
                className="bg-blue-600 text-white rounded-xl px-4 py-2 shadow hover:bg-blue-700 disabled:opacity-50"
                onClick={handleGenerateSmart}
                disabled={loading}
              >
                Next: SMART Breakdown
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800" htmlFor="goal-title">
                  Goal title
                </label>
                <input
                  id="goal-title"
                  className={inputClasses}
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                />
              </div>
              {(
                [
                  { key: "specific", label: "Specific" },
                  { key: "measurable", label: "Measurable" },
                  { key: "achievable", label: "Achievable" },
                  { key: "relevant", label: "Relevant" },
                  { key: "timeBased", label: "Time-Based" },
                ] as const
              ).map(({ key, label }) => (
                <div className="space-y-2" key={key}>
                  <label className="text-sm font-medium text-slate-800" htmlFor={key}>
                    {label}
                  </label>
                  <textarea
                    id={key}
                    className={`${inputClasses} min-h-[100px]`}
                    value={smart[key]}
                    onChange={(e) => setSmart((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button
                className="text-sm text-slate-600 hover:text-slate-900"
                type="button"
                onClick={handleBack}
              >
                Back
              </button>
              <button
                className="bg-blue-600 text-white rounded-xl px-4 py-2 shadow hover:bg-blue-700 disabled:opacity-50"
                onClick={handleGenerateActions}
                disabled={loading}
              >
                Next: Action Ideas
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {actions.length === 0 ? (
                <p className="text-slate-700">No actions yet. Try generating again.</p>
              ) : (
                actions.map((action, index) => (
                  <div
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
                    key={`${action.title}-${index}`}
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800" htmlFor={`action-title-${index}`}>
                        Action title
                      </label>
                      <input
                        id={`action-title-${index}`}
                        className={inputClasses}
                        value={action.title}
                        onChange={(e) =>
                          setActions((prev) => {
                            const updated = [...prev];
                            updated[index] = { ...updated[index], title: e.target.value };
                            return updated;
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800" htmlFor={`action-description-${index}`}>
                        Description
                      </label>
                      <textarea
                        id={`action-description-${index}`}
                        className={`${inputClasses} min-h-[100px]`}
                        value={action.description ?? ""}
                        onChange={(e) =>
                          setActions((prev) => {
                            const updated = [...prev];
                            updated[index] = { ...updated[index], description: e.target.value };
                            return updated;
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-800" htmlFor={`recommended-${index}`}>
                          Suggested timeline
                        </label>
                        <input
                          id={`recommended-${index}`}
                          className={inputClasses}
                          value={action.recommendedDeadline ?? ""}
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-800" htmlFor={`deadline-${index}`}>
                          Your deadline
                        </label>
                        <input
                          id={`deadline-${index}`}
                          type="date"
                          className={inputClasses}
                          value={action.userDeadline ?? ""}
                          onChange={(e) =>
                            setActions((prev) => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], userDeadline: e.target.value };
                              return updated;
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between">
              <button
                className="text-sm text-slate-600 hover:text-slate-900"
                type="button"
                onClick={handleBack}
              >
                Back
              </button>
              <button
                className="bg-blue-600 text-white rounded-xl px-4 py-2 shadow hover:bg-blue-700 disabled:opacity-50"
                type="button"
                onClick={handleSave}
                disabled={loading}
              >
                Review &amp; Save (console only)
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <RequireAuth>
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6">
          <div className="w-full max-w-3xl rounded-2xl border bg-white p-6 shadow-md md:p-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-slate-900">Goal Setup</h1>
                <p className="text-slate-600">Craft your goal with clarifying questions, SMART details, and guided actions.</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-semibold text-slate-900">{currentTitle}</p>
                <p className="text-sm text-slate-600">Follow the steps to refine and plan your goal.</p>
              </div>
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {error}
                </div>
              ) : null}
              {renderStepContent()}
            </div>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
