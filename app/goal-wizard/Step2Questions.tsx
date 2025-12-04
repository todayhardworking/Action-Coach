"use client";

import { useWizard } from "./GoalWizardLayout";

export default function Step2Questions() {
  const {
    questions,
    answers,
    setQuestions,
    setAnswers,
    loading,
    prevStep,
    requestSmart,
    requestQuestions,
    resetError,
  } = useWizard();

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const updatedQuestions = [...questions];
    const updatedAnswers = [...answers];
    [updatedQuestions[index], updatedQuestions[targetIndex]] = [updatedQuestions[targetIndex], updatedQuestions[index]];
    [updatedAnswers[index], updatedAnswers[targetIndex]] = [updatedAnswers[targetIndex], updatedAnswers[index]];
    setQuestions(updatedQuestions);
    setAnswers(updatedAnswers);
  };

  const handleAnswerChange = (value: string, index: number) => {
    resetError();
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Clarify your goal</h2>
        <p className="text-sm text-neutral-500">Edit, reorder, and answer these AI prompts.</p>
      </div>
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-4 text-sm text-neutral-500">
            No questions yet. Go back and try generating again.
          </div>
        ) : null}
        {questions.map((question, index) => (
          <div
            key={`${question}-${index}`}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-[0_4px_14px_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-start justify-between gap-2">
              <label className="text-xs font-semibold text-neutral-500" htmlFor={`question-${index}`}>
                Question {index + 1}
              </label>
              <div className="flex items-center gap-1 text-xs text-[#007AFF]">
                <button
                  type="button"
                  className="rounded-full px-2 py-1 transition hover:bg-[#007AFF]/10"
                  onClick={() => moveQuestion(index, -1)}
                  aria-label="Move question up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="rounded-full px-2 py-1 transition hover:bg-[#007AFF]/10"
                  onClick={() => moveQuestion(index, 1)}
                  aria-label="Move question down"
                >
                  ↓
                </button>
              </div>
            </div>
            <input
              id={`question-${index}`}
              value={question}
              onChange={(event) => {
                resetError();
                const updated = [...questions];
                updated[index] = event.target.value;
                setQuestions(updated);
              }}
              className="mt-2 w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-3 py-3 text-base shadow-inner outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15"
            />
            <div className="mt-3 space-y-2">
              <label className="text-xs font-medium text-neutral-500" htmlFor={`answer-${index}`}>
                Your answer
              </label>
              <textarea
                id={`answer-${index}`}
                value={answers[index] ?? ""}
                onChange={(event) => handleAnswerChange(event.target.value, index)}
                className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-3 py-3 text-base shadow-inner outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15"
                rows={3}
                placeholder="Type a short response"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="sticky bottom-0 left-0 right-0 flex flex-col gap-2 bg-white/70 pb-1 pt-2 backdrop-blur">
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={prevStep}
            className="rounded-full px-4 py-2 font-semibold text-[#007AFF] transition hover:bg-[#007AFF]/10"
          >
            Back
          </button>
          <button
            type="button"
            onClick={requestQuestions}
            className="rounded-full px-4 py-2 text-sm font-semibold text-[#007AFF] transition hover:bg-[#007AFF]/10"
          >
            Regenerate
          </button>
        </div>
        <button
          type="button"
          onClick={requestSmart}
          disabled={loading.smart || questions.length === 0}
          className="w-full rounded-2xl bg-[#007AFF] px-4 py-4 text-base font-semibold text-white shadow-[0_10px_25px_rgba(0,122,255,0.35)] transition active:scale-[0.99] disabled:opacity-50"
        >
          {loading.smart ? "Thinking..." : "Next: SMART"}
        </button>
      </div>
    </div>
  );
}
