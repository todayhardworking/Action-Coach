import { NextResponse } from "next/server";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import { requireAuthenticatedUser } from "../../../lib/authServer";

interface TargetsListRequest {
  includeArchived?: boolean; // default false
}

interface TargetResponse {
  targetId: string;
  title: string;
  archived: boolean;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
  smart: any;
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  let body: TargetsListRequest = {};
  try {
    body = await request.json();
  } catch {
    /* optional body, ignore errors */
  }

  const includeArchived = body.includeArchived === true;

  try {
    const db = getAdminDb();

    let query = db.collection("targets").where("userId", "==", auth.uid);

    if (!includeArchived) {
      query = query.where("archived", "==", false);
    }

    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.get();

    const targets: TargetResponse[] = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        targetId: data.targetId || doc.id,
        title: data.title || "",
        archived: data.archived === true,
        status: data.archived === true ? "archived" : "active",
        smart: data.smart || {},
        createdAt:
          data.createdAt?.toDate?.().toISOString?.() ||
          new Date().toISOString(),
        updatedAt:
          data.updatedAt?.toDate?.().toISOString?.() ||
          new Date().toISOString()
      };
    });

    return NextResponse.json({ targets });
  } catch (err) {
    console.error("targets/list failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
