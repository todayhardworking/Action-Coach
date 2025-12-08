import { NextResponse } from "next/server";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import { requireAuthenticatedUser } from "../../../lib/authServer";
import { v4 as uuid } from "uuid";

// Minimal clean sanitizers
const text = (v: any) => (typeof v === "string" ? v.trim() : "");

const parseDate = (v: any): Timestamp | null => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
};

function sanitizeRepeatConfig(raw: any) {
  if (!raw || typeof raw !== "object") return undefined;

  const validDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  const onDays = Array.isArray(raw.onDays)
    ? raw.onDays
        .map((d) => (typeof d === "string" ? d.toLowerCase().trim() : ""))
        .filter((d) => validDays.includes(d))
    : undefined;

  const dayOfMonth =
    typeof raw.dayOfMonth === "number" &&
    raw.dayOfMonth >= 1 &&
    raw.dayOfMonth <= 31
      ? Math.floor(raw.dayOfMonth)
      : undefined;

  if (!onDays?.length && !dayOfMonth) return undefined;

  return { ...(onDays?.length ? { onDays } : {}), ...(dayOfMonth ? { dayOfMonth } : {}) };
}

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
  const goalTitle = text(body.goalTitle);
  const smart = body.smart;

  if (!goalTitle) {
    return NextResponse.json({ error: "goalTitle is required" }, { status: 400 });
  }

  // Minimal SMART validation
  const smartFields = ["specific", "measurable", "achievable", "relevant", "timeBased"];
  for (const f of smartFields) {
    if (!smart?.[f] || !text(smart[f])) {
      return NextResponse.json({ error: `SMART field '${f}' missing` }, { status: 400 });
    }
  }

  const actionsInput = Array.isArray(body.actions) ? body.actions : [];
  const now = Timestamp.now();

  const actions = actionsInput
    .map((a) => {
      const title = text(a.title);
      if (!title) return null;

      const deadline = parseDate(a.userDeadline ?? a.deadline);
      if (!deadline) return null;

      return {
        actionId: uuid(),
        userId,
        targetId: "", // filled after target creation
        title,
        description: text(a.description),
        frequency: text(a.frequency) || "once",
        repeatConfig: sanitizeRepeatConfig(a.repeatConfig),
        createdAt: now,
        updatedAt: now,
        deadline,
        completedDates: [],
        status: "pending",
        isArchived: false,
      };
    })
    .filter(Boolean);

  if (!actions.length) {
    return NextResponse.json(
      { error: "At least one valid action is required" },
      { status: 400 }
    );
  }

  try {
    const db = getAdminDb();
    const batch = db.batch();

    // Create target
    const targetRef = db.collection("targets").doc();
    const targetId = targetRef.id;

    batch.set(targetRef, {
      targetId,
      userId,
      title: goalTitle,
      smart,
      archived: false,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Create actions
    for (const action of actions) {
      action.targetId = targetId;
      const actionRef = db.collection("actions").doc(action.actionId);
      batch.set(actionRef, action);
    }

    await batch.commit();

    return NextResponse.json({ success: true, targetId });
  } catch (err) {
    console.error("save-goal-data failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
