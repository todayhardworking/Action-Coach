"use client";

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { AppBarTop } from "../../components/md3/AppBarTop";
import { RequireAuth } from "../../components/auth/RequireAuth";
import { StepCard } from "../../components/md3/StepCard";
import { StepDescription } from "../../components/md3/StepDescription";
import { StepTitle } from "../../components/md3/StepTitle";
import styles from "../../components/md3/md3.module.css";
import { db } from "../../lib/firebaseClient";
import { useAuth } from "../../components/auth/AuthProvider";

type ActionListItem = {
  id: string;
  title: string;
  deadline: Date | null;
  status: string;
  goalTitle: string;
  createdAt: Date | null;
};

type GoalMeta = {
  id: string;
  title: string;
};

function formatDate(date: Date | null) {
  if (!date) return "No deadline set";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function sortActions(actions: ActionListItem[]) {
  return [...actions].sort((a, b) => {
    const deadlineDiff = (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity);
    if (deadlineDiff !== 0) return deadlineDiff;

    return (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
  });
}

export default function ActionsListPage() {
  const { user } = useAuth();
  const [actions, setActions] = useState<ActionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setActions([]);
      return;
    }

    const fetchActions = async () => {
      setLoading(true);
      setError(null);

      try {
        const [targetsSnapshot, actionsSnapshot] = await Promise.all([
          getDocs(query(collection(db, "targets"), where("userId", "==", user.uid))),
          getDocs(query(collection(db, "actions"), where("userId", "==", user.uid))),
        ]);

        const goals = new Map<string, GoalMeta>();
        targetsSnapshot.forEach((targetDoc) => {
          const data = targetDoc.data();
          goals.set(targetDoc.id, {
            id: targetDoc.id,
            title: data.title || "Untitled goal",
          });
        });

        const mappedActions: ActionListItem[] = actionsSnapshot.docs.map((actionDoc) => {
          const data = actionDoc.data();
          const targetId = typeof data.targetId === "string" ? data.targetId : "";
          const goalTitle = goals.get(targetId)?.title || "Unknown goal";

          return {
            id: actionDoc.id,
            title: data.title || "Untitled action",
            deadline: data.deadline?.toDate?.() ?? null,
            status: data.status || "pending",
            goalTitle,
            createdAt: data.createdAt?.toDate?.() ?? null,
          };
        });

        setActions(sortActions(mappedActions));
      } catch (fetchError) {
        console.error("Failed to load actions", fetchError);
        setError("We couldn't load your actions right now. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchActions();
  }, [user]);

  const updateActionStatus = async (actionId: string, newStatus: string) => {
    if (!user) return;

    try {
      setBusyId(actionId);
      await updateDoc(doc(db, "actions", actionId), { status: newStatus });
      setActions((current) =>
        sortActions(current.map((action) => (action.id === actionId ? { ...action, status: newStatus } : action))),
      );
    } catch (updateError) {
      console.error("Failed to update action status", updateError);
      setError("Unable to update this action. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteAction = async (actionId: string) => {
    if (!user) return;

    const confirmed = window.confirm("Delete this action? This cannot be undone.");
    if (!confirmed) return;

    try {
      setBusyId(actionId);
      await deleteDoc(doc(db, "actions", actionId));
      setActions((current) => current.filter((action) => action.id !== actionId));
    } catch (deleteError) {
      console.error("Failed to delete action", deleteError);
      setError("Unable to delete this action. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <RequireAuth>
      <div className={styles.surfaceContainer}>
        <div className={styles.pageShell}>
          <AppBarTop title="Actions List" />
            <StepCard>
              <StepTitle>Stay on top of your actions</StepTitle>
              <StepDescription>
                Every action across your goals is listed here, starting with the earliest deadlines. Update a task when it’s
                complete or remove it if you no longer need it.
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
                <p className={styles.metaText}>Loading your actions…</p>
              </div>
            </StepCard>
          ) : null}

          {!loading && actions.length === 0 ? (
            <StepCard>
              <div className={styles.emptyState}>
                <p style={{ margin: 0 }}>No actions to show yet. Add a goal to see its action steps here.</p>
              </div>
            </StepCard>
          ) : null}

          <div className={styles.pageStack}>
            {actions.map((action) => (
              <StepCard key={action.id}>
                <div className={styles.metaRow}>
                  <span
                    className={`${styles.statusPill} ${
                      action.status.toLowerCase() === "done" ? styles.statusPillDone : ""
                    }`.trim()}
                  >
                    {action.status}
                  </span>
                  <span className={styles.metaText}>Deadline: {formatDate(action.deadline)}</span>
                </div>
                <h3 className={styles.accordionTitle}>{action.title}</h3>
                <p className={styles.subtleLabel}>Goal: {action.goalTitle}</p>
                <div className={styles.actionButtons}>
                  <button
                    type="button"
                    className={`${styles.filledButton} ${styles.inlineButton}`}
                    onClick={() => updateActionStatus(action.id, "done")}
                    disabled={busyId === action.id || action.status.toLowerCase() === "done"}
                  >
                    {action.status.toLowerCase() === "done" ? "Completed" : "Mark done"}
                  </button>
                  <button
                    type="button"
                    className={`${styles.ghostButton} ${styles.inlineButton} ${styles.dangerButton}`}
                    onClick={() => deleteAction(action.id)}
                    disabled={busyId === action.id}
                  >
                    Delete
                  </button>
                </div>
              </StepCard>
            ))}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
