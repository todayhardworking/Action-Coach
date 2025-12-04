export function safeToDate(value: any): Date | null {
  if (!value) return null;

  if (typeof value.toDate === "function") return value.toDate();

  if (value instanceof Date) return value;

  if (typeof value === "object" && "seconds" in value && "nanoseconds" in value) {
    return new Date(value.seconds * 1000);
  }

  return null;
}
