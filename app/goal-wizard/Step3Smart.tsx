"use client";

import { SmartData } from "../../lib/goalWizardApi";
import { useWizard } from "./GoalWizardLayout";

const smartFields: { key: keyof SmartData; label: string }[] = [
  { key: "specific", label: "Specific" },
  { key: "measurable", label: "Measurable" },
  { key: "achievable", label: "Achievable" },
  { key: "relevant", label: "Relevant" },
  { key: "timebound", label: "Time-bound" },
];

export default function Step3Smart() {
  const { goalTitle, setGoalTitle, smart, setSmart, loading, prevStep, requestActions, requestSmart, resetError } = useWizard();

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">SMART breakdown</h2>
        <p className="text-sm text-neutral-500">Review and tweak the AI summary.</p>
      </div>
      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 shadow-[0_6px_16px_rgba(0,0,0,0.04)]">
        <label className="text-xs font-semibold text-neutral-500" htmlFor="smart-goal-title">
          Goal title
        </label>
        <input
          id="smart-goal-title"
          value={goalTitle}
          onChange={(event) => {
            resetError();
            setGoalTitle(event.target.value);
          }}
          className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-base shadow-inner outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15"
        />
      </div>
      <div className="space-y-3">
        {smartFields.map(({ key, label }) => (
          <div
            key={key}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-[0_4px_14px_rgba(0,0,0,0.05)]"
          >
            <label className="text-xs font-semibold text-neutral-500" htmlFor={`smart-${key}`}>
              {label}
            </label>
            <textarea
              id={`smart-${key}`}
              value={smart[key]}
              rows={3}
              onChange={(event) => {
                resetError();
                setSmart({ ...smart, [key]: event.target.value });
              }}
              className="mt-2 w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-3 py-3 text-base shadow-inner outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15"
            />
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
            onClick={requestSmart}
            className="rounded-full px-4 py-2 text-sm font-semibold text-[#007AFF] transition hover:bg-[#007AFF]/10"
          >
            Refresh SMART
          </button>
        </div>
        <button
          type="button"
          onClick={requestActions}
          disabled={loading.actions}
          className="w-full rounded-2xl bg-[#007AFF] px-4 py-4 text-base font-semibold text-white shadow-[0_10px_25px_rgba(0,122,255,0.35)] transition active:scale-[0.99] disabled:opacity-50"
        >
          {loading.actions ? "Generating actions..." : "Next: Actions"}
        </button>
      </div>
    </div>
  );
}
