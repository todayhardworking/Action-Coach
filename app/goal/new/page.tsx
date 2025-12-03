"use client";

import { useMemo, useState } from "react";

import { PrimaryButton, SecondaryButton } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { PageHeader } from "../../../components/ui/page-header";
import { SectionTitle } from "../../../components/ui/section-title";

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
  "w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition";

const initialSmart: SmartFields = {
  specific: "",
  measurable: "",
  achievable: "",
  relevant: "",
  timeBased: "",
};

const stepDetails = [
  {
    title: "Describe your goal",
    description: "Share the challenge or ambition you want to shape into an actionable plan.",
  },
  {
    title: "Clarifying questions",
    description: "Respond to tailored prompts to sharpen context before planning.",
  },
  {
    title: "SMART breakdown",
    description: "Refine the goal across Specific, Measurable, Achievable, Relevant, and Time-bound.",
  },
  {
    title: "Action suggestions",
    description: "Review recommended steps and choose timelines that work for you.",
  },
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

  const currentTitle = useMemo(() => stepDetails[step - 1]?.title ?? "Goal setup", [step]);

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
              <label className="text-sm font-medium text-neutral-800" htmlFor="user-input">
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
              <p className="text-sm text-neutral-600">Step 1 of 4</p>
              <PrimaryButton onClick={handleGenerateQuestions} disabled={loading}>
                Next
              </PrimaryButton>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {questions.length === 0 ? (
                <p className="text-sm text-neutral-700">No questions yet. Try generating again.</p>
              ) : (
                questions.map((question, index) => (
                  <div className="space-y-2" key={question}>
                    <p className="text-sm font-medium text-neutral-800">{question}</p>
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
            <div className="flex items-center justify-between gap-3">
              <SecondaryButton type="button" onClick={handleBack}>
                Back
              </SecondaryButton>
              <PrimaryButton onClick={handleGenerateSmart} disabled={loading}>
                Next: SMART breakdown
              </PrimaryButton>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-800" htmlFor="goal-title">
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
                  <label className="text-sm font-medium text-neutral-800" htmlFor={key}>
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
            <div className="flex items-center justify-between gap-3">
              <SecondaryButton type="button" onClick={handleBack}>
                Back
              </SecondaryButton>
              <PrimaryButton onClick={handleGenerateActions} disabled={loading}>
                Next: Action ideas
              </PrimaryButton>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {actions.length === 0 ? (
                <p className="text-sm text-neutral-700">No actions yet. Try generating again.</p>
              ) : (
                actions.map((action, index) => (
                  <Card className="space-y-4" key={`${action.title}-${index}`}>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-800" htmlFor={`action-title-${index}`}>
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
                      <label className="text-sm font-medium text-neutral-800" htmlFor={`action-description-${index}`}>
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
                        <label className="text-sm font-medium text-neutral-800" htmlFor={`recommended-${index}`}>
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
                        <label className="text-sm font-medium text-neutral-800" htmlFor={`deadline-${index}`}>
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
                  </Card>
                ))
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <SecondaryButton type="button" onClick={handleBack}>
                Back
              </SecondaryButton>
              <PrimaryButton type="button" onClick={handleSave} disabled={loading}>
                Review &amp; save (console)
              </PrimaryButton>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-6">
        <PageHeader
          title="Goal setup"
          description="Follow the guided flow to clarify your objective and shape actionable steps."
        />

        <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <Card className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm text-neutral-600">Step {step} of 4</p>
                <p className="text-xl font-semibold text-neutral-900">{currentTitle}</p>
                <p className="text-sm text-neutral-600">{stepDetails[step - 1]?.description}</p>
              </div>
              <SecondaryButton type="button" onClick={handleBack} disabled={step === 1}>
                Back
              </SecondaryButton>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {renderStepContent()}
          </Card>

          <div className="space-y-6">
            <Card className="space-y-4">
              <SectionTitle
                title="Flow overview"
                description="Track where you are in the journey."
              />
              <div className="space-y-3 text-sm text-neutral-700">
                {stepDetails.map((item, index) => {
                  const isActive = index + 1 === step;
                  const isComplete = index + 1 < step;
                  return (
                    <div
                      key={item.title}
                      className="flex items-start justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-neutral-800">{item.title}</p>
                        <p className="text-sm text-neutral-600">{item.description}</p>
                      </div>
                      <span
                        className={
                          isComplete
                            ? "text-xs font-medium text-green-600"
                            : isActive
                              ? "text-xs font-medium text-neutral-900"
                              : "text-xs font-medium text-neutral-500"
                        }
                      >
                        {isComplete ? "Done" : isActive ? "In progress" : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="space-y-4">
              <SectionTitle title="Current outline" description="Live snapshot of your entries." />
              <div className="space-y-3 text-sm text-neutral-700">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-neutral-800">Goal headline</p>
                  <p className="text-sm text-neutral-600">
                    {goalTitle || "Awaiting SMART breakdown"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-neutral-800">SMART details</p>
                  <div className="space-y-1">
                    {(Object.entries(smart) as Array<[keyof SmartFields, string]>).map(([key, value]) => (
                      <div className="flex items-start justify-between gap-4" key={key}>
                        <span className="text-sm text-neutral-600 capitalize">{key}</span>
                        <span className="text-sm text-neutral-800 text-right">
                          {value || "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-neutral-800">Actions drafted</p>
                  <p className="text-sm text-neutral-600">
                    {actions.length > 0
                      ? `${actions.length} action${actions.length === 1 ? "" : "s"} prepared`
                      : "Pending generation"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
