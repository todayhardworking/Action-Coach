"use client";

import { useEffect, useState } from "react";

interface SmartBreakdown {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBased: string;
}

interface ActionItem {
  title: string;
  description: string;
  deadline: string;
}

const GoalSetupPage = () => {
  const [step, setStep] = useState(1);

  const [userInput, setUserInput] = useState("");

  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState(["", "", ""]);

  const [goalTitle, setGoalTitle] = useState("");
  const [smart, setSmart] = useState<SmartBreakdown>({
    specific: "",
    measurable: "",
    achievable: "",
    relevant: "",
    timeBased: "",
  });

  const [actions, setActions] = useState<ActionItem[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step === 2) {
      generateQuestions();
    }
  }, [step]);

  const generateQuestions = async () => {
    if (!userInput.trim()) {
      setError("Please enter your target or problem before generating questions.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate questions.");
      }

      if (Array.isArray(data.questions)) {
        setQuestions(data.questions);
        setAnswers(["", "", ""]);
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateSmart = async () => {
    if (!userInput.trim()) {
      setError("Please enter your target or problem before generating SMART.");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput,
          answers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate SMART breakdown.");
      }

      if (data.goalTitle && data.smart) {
        setGoalTitle(data.goalTitle);
        setSmart({
          specific: data.smart.specific ?? "",
          measurable: data.smart.measurable ?? "",
          achievable: data.smart.achievable ?? "",
          relevant: data.smart.relevant ?? "",
          timeBased: data.smart.timeBased ?? "",
        });
      }

      return true;
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Something went wrong.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const generateActions = async () => {
    if (!goalTitle.trim()) {
      setError("Please set a goal title before generating actions.");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalTitle,
          smart,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate actions.");
      }

      if (Array.isArray(data.actions)) {
        setActions(
          data.actions.map(
            (
              action: { title?: string; description?: string; recommendedDeadline?: string },
              index: number,
            ) => ({
              title: action?.title || `Action ${index + 1}`,
              description: action?.description || "",
              deadline: action?.recommendedDeadline || "",
            }),
          ),
        );
      }

      return true;
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Something went wrong.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepOneNext = async () => {
    setError(null);

    if (!userInput.trim()) {
      setError("Please describe your target or problem.");
      return;
    }

    setStep(2);
  };

  const handleStepTwoNext = async () => {
    const success = await generateSmart();
    if (success) {
      setStep(3);
    }
  };

  const handleStepThreeNext = async () => {
    const success = await generateActions();
    if (success) {
      setStep(4);
    }
  };

  const handleActionTitleChange = (index: number, value: string) => {
    setActions((prev) => prev.map((action, idx) => (idx === index ? { ...action, title: value } : action)));
  };

  const handleActionDescriptionChange = (index: number, value: string) => {
    setActions((prev) => prev.map((action, idx) => (idx === index ? { ...action, description: value } : action)));
  };

  const handleActionDeadlineChange = (index: number, value: string) => {
    setActions((prev) => prev.map((action, idx) => (idx === index ? { ...action, deadline: value } : action)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-3 text-center sm:text-left">
        <h1 className="text-3xl font-bold text-gray-900">Set Up Your Goal</h1>
        <p className="text-sm text-gray-600">A calm, guided flow to refine your goal and actions—optimized for any screen.</p>
      </div>

      <div className="mx-auto mt-6 max-w-3xl space-y-6">
        {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

        {step === 1 ? (
          <div className="space-y-5 rounded-xl bg-white/80 p-6 shadow-md backdrop-blur">
            <div className="space-y-2">
              <p className="text-xl font-semibold">Step 1 — Target / Problem</p>
              <p className="text-sm text-gray-600">
                Describe the goal or challenge you want to work on. Be concise but include the context that matters.
              </p>
            </div>

            <textarea
              className="w-full rounded-2xl border border-gray-200 bg-white/70 p-4 text-base text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:text-lg"
              rows={6}
              value={userInput}
              onChange={(event) => setUserInput(event.target.value)}
              placeholder="e.g., I want to prepare for a 10K run but I only have 6 weeks and a busy schedule."
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleStepOneNext}
                disabled={isLoading || !userInput.trim()}
                className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 disabled:opacity-60 sm:w-auto sm:text-base"
              >
                Next: Clarifying Questions
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5 rounded-xl bg-white/80 p-6 shadow-md backdrop-blur">
            <div className="space-y-2">
              <p className="text-xl font-semibold">Step 2 — Clarifying Questions</p>
              <p className="text-sm text-gray-600">Answer a few quick questions so we can tailor your SMART plan.</p>
            </div>

            <div className="space-y-4">
              {questions.length > 0 ? (
                questions.map((question, index) => (
                  <div key={question} className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">{question}</p>
                    <textarea
                      className="w-full rounded-2xl border border-gray-200 bg-white/70 p-3 text-base text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:text-lg"
                      rows={4}
                      value={answers[index] ?? ""}
                      onChange={(event) =>
                        setAnswers((prev) => prev.map((answer, idx) => (idx === index ? event.target.value : answer)))
                      }
                      placeholder="Type your answer here"
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">Loading questions...</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleStepTwoNext}
                disabled={isLoading}
                className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 disabled:opacity-60 sm:w-auto sm:text-base"
              >
                Next: Generate SMART
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5 rounded-xl bg-white/80 p-6 shadow-md backdrop-blur">
            <div className="space-y-2">
              <p className="text-xl font-semibold">Step 3 — SMART Breakdown</p>
              <p className="text-sm text-gray-600">Review and adjust the SMART details before creating action ideas.</p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                className="w-full rounded-2xl border border-gray-200 bg-white/70 p-4 text-base font-semibold text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:text-lg"
                value={goalTitle}
                onChange={(event) => setGoalTitle(event.target.value)}
                placeholder="Goal title"
              />

              {(
                [
                  { key: "specific", label: "Specific" },
                  { key: "measurable", label: "Measurable" },
                  { key: "achievable", label: "Achievable" },
                  { key: "relevant", label: "Relevant" },
                  { key: "timeBased", label: "Time-Based" },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <textarea
                    className="w-full rounded-2xl border border-gray-200 bg-white/70 p-3 text-base text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:text-lg"
                    rows={4}
                    value={smart[key]}
                    onChange={(event) => setSmart((prev) => ({ ...prev, [key]: event.target.value }))}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleStepThreeNext}
                disabled={isLoading}
                className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 disabled:opacity-60 sm:w-auto sm:text-base"
              >
                Next: Generate Action Ideas
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-5 rounded-xl bg-white/80 p-6 shadow-md backdrop-blur">
            <div className="space-y-2">
              <p className="text-xl font-semibold">Step 4 — Action Suggestions</p>
              <p className="text-sm text-gray-600">Pick and refine the actions you want to take next.</p>
            </div>

            <div className="space-y-3">
              {actions.length > 0 ? (
                actions.map((action, index) => (
                  <div key={index} className="rounded-2xl border border-gray-100 bg-white/70 p-4 shadow-sm">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-800">Action</label>
                        <input
                          type="text"
                          className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-base text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:text-lg"
                          value={action.title}
                          onChange={(event) => handleActionTitleChange(index, event.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-800">Description</label>
                        <textarea
                          className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-base text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:text-lg"
                          rows={3}
                          value={action.description}
                          onChange={(event) => handleActionDescriptionChange(index, event.target.value)}
                          placeholder="Add helpful details or steps for this action"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-800">Deadline</label>
                        <input
                          type="date"
                          className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-base text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:text-lg"
                          value={action.deadline}
                          onChange={(event) => handleActionDeadlineChange(index, event.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No actions generated yet.</p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => console.log("Save coming soon")}
                className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 sm:w-auto"
              >
                Next: Review &amp; Save
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default GoalSetupPage;
