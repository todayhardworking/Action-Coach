"use client";

import { useWizard } from "./GoalWizardLayout";

function combineClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function Step4Actions() {
  const { actions, setActions, loading, prevStep, saveGoalData, userId, setUserId, resetError } = useWizard();

  const toggleSelected = (index: number) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], selected: !updated[index].selected };
    setActions(updated);
  };

  const moveAction = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= actions.length) return;
    const updated = [...actions];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    setActions(updated);
  };

  const updateAction = (index: number, field: "title" | "description" | "userDeadline", value: string) => {
    resetError();
    const updated = [...actions];
    updated[index] = { ...updated[index], [field]: value };
    setActions(updated);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Action plan</h2>
        <p className="text-sm text-neutral-500">Select, edit, and date the actions you want to keep.</p>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
        <label className="text-xs font-semibold text-neutral-500" htmlFor="wizard-user-id">
          Your user ID (required to save)
        </label>
        <input
          id="wizard-user-id"
          value={userId}
          onChange={(event) => {
            resetError();
            setUserId(event.target.value);
          }}
          placeholder="Paste your Firebase user ID"
          className="mt-2 w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-3 py-3 text-base shadow-inner outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15"
        />
      </div>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <div
            key={`${action.title}-${index}`}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => toggleSelected(index)}
                className={combineClasses(
                  "flex h-10 w-10 items-center justify-center rounded-full border text-lg transition",
                  action.selected
                    ? "border-[#007AFF] bg-[#007AFF] text-white shadow-[0_8px_16px_rgba(0,122,255,0.25)]"
                    : "border-neutral-300 bg-white text-neutral-400"
                )}
                aria-label="Toggle action"
              >
                {action.selected ? "✓" : ""}
              </button>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-500" htmlFor={`action-title-${index}`}>
                    Action {index + 1}
                  </label>
                  <input
                    id={`action-title-${index}`}
                    value={action.title}
                    onChange={(event) => updateAction(index, "title", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-3 py-3 text-base shadow-inner outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500" htmlFor={`action-description-${index}`}>
                    Description
                  </label>
                  <textarea
                    id={`action-description-${index}`}
                    value={action.description ?? ""}
                    onChange={(event) => updateAction(index, "description", event.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-3 py-3 text-base shadow-inner outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-neutral-500">Suggested timeline</p>
                    <div className="mt-2 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-3 py-3 text-sm text-neutral-700">
                      {action.recommendedDeadline ?? "Not provided"}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-500" htmlFor={`deadline-${index}`}>
                      Choose your deadline
                    </label>
                    <input
                      id={`deadline-${index}`}
                      type="date"
                      value={action.userDeadline}
                      onChange={(event) => updateAction(index, "userDeadline", event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-base shadow-inner outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-xs text-[#007AFF]">
                <button
                  type="button"
                  className="rounded-full px-2 py-1 transition hover:bg-[#007AFF]/10"
                  onClick={() => moveAction(index, -1)}
                  aria-label="Move action up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="rounded-full px-2 py-1 transition hover:bg-[#007AFF]/10"
                  onClick={() => moveAction(index, 1)}
                  aria-label="Move action down"
                >
                  ↓
                </button>
              </div>
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
        </div>
        <button
          type="button"
          onClick={saveGoalData}
          disabled={loading.saving}
          className="w-full rounded-2xl bg-[#007AFF] px-4 py-4 text-base font-semibold text-white shadow-[0_10px_25px_rgba(0,122,255,0.35)] transition active:scale-[0.99] disabled:opacity-50"
        >
          {loading.saving ? "Saving..." : "Save goal"}
        </button>
      </div>
    </div>
  );
}
