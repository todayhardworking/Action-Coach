import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAuthenticatedUser } from "@/lib/authServer";

interface UpdateActionRequest {
  actionId?: string;
  status?: "pending" | "done";
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  let body: UpdateActionRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const actionId = typeof body.actionId === "string" ? body.actionId.trim() : "";
  const status = body.status === "done" || body.status === "pending" ? body.status : null;

  if (!actionId) {
    return NextResponse.json({ error: "actionId is required" }, { status: 400 });
  }

  if (!status) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const actionRef = db.collection("actions").doc(actionId);
    const actionDoc = await actionRef.get();

    // Check action exists
    if (!actionDoc.exists) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    const data = actionDoc.data();

    // Check if action belongs to current user
    if (data?.userId !== auth.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update only status + updatedAt
    await actionRef.update({
      status,
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("actions/update failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
