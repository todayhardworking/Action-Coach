"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { AppBarTop } from "../../components/md3/AppBarTop";
import { RequireAuth } from "../../components/auth/RequireAuth";
import { StepCard } from "../../components/md3/StepCard";
import { StepDescription } from "../../components/md3/StepDescription";
import { StepTitle } from "../../components/md3/StepTitle";
import styles from "../../components/md3/md3.module.css";
import { db } from "../../lib/firebaseClient";
import { useAuth } from "../../components/auth/AuthProvider";
import { safeToDate } from "../../lib/safeTimestamp";

type SmartDetails = {
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
  timeBased?: string;
};

type ActionItem = {
  id: string;
  title: string;
  deadline: Date | null;
  status: string;
};

type Goal = {
  id: string;
  title: string;
  createdAt: Date | null;
  smart?: SmartDetails;
  actions: ActionItem[];
};

const smartLabels: Record<keyof SmartDetails, string> = {
  specific: "Specific",
  measurable: "Measurable",
  achievable: "Achievable",
  relevant: "Relevant",
  timeBased: "Time-bound",
};

function formatDate(date: Date | null) {
  if (!date) return "Date not set";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function GoalsListPage() {
  const { user, loading: authLoading } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    const fetchGoals = async () => {
      setLoading(true);
      setError(null);

      try {
        const [targetsSnapshot, actionsSnapshot] = await Promise.all([
          getDocs(query(collection(db, "targets"), where("userId", "==", user.uid))),
          getDocs(query(collection(db, "actions"), where("userId", "==", user.uid))),
        ]);

        const actionsByTarget = new Map<string, ActionItem[]>();
        actionsSnapshot.forEach((actionDoc) => {
          const data = actionDoc.data();
          const targetId = typeof data.targetId === "string" ? data.targetId : "";

          if (!targetId) return;

          const existing = actionsByTarget.get(targetId) ?? [];
          existing.push({
            id: actionDoc.id,
            title: data.title || "Untitled action",
            deadline: safeToDate(data.deadline),
            status: data.status || "pending",
          });
          actionsByTarget.set(targetId, existing);
        });

        const goalData: Goal[] = targetsSnapshot.docs
          .map((targetDoc) => {
            const data = targetDoc.data();
            const goalActions = actionsByTarget.get(targetDoc.id) ?? [];

            goalActions.sort((a, b) => (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity));

            return {
              id: targetDoc.id,
              title: data.title || "Untitled goal",
              createdAt: safeToDate(data.createdAt),
              smart: data.smart,
              actions: goalActions,
            };
          })
          .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

        setGoals(goalData);
        if (goalData.length > 0) {
          setExpandedIds(new Set([goalData[0].id]));
        }
      } catch (fetchError) {
        console.error("Failed to load goals", fetchError);
        setError("We couldn't load your goals right now. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [authLoading, user]);

  const hasGoals = useMemo(() => goals.length > 0, [goals]);

  const toggleGoal = (goalId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  return (
    <RequireAuth>
      <div className={styles.surfaceContainer}>
        <div className={styles.pageShell}>
          <AppBarTop title="Goals List" />
          <StepCard>
            <StepTitle>Review your saved goals</StepTitle>
            <StepDescription>
              Browse every goal from latest to earliest. Tap a goal to see its SMART breakdown and the actions you planned.
            </StepDescription>
          </StepCard>

          {error ? (
            <StepCard>
              <p className={styles.errorText}>{error}</p>
            </StepCard>
          ) : null}

          {loading ? (
            <StepCard>
              <div className={styles.metaRow}>
                <div className={styles.loader} />
                <p className={styles.metaText}>Loading your goals…</p>
              </div>
            </StepCard>
          ) : null}

          {!loading && !hasGoals ? (
            <StepCard>
              <div className={styles.emptyState}>
                <p style={{ margin: 0 }}>
                  You haven’t saved any goals yet. Start with the goal wizard to capture your first plan.
                </p>
              </div>
            </StepCard>
          ) : null}

          <div className={styles.pageStack}>
            {goals.map((goal) => {
              const isOpen = expandedIds.has(goal.id);

              return (
                <StepCard
                  key={goal.id}
                  className={`${styles.accordionCard} ${isOpen ? styles.accordionOpen : ""}`.trim()}
                >
                  <button
                    type="button"
                    className={styles.accordionHeader}
                    onClick={() => toggleGoal(goal.id)}
                    aria-expanded={isOpen}
                  >
                    <div style={{ flex: 1 }}>
                      <div className={styles.metaRow}>
                        <span className={styles.chip}>Goal</span>
                        <span className={styles.metaText}>Created {formatDate(goal.createdAt)}</span>
                        <span className={styles.metaText}>{goal.actions.length} actions</span>
                      </div>
                      <h3 className={styles.accordionTitle}>{goal.title}</h3>
                    </div>
                    <span className={styles.chevron} aria-hidden>
                      ›
                    </span>
                  </button>

                  {isOpen ? (
                    <div className={styles.accordionContent}>
                      <div>
                        <p className={styles.sectionHeading}>SMART summary</p>
                        <div className={styles.smartGrid}>
                          {Object.entries(smartLabels).map(([key, label]) => (
                            <div key={key} className={styles.smartCard}>
                              <p className={styles.smartLabel}>{label}</p>
                              <p className={styles.smartText}>
                                {goal.smart?.[key as keyof SmartDetails] || "No details provided for this field."}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className={styles.sectionHeading}>Actions</p>
                        {goal.actions.length === 0 ? (
                          <div className={styles.emptyState}>No actions saved for this goal yet.</div>
                        ) : (
                          <ul className={styles.actionList}>
                            {goal.actions.map((action) => (
                              <li key={action.id} className={styles.actionItemRow}>
                                <div className={styles.actionItemContent}>
                                  <p className={styles.actionTitle}>{action.title}</p>
                                  <p className={styles.actionDeadline}>Deadline: {formatDate(action.deadline)}</p>
                                  <p className={styles.subtleLabel}>Status: {action.status}</p>
                                </div>
                                <span
                                  className={`${styles.statusPill} ${
                                    action.status.toLowerCase() === "done" ? styles.statusPillDone : ""
                                  }`.trim()}
                                >
                                  {action.status}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ) : null}
                </StepCard>
              );
            })}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
