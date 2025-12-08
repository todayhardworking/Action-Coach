import { Timestamp } from "firebase-admin/firestore";

export function tsToIso(v: any): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === "string") return new Date(v).toISOString();
  return new Date().toISOString();
}
