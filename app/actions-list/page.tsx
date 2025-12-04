"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RequireAuth } from "../../components/auth/RequireAuth";
import { useAuth } from "../../components/auth/AuthProvider";

type ActionItem = {
  id: string;
  title: string;
  deadline: string;
  status: "pending" | "done";
  targetId: string;
};

export default function ActionsListPage() {
  const { user } = useAuth();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchActions = useCallback(async () => {
    if (!user) {
      setActions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/actions/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
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
  }, [user]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const handleMarkDone = useCallback(
    async (actionId: string) => {
      setProcessingId(actionId);
      setError(null);

      try {
        const response = await fetch("/api/actions/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    [fetchActions]
  );

  const handleDelete = useCallback(
    async (actionId: string) => {
      setProcessingId(actionId);
      setError(null);

      try {
        const response = await fetch("/api/actions/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    []
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

  const isBusy = (actionId: string) => loading || processingId === actionId;

  return (
    <RequireAuth>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Your Actions</h1>
          <p className="text-gray-600">Manage your action items and keep your goals on track.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-gray-600">Loading actions...</div>
        ) : formattedActions.length === 0 ? (
          <div className="text-gray-600">No actions found.</div>
        ) : (
          <div className="space-y-3">
            {formattedActions.map((action) => (
              <div
                key={action.id}
                className="rounded-xl border p-4 shadow-sm bg-white space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-gray-900">{action.title}</h2>
                    <p className="text-sm text-gray-600">Deadline: {action.deadlineDisplay}</p>
                    <p className="text-sm text-gray-600">Status: {action.status}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    className="bg-green-600 text-white px-3 py-1 rounded-lg disabled:opacity-70"
                    onClick={() => handleMarkDone(action.id)}
                    disabled={isBusy(action.id) || action.status === "done"}
                  >
                    Mark Done
                  </button>
                  <button
                    type="button"
                    className="bg-red-600 text-white px-3 py-1 rounded-lg disabled:opacity-70"
                    onClick={() => handleDelete(action.id)}
                    disabled={isBusy(action.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
