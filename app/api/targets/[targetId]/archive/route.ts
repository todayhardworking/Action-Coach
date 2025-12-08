import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAuthenticatedUser } from "@/lib/authServer";

interface ArchiveRequest {
  archived?: boolean; // true = archive, false = unarchive
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

  let body: ArchiveRequest = {};
  try {
    body = await request.json();
  } catch {
    /* empty body allowed */
  }

  const archived = body.archived === false ? false : true;  
  // default = archive

  try {
    const db = getAdminDb();
    const targetRef = db.collection("targets").doc(targetId);
    const targetSnap = await targetRef.get();

    // Target must exist
    if (!targetSnap.exists) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    const targetData = targetSnap.data();

    // Must belong to user
    if (targetData?.userId !== auth.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ──────────────────────────────────────────────────────────
    // Update target
    // ──────────────────────────────────────────────────────────
    const batch = db.batch();

    batch.update(targetRef, {
      archived,
      status: archived ? "archived" : "active",
      updatedAt: FieldValue.serverTimestamp(),
    });

    // ──────────────────────────────────────────────────────────
    // Cascade archive/unarchive all actions under the target
    // ──────────────────────────────────────────────────────────
    const actionsSnap = await db
      .collection("actions")
      .where("targetId", "==", targetId)
      .get();

    actionsSnap.forEach((doc) => {
      batch.update(doc.ref, {
        isArchived: archived,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      targetId,
      archived,
      actionsUpdated: actionsSnap.size
    });
  } catch (err) {
    console.error("target/archive failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
