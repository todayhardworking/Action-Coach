"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RequireAuth } from "../../components/auth/RequireAuth";
import { useAuth } from "../../components/auth/AuthProvider";
import { AppBarTop } from "../../components/md3/AppBarTop";
import { StepCard } from "../../components/md3/StepCard";
import { StepDescription } from "../../components/md3/StepDescription";
import { StepTitle } from "../../components/md3/StepTitle";
import styles from "../../components/md3/md3.module.css";

type ActionItem = {
  id: string;
  title: string;
  description: string;   // <-- NEW FIELD
  deadline: string;
  status: "pending" | "done";
  goalTitle: string;
};

export default function ActionsListPage() {
  const { user } = useAuth();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedActionIds, setExpandedActionIds] = useState<Set<string>>(new Set());

  const getAuthHeaders = useCallback(async () => {
    if (!user) return null;

    const token = await user.getIdToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [user]);

  const fetchActions = useCallback(async () => {
    if (!user) {
      setActions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        throw new Error("Missing authentication token.");
      }

      const response = await fetch("/api/actions/list", {
        method: "POST",
        headers,
        body: JSON.stringify({}),
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
      setLoading(false);
    }
  }, [getAuthHeaders, user]);

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
        const date = new Date(action.deadline);
        const deadlineDisplay = Number.isNaN(date.getTime())
          ? action.deadline
          : date.toLocaleDateString();

        return { ...action, deadlineDisplay };
      }),
    [actions]
  );

  const summary = useMemo(() => {
    const pendingCount = actions.filter((action) => action.status === "pending").length;
    const doneCount = actions.filter((action) => action.status === "done").length;

    const nextDeadline = actions
      .map((action) => new Date(action.deadline))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return {
      pendingCount,
      doneCount,
      nextDeadline: nextDeadline ? nextDeadline.toLocaleDateString() : "—",
    };
  }, [actions]);

  const toggleExpanded = useCallback((actionId: string) => {
    setExpandedActionIds((current) => {
      const next = new Set(current);
      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }
      return next;
    });
  }, []);

  const isBusy = (actionId: string) => loading || processingId === actionId;

  return (
    <RequireAuth>
      <div className={styles.surfaceContainer}>
        <div className={styles.wizardShell}>
          <AppBarTop title="Actions" />

          <StepCard>
            <StepTitle>Your action queue</StepTitle>
            <StepDescription>
              Track every step across your goals, mark work as done, and keep your plan up to date.
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

            {loading ? (
              <StepCard elevated>
                <div className="flex items-center gap-3">
                  <div className={styles.loader} aria-hidden />
                  <p className={styles.supportText}>Loading your actions...</p>
                </div>
              </StepCard>
            ) : formattedActions.length === 0 ? (
              <StepCard elevated>
                <StepTitle>Nothing to do yet</StepTitle>
                <StepDescription>
                  Start a new goal in the wizard and we will bring your action steps back here to keep you accountable.
                </StepDescription>
              </StepCard>
            ) : (
              formattedActions.map((action) => (
                <StepCard key={action.id} elevated>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-3">
                        <div className={styles.badge}>Deadline · {action.deadlineDisplay}</div>

                        <button
                          type="button"
                          onClick={() => toggleExpanded(action.id)}
                          className="text-left text-2xl font-semibold text-gray-900 leading-tight"
                          aria-expanded={expandedActionIds.has(action.id)}
                          aria-controls={`action-description-${action.id}`}
                        >
                          {action.title}
                        </button>

                        {action.description && expandedActionIds.has(action.id) ? (
                          <p
                            id={`action-description-${action.id}`}
                            className="text-sm text-gray-600 leading-snug"
                          >
                            {action.description}
                          </p>
                        ) : null}

                        <div className="flex items-center gap-2">
                          <span
                            className={`${styles.chip} ${
                              action.status === "done" ? "bg-green-50 text-green-800" : ""
                            }`}
                          >
                            {action.status === "done" ? "Completed" : "Pending"}
                          </span>
                        </div>
                      </div>
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
              ))
            )}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
