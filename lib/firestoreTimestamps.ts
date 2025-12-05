type TimestampLike = { toDate?: () => Date } | null | undefined;

export function toSafeDate(value: TimestampLike): Date | null {
  const date = value?.toDate?.();
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
}

export function toIsoStringOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}
