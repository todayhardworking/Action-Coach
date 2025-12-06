"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../components/auth/AuthProvider";
import { RequireAuth } from "../../components/auth/RequireAuth";
import { AppBarTop } from "../../components/md3/AppBarTop";
import { StepCard } from "../../components/md3/StepCard";
import { StepDescription } from "../../components/md3/StepDescription";
import { StepTitle } from "../../components/md3/StepTitle";
import styles from "../../components/md3/md3.module.css";

type DashboardAction = {
  id: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly";
  startDate: string | null;
  endDate: string | null;
  isCompletedToday: boolean;
  streak: number;
};

const features = [
  {
    title: "Add Goal",
    description: "Launch the goal wizard to turn a new intention into a SMART action plan.",
    href: "/goal-wizard",
    cta: "Start a goal",
  },
  {
    title: "View Goals List",
    description: "See every goal you've created and jump back into the details when you're ready.",
    href: "/goals-list",
    cta: "View goals",
  },
  {
    title: "View Actions List",
    description: "Review the action steps across all of your goals to keep work moving forward.",
    href: "/actions-list",
    cta: "View actions",
  },
  {
    title: "Delete Account & Data",
    description: "Manage your data footprint and request removal of your account and saved items.",
    href: null,
    cta: "Delete account",
  },
];

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

const frequencyLabels: Record<DashboardAction["frequency"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [actions, setActions] = useState<DashboardAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);

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

      const response = await fetch(`/api/actions/dashboard?userId=${encodeURIComponent(user.uid)}`, {
        method: "GET",
        headers,
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

  const handleCheckIn = useCallback(
    async (actionId: string) => {
      if (!user) return;

      setCheckingId(actionId);
      setError(null);

      try {
        const headers = await getAuthHeaders();
        if (!headers) {
          throw new Error("Missing authentication token.");
        }

        const response = await fetch("/api/actions/complete", {
          method: "POST",
          headers,
          body: JSON.stringify({ actionId, userId: user.uid }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Failed to check in action.");
        }

        setActions((current) =>
          current.map((action) =>
            action.id === actionId
              ? {
                  ...action,
                  isCompletedToday: true,
                  streak: action.isCompletedToday ? action.streak : action.streak + 1,
                }
              : action
          )
        );
      } catch (completeError) {
        console.error(completeError);
        setError(completeError instanceof Error ? completeError.message : "Failed to check in action.");
      } finally {
        setCheckingId(null);
      }
    },
    [getAuthHeaders, user]
  );

  const summary = useMemo(() => {
    const completed = actions.filter((action) => action.isCompletedToday).length;
    return {
      completed,
      total: actions.length,
    };
  }, [actions]);

  const renderActions = () => {
    if (error) {
      return (
        <div className={`${styles.statusCard} ${styles.statusError}`} role="alert">
          <div className={styles.statusIcon}>!</div>
          <div>
            <p className={styles.statusTitle}>Something went wrong</p>
            <p className={styles.supportText}>{error}</p>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <StepCard elevated>
          <div className="flex items-center gap-3">
            <div className={styles.loader} aria-hidden />
            <p className={styles.supportText}>Loading your actions...</p>
          </div>
        </StepCard>
      );
    }

    if (actions.length === 0) {
      return (
        <StepCard elevated>
          <StepTitle>No recurring actions yet</StepTitle>
          <StepDescription>
            Start a new goal and we will show your daily, weekly, or monthly check-ins here.
          </StepDescription>
        </StepCard>
      );
    }

    return actions.map((action) => {
      const isBusy = checkingId === action.id;
      return (
        <StepCard key={action.id} elevated>
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-2">
                <div className={styles.badge}>
                  {frequencyLabels[action.frequency]} · Streak {action.streak}
                </div>

                <p className="text-lg font-semibold text-gray-900">{action.description}</p>

                <p className="text-sm text-gray-600 leading-snug">
                  Active from {formatDate(action.startDate)} {action.endDate ? `to ${formatDate(action.endDate)}` : ""}
                </p>
              </div>

              <span
                className={`${styles.chip} ${
                  action.isCompletedToday ? "bg-green-50 text-green-800" : "bg-slate-100 text-slate-800"
                }`}
              >
                {action.isCompletedToday ? "Done today" : "Pending"}
              </span>
            </div>

            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.filledButton}
                onClick={() => handleCheckIn(action.id)}
                disabled={action.isCompletedToday || isBusy}
              >
                {action.isCompletedToday ? "Done today" : isBusy ? "Checking in..." : "Check in"}
              </button>
            </div>
          </div>
        </StepCard>
      );
    });
  };

  return (
    <RequireAuth>
      <div className={styles.surfaceContainer}>
        <div className={styles.wizardShell}>
          <AppBarTop title="Your Dashboard" />
          <StepCard>
            <StepTitle>Today's focus</StepTitle>
            <StepDescription>
              Check in on your recurring actions, keep streaks alive, and celebrate daily wins.
            </StepDescription>
            <div className={`${styles.contentStack} ${styles.topSpacing}`}>
              <div className={`${styles.statusCard} ${styles.statusSuccess}`}>
                <div className={styles.statusIcon}>✓</div>
                <div>
                  <p className={styles.statusTitle}>Progress overview</p>
                  <p className={styles.supportText}>
                    {summary.completed} of {summary.total} actions completed today
                  </p>
                </div>
              </div>
            </div>
          </StepCard>

          <div className={styles.contentStack}>{renderActions()}</div>

          <div className={styles.contentStack}>
            {features.map(({ title, description, href, cta }) => (
              <StepCard key={title}>
                <div className={styles.featureCardContent}>
                  <div>
                    <h3 className={styles.featureTitle}>{title}</h3>
                    <p className={styles.featureDescription}>{description}</p>
                  </div>
                  <div className={styles.featureActions}>
                    {href ? (
                      <Link href={href} className={`${styles.filledButton} ${styles.linkButton}`}>
                        {cta}
                      </Link>
                    ) : (
                      <button type="button" className={styles.tonalButton} disabled>
                        Coming soon
                      </button>
                    )}
                  </div>
                </div>
              </StepCard>
            ))}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
