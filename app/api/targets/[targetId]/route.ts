import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../../lib/firebaseAdmin";
import { requireAuthenticatedUser } from "../../../../../lib/authServer";

interface DeleteRequest {
  mode?: "soft" | "hard"; // default: soft protect
}

export async function POST(
  request: Request,
  context: { params: { targetId: string } }
) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const targetId = context.params.targetId;
  if (!targetId) {
    return NextResponse.json({ error: "targetId missing" }, { status: 400 });
  }

  let body: DeleteRequest = {};
  try {
    body = await request.json();
  } catch {
    /* optional body allowed */
  }

  const mode = body.mode === "hard" ? "hard" : "soft"; // default = soft

  try {
    const db = getAdminDb();
    const targetRef = db.collection("targets").doc(targetId);
    const snap = await targetRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    const data = snap.data();
    if (data?.userId !== auth.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ────────────────────────────────────────────────
    // SAFETY OPTION 1: SOFT DELETE (recommended default)
    // ────────────────────────────────────────────────
    if (mode === "soft") {
      return NextResponse.json({
        success: false,
        message:
          "Soft delete mode enabled. Use archive endpoint to hide this goal. To permanently delete, send { mode: 'hard' }."
      });
    }

    // ────────────────────────────────────────────────
    // HARD DELETE: permanently delete target + actions
    // ────────────────────────────────────────────────
    const batch = db.batch();

    // Delete target
    batch.delete(targetRef);

    // Delete all actions tied to this target
    const actionsSnap = await db
      .collection("actions")
      .where("targetId", "==", targetId)
      .get();

    actionsSnap.forEach((doc) => batch.delete(doc.ref));

    await batch.commit();

    return NextResponse.json({
      success: true,
      targetId,
      actionsDeleted: actionsSnap.size,
      mode: "hard"
    });
  } catch (err) {
    console.error("target/delete failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
