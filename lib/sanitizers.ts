import { Timestamp } from "firebase-admin/firestore";

// Basic text cleaner
export const cleanText = (v: any): string =>
  typeof v === "string" ? v.trim() : "";

// Parse date → Timestamp | null
export const parseTimestamp = (v: any): Timestamp | null => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
};

// Frequency validator
export const cleanFrequency = (v: any): "daily" | "weekly" | "monthly" | "once" => {
  const allowed = ["daily", "weekly", "monthly", "once"];
  const f = cleanText(v).toLowerCase();
  return allowed.includes(f) ? (f as any) : "once";
};

// Repeat config cleaner
export function cleanRepeatConfig(raw: any) {
  if (!raw || typeof raw !== "object") return undefined;

  const validDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  const onDays = Array.isArray(raw.onDays)
    ? raw.onDays
        .map((d: any) => cleanText(d).toLowerCase())
        .filter((d: string) => validDays.includes(d))
    : undefined;

  const dayOfMonth =
    typeof raw.dayOfMonth === "number" &&
    raw.dayOfMonth >= 1 &&
    raw.dayOfMonth <= 31
      ? Math.floor(raw.dayOfMonth)
      : undefined;

  if (!onDays?.length && !dayOfMonth) return undefined;

  return {
    ...(onDays?.length ? { onDays } : {}),
    ...(dayOfMonth ? { dayOfMonth } : {}),
  };
}
