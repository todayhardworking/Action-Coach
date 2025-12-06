"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RequireAuth } from "../../../components/auth/RequireAuth";
import { useAuth } from "../../../components/auth/AuthProvider";
import { AppBarTop } from "../../../components/md3/AppBarTop";
import { StepCard } from "../../../components/md3/StepCard";
import { StepDescription } from "../../../components/md3/StepDescription";
import { StepTitle } from "../../../components/md3/StepTitle";
import styles from "../../../components/md3/md3.module.css";
import type { TargetDocument } from "../../../lib/targets";

type RepeatConfig = {
  onDays?: string[];
  dayOfMonth?: number;
};

type ActionItem = {
  id: string;
  title: string;
  description: string;
  deadline?: string;
  userDeadline?: string;
  status: "pending" | "done";
  goalTitle: string;
  targetId: string;
  frequency?: string;
  repeatConfig?: RepeatConfig;
  completedDates?: string[];
  createdAt?: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

export default function GoalDetailPage() {
  const params = useParams<{ targetId?: string | string[] }>();
  const targetId = useMemo(() => {
    const paramValue = params?.targetId;
    if (!paramValue) return "";
    return Array.isArray(paramValue) ? paramValue[0] : paramValue;
  }, [params]);

  const { user } = useAuth();
  const router = useRouter();
  const [target, setTarget] = useState<TargetDocument | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loadingTarget, setLoadingTarget] = useState(true);
  const [loadingActions, setLoadingActions] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(async () => {
    if (!user) return null;
    const token = await user.getIdToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [user]);

  const fetchTarget = useCallback(async () => {
    if (!user || !targetId) {
      setTarget(null);
      setLoadingTarget(false);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        throw new Error("Missing authentication token.");
      }

      const response = await fetch("/api/targets", { headers });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to load target.");
      }

      const match = Array.isArray(data.targets)
        ? (data.targets as TargetDocument[]).find((item) => item.id === targetId)
        : null;

      if (!match) {
        setError("Target not found.");
        setTarget(null);
      } else {
        setTarget(match);
      }
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load target.");
    } finally {
      setLoadingTarget(false);
    }
  }, [getAuthHeaders, targetId, user]);

  const fetchActions = useCallback(async () => {
    if (!user || !targetId) {
      setActions([]);
      setLoadingActions(false);
      return;
    }

    setLoadingActions(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        throw new Error("Missing authentication token.");
      }

      const response = await fetch("/api/actions/list", {
        method: "POST",
        headers,
        body: JSON.stringify({ targetId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to load actions.");
      }

      setActions(Array.isArray(data.actions) ? data.actions : []);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load actions.");
    } finally {
      setLoadingActions(false);
    }
  }, [getAuthHeaders, targetId, user]);

  useEffect(() => {
    fetchTarget();
  }, [fetchTarget]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const handleMarkDone = useCallback(
    async (actionId: string) => {
      setProcessingId(actionId);
      setError(null);

      try {
        const headers = await getAuthHeaders();
        if (!headers) {
          throw new Error("Missing authentication token.");
        }

        const response = await fetch("/api/actions/update", {
          method: "POST",
          headers,
          body: JSON.stringify({ actionId, status: "done" }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Failed to update action.");
        }

        await fetchActions();
      } catch (updateError) {
        console.error(updateError);
        setError(updateError instanceof Error ? updateError.message : "Failed to update action.");
      } finally {
        setProcessingId(null);
      }
    },
    [fetchActions, getAuthHeaders]
  );

  const handleDelete = useCallback(
    async (actionId: string) => {
      setProcessingId(actionId);
      setError(null);

      try {
        const headers = await getAuthHeaders();
        if (!headers) {
          throw new Error("Missing authentication token.");
        }

        const response = await fetch("/api/actions/delete", {
          method: "POST",
          headers,
          body: JSON.stringify({ actionId }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Failed to delete action.");
        }

        setActions((current) => current.filter((action) => action.id !== actionId));
      } catch (deleteError) {
        console.error(deleteError);
        setError(deleteError instanceof Error ? deleteError.message : "Failed to delete action.");
      } finally {
        setProcessingId(null);
      }
    },
    [getAuthHeaders]
  );

  const formattedActions = useMemo(
    () =>
      actions.map((action) => {
        const rawDeadline = action.userDeadline || action.deadline;
        const parsedDeadline = rawDeadline ? new Date(rawDeadline) : null;
        const deadlineDisplay =
          parsedDeadline && !Number.isNaN(parsedDeadline.getTime())
            ? parsedDeadline.toLocaleDateString()
            : rawDeadline || "—";

        const createdDate = action.createdAt ? new Date(action.createdAt) : null;
        const createdDisplay =
          createdDate && !Number.isNaN(createdDate.getTime())
            ? createdDate.toLocaleDateString()
            : "—";

        const cadenceLabel = action.frequency
          ? action.frequency.charAt(0).toUpperCase() + action.frequency.slice(1)
          : "Once";

        const repeatLabel = action.repeatConfig?.onDays?.length
          ? `On ${action.repeatConfig.onDays.map((day) => day.toUpperCase()).join(", ")}`
          : action.repeatConfig?.dayOfMonth
            ? `On day ${action.repeatConfig.dayOfMonth}`
            : "";

        const completedCount = Array.isArray(action.completedDates) ? action.completedDates.length : 0;

        return {
          ...action,
          deadlineDisplay,
          cadenceLabel,
          repeatLabel,
          completedCount,
          createdDisplay,
        };
      }),
    [actions]
  );

  const summary = useMemo(() => {
    const pendingCount = actions.filter((action) => action.status === "pending").length;
    const doneCount = actions.filter((action) => action.status === "done").length;

    const nextDeadline = actions
      .map((action) => new Date(action.userDeadline || action.deadline || ""))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return {
      pendingCount,
      doneCount,
      nextDeadline: nextDeadline ? nextDeadline.toLocaleDateString() : "—",
    };
  }, [actions]);

  const isBusy = (actionId: string) => processingId === actionId;

  const showLoading = loadingTarget || loadingActions;

  useEffect(() => {
    if (!targetId) {
      setError("Missing target id.");
      setLoadingActions(false);
      setLoadingTarget(false);
    }
  }, [targetId]);

  return (
    <RequireAuth>
      <div className={styles.surfaceContainer}>
        <div className={styles.wizardShell}>
          <AppBarTop title={target?.title || "Target details"} />

          <StepCard>
            <StepTitle>{target?.title || "Target details"}</StepTitle>
            <StepDescription>
              {target?.smart
                ? "Track every action connected to this goal."
                : "Review the actions attached to this goal."}
            </StepDescription>
            <div className={`${styles.contentStack} ${styles.topSpacing}`}>
              <div className={`${styles.statusCard} ${styles.statusSuccess}`}>
                <div className={styles.statusIcon}>✓</div>
                <div>
                  <p className={styles.statusTitle}>Progress overview</p>
                  <p className={styles.supportText}>
                    {summary.pendingCount} pending · {summary.doneCount} completed · Next due {summary.nextDeadline}
                  </p>
                </div>
              </div>
              <div className={`${styles.statusCard} ${styles.statusNeutral}`}>
                <div className={styles.statusIcon}>📅</div>
                <div>
                  <p className={styles.statusTitle}>Created</p>
                  <p className={styles.supportText}>{formatDate(target?.createdAt)}</p>
                </div>
              </div>
            </div>
          </StepCard>

          <div className={styles.contentStack}>
            {error ? (
              <div className={`${styles.statusCard} ${styles.statusError}`} role="alert">
                <div className={styles.statusIcon}>!</div>
                <div>
                  <p className={styles.statusTitle}>Something went wrong</p>
                  <p className={styles.supportText}>{error}</p>
                </div>
              </div>
            ) : null}

            {showLoading ? (
              <StepCard elevated>
                <div className="flex items-center gap-3">
                  <div className={styles.loader} aria-hidden />
                  <p className={styles.supportText}>Loading your actions...</p>
                </div>
              </StepCard>
            ) : formattedActions.length === 0 ? (
              <StepCard elevated>
                <StepTitle>No actions yet</StepTitle>
                <StepDescription>
                  Actions linked to this target will appear here. Use the wizard to generate more steps if needed.
                </StepDescription>
                <div className={styles.actionsRow}>
                  <button type="button" className={styles.tonalButton} onClick={() => router.push("/actions-list")}>
                    Back to all actions
                  </button>
                </div>
              </StepCard>
            ) : (
              formattedActions.map((action) => {
                return (
                  <StepCard key={action.id} elevated>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                            {action.goalTitle || target?.title || "Goal"}
                          </p>
                          <h2 className="text-xl font-semibold text-gray-900">{action.title}</h2>
                          <p className="text-sm text-gray-700 leading-snug">
                            {action.description || "No description provided."}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              action.status === "done"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {action.status === "done" ? "Completed" : "Pending"}
                          </span>
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
                            Due {action.deadlineDisplay}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                        <span className="rounded-full bg-gray-100 px-3 py-1 font-medium">
                          Cadence: {action.cadenceLabel}
                        </span>
                        {action.repeatLabel ? (
                          <span className="rounded-full bg-gray-100 px-3 py-1 font-medium">{action.repeatLabel}</span>
                        ) : null}
                        <span className="rounded-full bg-gray-100 px-3 py-1 font-medium">
                          {action.completedCount} check-in{action.completedCount === 1 ? "" : "s"}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 font-medium">Created {action.createdDisplay}</span>
                      </div>

                      <div className={styles.actionsRow}>
                        <button
                          type="button"
                          className={styles.filledButton}
                          onClick={() => handleMarkDone(action.id)}
                          disabled={isBusy(action.id) || action.status === "done"}
                        >
                          {processingId === action.id && action.status !== "done" ? "Updating..." : "Mark done"}
                        </button>
                        <button
                          type="button"
                          className={styles.tonalButton}
                          onClick={() => handleDelete(action.id)}
                          disabled={isBusy(action.id)}
                        >
                          {processingId === action.id && action.status === "done" ? "Removing..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </StepCard>
                );
              })
            )}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
