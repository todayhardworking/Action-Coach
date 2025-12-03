"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SmartFields = {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBased: string;
};

type ActionSuggestion = {
  title: string;
  description: string;
  recommendedDeadline: string;
  userDeadline?: string;
};

const INITIAL_SMART: SmartFields = {
  specific: "",
  measurable: "",
  achievable: "",
  relevant: "",
  timeBased: "",
};

export default function TestPage() {
  const [step, setStep] = useState(1);
  const [userInput, setUserInput] = useState("");
  const [useExtraQuestions, setUseExtraQuestions] = useState(true);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [goalTitle, setGoalTitle] = useState("");
  const [smart, setSmart] = useState<SmartFields>(INITIAL_SMART);
  const [actions, setActions] = useState<ActionSuggestion[]>([]);
  const [userId, setUserId] = useState("");
  const [hasRequestedQuestions, setHasRequestedQuestions] = useState(false);

  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [smartLoading, setSmartLoading] = useState(false);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const smartFieldRefs = useRef<Record<keyof SmartFields, HTMLTextAreaElement | null>>({
    specific: null,
    measurable: null,
    achievable: null,
    relevant: null,
    timeBased: null,
  });

  const canProceedFromStepOne = userInput.trim().length > 0;
  const canProceedFromStepTwo = answers.every((answer) => answer.trim().length > 0);
  const canProceedFromStepThree =
    goalTitle.trim().length > 0 && Object.values(smart).every((value) => value.trim().length > 0);
  const canSave = useMemo(
    () =>
      goalTitle.trim().length > 0 &&
      userId.trim().length > 0 &&
      actions.length > 0 &&
      actions.every((action) => (action.userDeadline ?? "").trim().length > 0),
    [actions, goalTitle, userId],
  );

  const autoResizeSmartField = (key: keyof SmartFields) => {
    const element = smartFieldRefs.current[key];
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  const handleGenerateQuestions = async () => {
    setError("");
    setHasRequestedQuestions(true);
    setQuestionsLoading(true);
    setQuestions([]);
    setAnswers(["", "", ""]);

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate clarifying questions.");
      }

      const data: { questions?: string[] } = await response.json();
      const receivedQuestions = data.questions ?? [];
      const paddedQuestions = [...receivedQuestions];

      while (paddedQuestions.length < 3) {
        paddedQuestions.push("");
      }

      setQuestions(paddedQuestions.slice(0, 3));
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load questions.");
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleGenerateSmart = async (answersInput: string[] = answers) => {
    setError("");
    setSmartLoading(true);
    setSuccessMessage("");

    try {
      const response = await fetch("/api/generate-smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput, answers: answersInput }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate SMART breakdown.");
      }

      const data: { goalTitle?: string; smart?: SmartFields } = await response.json();
      setGoalTitle(data.goalTitle ?? "");
      setSmart({ ...INITIAL_SMART, ...(data.smart ?? {}) });
      Object.keys(INITIAL_SMART).forEach((key) => autoResizeSmartField(key as keyof SmartFields));
      setStep(3);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to generate SMART breakdown.");
    } finally {
      setSmartLoading(false);
    }
  };

  const handleGenerateActions = async () => {
    setError("");
    setActionsLoading(true);
    setSuccessMessage("");

    try {
      const response = await fetch("/api/generate-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalTitle, smart }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate action suggestions.");
      }

      const data: { actions?: ActionSuggestion[] } = await response.json();
      const receivedActions = data.actions ?? [];
      setActions(
        receivedActions.map((action) => ({
          ...action,
          userDeadline: action.recommendedDeadline || "",
        })),
      );
      setStep(4);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to generate actions.");
    } finally {
      setActionsLoading(false);
    }
  };

  const handleSaveGoal = async () => {
    setError("");
    setSaveLoading(true);
    setSuccessMessage("");

    try {
      const response = await fetch("/api/save-goal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          goalTitle,
          smart,
          actions: actions.map((action) => ({
            title: action.title,
            deadline: action.userDeadline ?? "",
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save goal.");
      }

      setSuccessMessage("Goal saved to Firestore via API.");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to save goal.");
    } finally {
      setSaveLoading(false);
    }
  };

  useEffect(() => {
    if (step === 2 && !questionsLoading && !hasRequestedQuestions) {
      handleGenerateQuestions();
    }
  }, [step, questionsLoading, hasRequestedQuestions]);

  useEffect(() => {
    Object.keys(INITIAL_SMART).forEach((key) => autoResizeSmartField(key as keyof SmartFields));
  }, [smart]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Goal Setup Test Flow</h1>
        <p className="text-sm text-gray-600">Internal testing UI for verifying Modules A and B end-to-end.</p>
        <div className="text-xs text-gray-500">Step {step} of 4</div>
      </header>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {successMessage && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{successMessage}</div>}

      {step === 1 && (
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-medium">Step 1: Target Input</h2>
          <p className="mt-1 text-sm text-gray-600">Enter the user target to start the flow.</p>

          <div className="mt-4 flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-700" htmlFor="userInput">
              Target Input
            </label>
            <textarea
              id="userInput"
              className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
              rows={4}
              value={userInput}
              onChange={(event) => setUserInput(event.target.value)}
              placeholder="Describe the goal or target..."
            />

            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={useExtraQuestions}
                onChange={(event) => setUseExtraQuestions(event.target.checked)}
              />
              Use clarifying questions (recommended)
            </label>

            <button
              className="mt-2 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              onClick={() => {
                if (useExtraQuestions) {
                  setStep(2);
                } else {
                  handleGenerateSmart([]);
                }
              }}
              disabled={!canProceedFromStepOne || smartLoading}
            >
              {useExtraQuestions ? "Next" : smartLoading ? "Generating SMART..." : "Skip to SMART"}
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-medium">Step 2: Clarifying Questions</h2>
          <p className="mt-1 text-sm text-gray-600">Answer the generated questions to refine the SMART breakdown.</p>

          <div className="mt-4 flex flex-col gap-4">
            {questionsLoading ? (
              <div className="text-sm text-gray-500">Loading questions...</div>
            ) : (
              questions.map((question, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-gray-800">{question || `Question ${index + 1}`}</p>
                  <textarea
                    className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
                    rows={2}
                    value={answers[index] ?? ""}
                    onChange={(event) => {
                      const updated = [...answers];
                      updated[index] = event.target.value;
                      setAnswers(updated);
                    }}
                    placeholder="Your answer"
                  />
                </div>
              ))
            )}

            <button
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              onClick={() => handleGenerateSmart()}
              disabled={!canProceedFromStepTwo || smartLoading || questionsLoading}
            >
              {smartLoading ? "Generating SMART..." : "Generate SMART Breakdown"}
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-medium">Step 3: SMART Breakdown</h2>
          <p className="mt-1 text-sm text-gray-600">Review and edit the SMART goal details.</p>

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="goalTitle">
                Goal Title
              </label>
              <input
                id="goalTitle"
                className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
                value={goalTitle}
                onChange={(event) => setGoalTitle(event.target.value)}
                placeholder="Goal title"
              />
            </div>

            {(
              [
                ["specific", "Specific"],
                ["measurable", "Measurable"],
                ["achievable", "Achievable"],
                ["relevant", "Relevant"],
                ["timeBased", "Time-Based"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700" htmlFor={key}>
                  {label}
                </label>
                <textarea
                  id={key}
                  ref={(element) => {
                    smartFieldRefs.current[key] = element;
                  }}
                  className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
                  rows={2}
                  value={smart[key]}
                  onChange={(event) => {
                    const updated = { ...smart, [key]: event.target.value } as SmartFields;
                    setSmart(updated);
                    autoResizeSmartField(key);
                  }}
                  placeholder={`${label} detail`}
                />
              </div>
            ))}

            <button
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              onClick={handleGenerateActions}
              disabled={!canProceedFromStepThree || actionsLoading}
            >
              {actionsLoading ? "Generating actions..." : "Generate Action Suggestions"}
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-medium">Step 4: Action Suggestions</h2>
          <p className="mt-1 text-sm text-gray-600">Review suggestions, set deadlines, and save.</p>

          <div className="mt-4 flex flex-col gap-4">
            {actions.length === 0 ? (
              <div className="text-sm text-gray-500">No actions generated yet.</div>
            ) : (
              actions.map((action, index) => (
                <div key={index} className="rounded-md border border-gray-200 p-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor={`action-title-${index}`}>
                      Action Title
                    </label>
                    <input
                      id={`action-title-${index}`}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={action.title}
                      onChange={(event) => {
                        const updated = [...actions];
                        updated[index] = { ...action, title: event.target.value };
                        setActions(updated);
                      }}
                    />

                    <p className="text-xs text-gray-500">{action.description}</p>
                    <p className="text-xs text-gray-500">Recommended: {action.recommendedDeadline || "N/A"}</p>

                    <label className="text-sm font-medium text-gray-700" htmlFor={`deadline-${index}`}>
                      Select Deadline
                    </label>
                    <input
                      id={`deadline-${index}`}
                      type="date"
                      className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={action.userDeadline ?? ""}
                      onChange={(event) => {
                        const updated = [...actions];
                        updated[index] = { ...action, userDeadline: event.target.value };
                        setActions(updated);
                      }}
                    />
                  </div>
                </div>
              ))
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="userId">
                User ID (for API payload)
              </label>
              <input
                id="userId"
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="Firebase user id"
              />
            </div>

            <button
              className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              onClick={handleSaveGoal}
              disabled={!canSave || saveLoading}
            >
              {saveLoading ? "Saving..." : "Save Goal to Firestore"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
