"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { AppBarTop } from "@/components/md3/AppBarTop";
import { StepCard } from "@/components/md3/StepCard";
import { StepDescription } from "@/components/md3/StepDescription";
import { StepTitle } from "@/components/md3/StepTitle";
import styles from "@/components/md3/md3.module.css";
import type { TargetDocument, TargetSmart } from "@/lib/targets";

type TargetItem = TargetDocument;

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function SmartList({ smart }: { smart?: TargetSmart | null }) {
  const entries = useMemo(
    () =>
      smart
        ? Object.entries(smart).filter(
            ([, val]) => typeof val === "string" && val.trim().length > 0,
          )
        : [],
    [smart]
  );

  if (entries.length === 0) return null;

  return (
    <ul style={{ paddingLeft: "1.25rem", listStyle: "disc" }} className={styles.supportText}>
      {entries.map(([key, val]) => (
        <li key={key}>
          <strong className="capitalize">{key}:</strong> {String(val)}
        </li>
      ))}
    </ul>
  );
}

export default function GoalsListPage() {
  const { user } = useAuth();
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(async () => {
    if (!user) return null;

    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }, [user]);

  const fetchTargets = useCallback(async () => {
    if (!user) {
      setTargets([]);
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

      const response = await fetch("/api/targets", { headers });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to load targets.");
      }

      setTargets(Array.isArray(data.targets) ? data.targets : []);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load targets.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, user]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  const handleDelete = useCallback(
    async (targetId: string) => {
      if (!window.confirm("Delete this target? All related actions will be removed.")) {
        return;
      }

      setProcessingId(targetId);
      setError(null);

      try {
        const headers = await getAuthHeaders();
        if (!headers) {
          throw new Error("Missing authentication token.");
        }

        const response = await fetch(`/api/targets/${targetId}`, {
          method: "DELETE",
          headers,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Failed to delete target.");
        }

        setTargets((current) => current.filter((target) => target.id !== targetId));
      } catch (deleteError) {
        console.error(deleteError);
        setError(deleteError instanceof Error ? deleteError.message : "Failed to delete target.");
      } finally {
        setProcessingId(null);
      }
    },
    [getAuthHeaders]
  );

  const handleArchiveToggle = useCallback(
    async (targetId: string) => {
      setProcessingId(targetId);
      setError(null);

      try {
        const headers = await getAuthHeaders();
        if (!headers) {
          throw new Error("Missing authentication token.");
        }

        const response = await fetch(`/api/targets/${targetId}/archive`, {
          method: "PATCH",
          headers,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Failed to update target.");
        }

        setTargets((current) =>
          current.map((target) =>
            target.id === targetId ? { ...target, archived: data.archived === true } : target,
          ),
        );
      } catch (archiveError) {
        console.error(archiveError);
        setError(archiveError instanceof Error ? archiveError.message : "Failed to update target.");
      } finally {
        setProcessingId(null);
      }
    },
    [getAuthHeaders]
  );

  const summary = useMemo(() => {
    const archivedCount = targets.filter((target) => target.archived).length;
    const activeCount = targets.length - archivedCount;
    return { archivedCount, activeCount };
  }, [targets]);

  return (
    <RequireAuth>
      <div className={styles.surfaceContainer}>
        <div className={styles.wizardShell}>
          <AppBarTop title="Goals" />

          <StepCard>
            <StepTitle>Your goals</StepTitle>
            <StepDescription>
              Browse every target you have created. Tap a goal to view its actions, archive finished work,
              or delete a plan you no longer need.
            </StepDescription>
            <div className={`${styles.contentStack} ${styles.topSpacing}`}>
              <div className={`${styles.statusCard} ${styles.statusSuccess}`}>
                <div className={styles.statusIcon}>🎯</div>
                <div>
                  <p className={styles.statusTitle}>Collection overview</p>
                  <p className={styles.supportText}>
                    {summary.activeCount} active · {summary.archivedCount} archived
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
                  <p className={styles.supportText}>Loading your goals...</p>
                </div>
              </StepCard>
            ) : targets.length === 0 ? (
              <StepCard elevated>
                <StepTitle>Nothing to show yet</StepTitle>
                <StepDescription>
                  Create a goal in the wizard to start tracking progress in this view.
                </StepDescription>
              </StepCard>
            ) : (
              targets.map((target) => (
                <StepCard key={target.id} elevated>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-2">
                        <div className={styles.badge}>
                          {target.archived ? "Archived" : "Active"} · Created {formatDate(target.createdAt)}
                        </div>
                        <Link
                          href={`/goals-list/${target.id}`}
                          className="text-xl font-semibold text-gray-900 hover:underline"
                        >
                          {target.title || "Untitled goal"}
                        </Link>
                        {target.status ? (
                          <p className={styles.supportText}>Status: {target.status}</p>
                        ) : null}
                        <SmartList smart={target.smart} />
                      </div>
                      <div className="flex gap-2">
                        {target.archived ? (
                          <span className={styles.chip}>Archived</span>
                        ) : (
                          <span className={`${styles.chip} bg-green-50 text-green-800`}>In progress</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.actionsRow}>
                      <button
                        type="button"
                        className={styles.filledButton}
                        onClick={() => handleArchiveToggle(target.id)}
                        disabled={processingId === target.id}
                      >
                        {processingId === target.id
                          ? "Saving..."
                          : target.archived
                            ? "Unarchive"
                            : "Archive"}
                      </button>
                      <button
                        type="button"
                        className={styles.tonalButton}
                        onClick={() => handleDelete(target.id)}
                        disabled={processingId === target.id}
                      >
                        {processingId === target.id ? "Removing..." : "Delete"}
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
