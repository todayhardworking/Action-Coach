import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAuthenticatedUser } from "@/lib/authServer";
import { FieldValue } from "firebase-admin/firestore";

interface DeleteActionRequest {
  actionId?: string;
  mode?: "soft" | "hard"; // default: soft delete (archive)
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  let body: DeleteActionRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const actionId = typeof body.actionId === "string" ? body.actionId.trim() : "";
  const mode = body.mode === "hard" ? "hard" : "soft"; // fallback to soft

  if (!actionId) {
    return NextResponse.json({ error: "actionId is required" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const ref = db.collection("actions").doc(actionId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    const data = snap.data();

    // Ownership verification
    if (data?.userId !== auth.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ────────────────────────────────────────────────
    // HARD DELETE (permanent remove)
    // ────────────────────────────────────────────────
    if (mode === "hard") {
      await ref.delete();
      return NextResponse.json({ success: true, mode: "hard" });
    }

    // ────────────────────────────────────────────────
    // SOFT DELETE (archive)
    // ────────────────────────────────────────────────
    await ref.update({
      isArchived: true,
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, mode: "soft" });
  } catch (err) {
    console.error("actions/delete failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
