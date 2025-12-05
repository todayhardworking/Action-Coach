import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { toIsoStringOrNull, toSafeDate } from './firestoreTimestamps';

type SmartFieldKeys = 'specific' | 'measurable' | 'achievable' | 'relevant' | 'timeBased' | 'timebound';

export type TargetSmart = Partial<Record<SmartFieldKeys | string, unknown>>;

export type TargetDocument = {
  id: string;
  title: string;
  status?: string;
  smart?: TargetSmart | null;
  createdAt: string | null;
  updatedAt: string | null;
  archived: boolean;
  userId?: string;
  details: Record<string, unknown>;
};

function sanitizeValue(value: unknown): unknown {
  if (value && typeof value === 'object') {
    const maybeTimestamp = value as { toDate?: () => Date };
    if (typeof maybeTimestamp.toDate === 'function') {
      const date = toSafeDate(maybeTimestamp);
      return toIsoStringOrNull(date);
    }

    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }

    const entries = Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, sanitizeValue(val)]);
    return Object.fromEntries(entries);
  }

  return value ?? null;
}

export function serializeTarget(doc: DocumentSnapshot): TargetDocument {
  const data = doc.data() ?? {};
  const sanitizedData = sanitizeValue(data) as Record<string, unknown>;

  const createdAtDate = toSafeDate(data.createdAt as { toDate?: () => Date } | null | undefined);
  const updatedAtDate = toSafeDate(data.updatedAt as { toDate?: () => Date } | null | undefined);

  return {
    id: doc.id,
    title: typeof sanitizedData.title === 'string' ? sanitizedData.title : '',
    status: typeof sanitizedData.status === 'string' ? sanitizedData.status : undefined,
    smart:
      sanitizedData.smart && typeof sanitizedData.smart === 'object' && !Array.isArray(sanitizedData.smart)
        ? (sanitizedData.smart as TargetSmart)
        : null,
    createdAt:
      typeof sanitizedData.createdAt === 'string'
        ? sanitizedData.createdAt
        : toIsoStringOrNull(createdAtDate),
    updatedAt:
      typeof sanitizedData.updatedAt === 'string'
        ? sanitizedData.updatedAt
        : toIsoStringOrNull(updatedAtDate),
    archived: Boolean(sanitizedData.archived),
    userId: typeof sanitizedData.userId === 'string' ? sanitizedData.userId : undefined,
    details: sanitizedData,
  };
}
