"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebaseClient";

interface ActionItem {
  actionId: string;
  title: string;
  description: string;
  deadline: string;
  status: "pending" | "done";
  goalTitle: string;
  isArchived: boolean;
}

export default function ActionsListPage({ params }: { params: { targetId: string } }) {
  const router = useRouter();
  const { targetId } = params;

  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [goalTitle, setGoalTitle] = useState("");

  useEffect(() => {
    if (!targetId) {
      router.push("/");
      return;
    }

    async function load() {
      setLoading(true);

      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/actions/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetId }),
      });

      const data = await res.json();

      if (data?.actions) {
        setActions(data.actions);
        if (data.actions.length > 0) {
          setGoalTitle(data.actions[0].goalTitle);
        }
      }

      setLoading(false);
    }

    load();
  }, [targetId, router]);

  async function markDone(actionId: string) {
    const token = await auth.currentUser?.getIdToken();
    await fetch("/api/actions/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ actionId, status: "done" }),
    });

    setActions((prev) =>
      prev.map((a) => (a.actionId === actionId ? { ...a, status: "done" } : a))
    );
  }

  async function deleteAction(actionId: string) {
    const token = await auth.currentUser?.getIdToken();
    await fetch("/api/actions/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ actionId, mode: "soft" }),
    });

    setActions((prev) => prev.filter((a) => a.actionId !== actionId));
  }

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading actions...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{goalTitle}</h1>
      <p className="text-gray-600 mb-6">Actions for this goal</p>

      {actions.length === 0 ? (
        <div className="text-gray-500 text-center mt-8">
          No actions found for this goal.
        </div>
      ) : (
        actions.map((action) => (
          <div
            key={action.actionId}
            className="border rounded-xl p-4 mb-4 shadow-sm bg-white"
          >
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">{action.title}</h2>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  action.status === "done"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {action.status === "done" ? "Done" : "Pending"}
              </span>
            </div>

            <p className="text-gray-600 mt-2">{action.description}</p>

            <p className="text-sm text-gray-500 mt-2">
              Deadline: {new Intl.DateTimeFormat("en", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }).format(new Date(action.deadline))}
            </p>

            <div className="flex gap-3 mt-4">
              {action.status !== "done" && (
                <button
                  onClick={() => markDone(action.actionId)}
                  className="px-4 py-2 rounded bg-blue-600 text-white"
                >
                  Mark Done
                </button>
              )}

              <button
                onClick={() => deleteAction(action.actionId)}
                className="px-4 py-2 rounded bg-red-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
