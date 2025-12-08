import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAuthenticatedUser } from "@/lib/authServer";

// Types returned to frontend
interface ActionResponse {
  actionId: string;
  title: string;
  description: string;
  deadline: string;
  status: "pending" | "done";
  targetId: string;
  goalTitle: string;
  isArchived: boolean;
}

type ActionRecord = Omit<ActionResponse, "goalTitle">;

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = auth.uid;
  const targetId = typeof body.targetId === "string" ? body.targetId.trim() : "";

  try {
    const db = getAdminDb();

    // Base query
    let query = db.collection("actions").where("userId", "==", userId);

    // If targetId provided → filter by it
    if (targetId) {
      query = query.where("targetId", "==", targetId);
    }

    // Order by upcoming deadlines
    query = query.orderBy("deadline", "asc");

    const snapshot = await query.get();

    // Convert actions to safe response shape
    const actionsRaw: ActionRecord[] = snapshot.docs.map((doc) => {
      const data = doc.data();

      // Convert deadline to ISO string
      let deadline = "";
      if (data.deadline instanceof Timestamp) {
        deadline = data.deadline.toDate().toISOString();
      } else if (typeof data.deadline === "string") {
        deadline = new Date(data.deadline).toISOString();
      }

      const actionId = data.actionId || doc.id;

      return {
        actionId,
        title: data.title || "",
        description: data.description || "",
        deadline,
        status: data.status === "done" ? "done" : ("pending" as const),
        targetId: data.targetId || "",
        isArchived: data.isArchived === true,
      };
    });

    // Collect unique targetIds for lookup
    const uniqueTargetIds = Array.from(
      new Set(actionsRaw.map((a) => a.targetId).filter(Boolean))
    );

    // Fetch related target titles
    const targets = await Promise.all(
      uniqueTargetIds.map(async (tid) => {
        const ref = db.collection("targets").doc(tid);
        const doc = await ref.get();
        const title = doc.exists && typeof doc.data()?.title === "string"
          ? doc.data()!.title
          : "";
        return [tid, title] as const;
      })
    );

    const targetMap = new Map(targets);

    // Final response with goalTitle included
    const actions: ActionResponse[] = actionsRaw.map((a) => ({
      ...a,
      goalTitle: targetMap.get(a.targetId) || ""
    }));

    return NextResponse.json({ actions });
  } catch (err) {
    console.error("actions/list failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
