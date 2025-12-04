"use client";

import { useMemo } from "react";
import { useWizard } from "./GoalWizardLayout";

export default function Step1GoalTitle() {
  const { goalTitle, setGoalTitle, loading, requestQuestions, resetError } = useWizard();

  const isDisabled = useMemo(() => goalTitle.trim().length === 0 || loading.questions, [goalTitle, loading.questions]);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Name your goal</h2>
        <p className="text-sm text-neutral-500">
          Keep it short and clear. We will turn this into clarifying questions automatically.
        </p>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 shadow-[0_6px_16px_rgba(0,0,0,0.04)]">
        <label className="text-xs font-semibold text-neutral-500" htmlFor="goal-title">
          Goal title
        </label>
        <input
          id="goal-title"
          value={goalTitle}
          onChange={(event) => {
            resetError();
            setGoalTitle(event.target.value);
          }}
          className="mt-2 w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base shadow-inner outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20"
          placeholder="e.g. Launch a weekly fitness habit"
        />
      </div>
      <div className="sticky bottom-0 left-0 right-0">
        <button
          type="button"
          onClick={requestQuestions}
          disabled={isDisabled}
          className="w-full rounded-2xl bg-[#007AFF] px-4 py-4 text-base font-semibold text-white shadow-[0_10px_25px_rgba(0,122,255,0.35)] transition active:scale-[0.99] disabled:opacity-50"
        >
          {loading.questions ? "Generating..." : "Next"}
        </button>
      </div>
    </div>
  );
}
