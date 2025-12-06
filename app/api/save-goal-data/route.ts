import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { requireAuthenticatedUser } from '../../../lib/authServer';

//
// ---------- Types ----------
//
type SmartDetails = {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBased: string;
};

type Frequency = 'daily' | 'weekly' | 'monthly' | 'once';

type RepeatConfig = {
  onDays?: string[];
  dayOfMonth?: number;
};

type ActionItem = {
  actionId?: string;
  targetId?: string;
  title?: string;
  description?: string;
  frequency?: Frequency;
  repeatConfig?: RepeatConfig;
  order?: number;
  completedDates?: (string | number)[];
  isArchived?: boolean;
  createdAt?: string | number;
  userDeadline?: string;
};

type SaveGoalRequest = {
  userId?: string;
  goalTitle?: string;
  smart?: Partial<SmartDetails>;
  actions?: ActionItem[];
};

//
// ---------- Validation Helpers ----------
//
function isValidSmart(smart: SmartDetails | undefined): smart is SmartDetails {
  return (
    typeof smart?.specific === 'string' &&
    typeof smart?.measurable === 'string' &&
    typeof smart?.achievable === 'string' &&
    typeof smart?.relevant === 'string' &&
    typeof smart?.timeBased === 'string' &&
    smart.specific.trim().length > 0 &&
    smart.measurable.trim().length > 0 &&
    smart.achievable.trim().length > 0 &&
    smart.relevant.trim().length > 0 &&
    smart.timeBased.trim().length > 0
  );
}

function sanitizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeFrequency(value: unknown): Frequency {
  const frequency = typeof value === 'string' ? value.toLowerCase().trim() : '';
  return ['daily', 'weekly', 'monthly', 'once'].includes(frequency)
    ? (frequency as Frequency)
    : 'once';
}

function sanitizeRepeatConfig(value: unknown): RepeatConfig | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const config = value as RepeatConfig;
  const onDays = Array.isArray(config.onDays)
    ? config.onDays
        .map((day) => (typeof day === 'string' ? day.toLowerCase().trim() : ''))
        .filter((day) => ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(day))
    : undefined;

  const dayOfMonth =
    typeof config.dayOfMonth === 'number' && config.dayOfMonth >= 1 && config.dayOfMonth <= 31
      ? Math.floor(config.dayOfMonth)
      : undefined;

  if ((onDays && onDays.length > 0) || dayOfMonth) {
    return { ...(onDays && onDays.length > 0 ? { onDays } : {}), ...(dayOfMonth ? { dayOfMonth } : {}) };
  }

  return undefined;
}

function parseTimestamp(value: unknown): Date | null {
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string') {
    const normalized = value.includes('T') ? value : `${value}T00:00:00.000Z`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

type SanitizedAction = {
  actionId: string;
  title: string;
  description?: string;
  frequency: Frequency;
  repeatConfig?: RepeatConfig;
  order: number;
  completedDates: Timestamp[];
  isArchived: boolean;
  createdAt: Timestamp;
  deadline: Timestamp;
};

function sanitizeActions(actions: unknown[] | undefined): SanitizedAction[] {
  if (!Array.isArray(actions) || actions.length === 0) {
    return [];
  }

  const now = new Date();

  return actions.reduce<SanitizedAction[]>((sanitized, rawAction, index) => {
    if (!rawAction || typeof rawAction !== 'object') return sanitized;

    const action = rawAction as ActionItem;
    const title = sanitizeText(action.title);
    const deadlineDate = parseTimestamp(action.userDeadline);
    if (!title || !deadlineDate) return sanitized;

    const frequency = sanitizeFrequency(action.frequency);
    const repeatConfig = sanitizeRepeatConfig(action.repeatConfig);
    const createdAtDate = parseTimestamp(action.createdAt) ?? now;

    const completedDates = Array.isArray(action.completedDates)
      ? action.completedDates
          .map((date) => parseTimestamp(date))
          .filter((date): date is Date => Boolean(date))
          .map((date) => Timestamp.fromDate(date))
      : [];

    const description = sanitizeText(action.description);

    sanitized.push({
      actionId: sanitizeText(action.actionId) || crypto.randomUUID(),
      title,
      description: description || undefined,
      frequency,
      repeatConfig,
      order: typeof action.order === 'number' ? action.order : index + 1,
      completedDates,
      isArchived: action.isArchived === true,
      createdAt: Timestamp.fromDate(createdAtDate),
      deadline: Timestamp.fromDate(deadlineDate),
    });

    return sanitized;
  }, []);
}

//
// ---------- Main API ----------
//
export async function POST(request: Request) {
  const authResult = await requireAuthenticatedUser(request);
  if ('response' in authResult) {
    return authResult.response;
  }

  let body: SaveGoalRequest;

  // Parse JSON safely
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  //
  // Required Fields
  //
  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  if (!userId || userId !== authResult.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const goalTitle = typeof body.goalTitle === 'string' ? body.goalTitle.trim() : '';
  if (!goalTitle) {
    return NextResponse.json({ error: 'goalTitle is required.' }, { status: 400 });
  }

  const smart = body.smart as SmartDetails | undefined;
  if (!isValidSmart(smart)) {
    return NextResponse.json({ error: 'SMART details are incomplete.' }, { status: 400 });
  }

  const actions = sanitizeActions(body.actions);
  if (!actions.length) {
    return NextResponse.json(
      {
        error: 'Each action must have a title, suggested cadence, and valid deadline.',
      },
      { status: 400 },
    );
  }

  //
  // Firestore Write
  //
  try {
    const db = getAdminDb();
    const batch = db.batch();

    // Create target document
    const targetRef = db.collection('targets').doc();
    const targetId = targetRef.id;

    batch.set(targetRef, {
      title: goalTitle,
      status: 'active',
      userId,
      smart,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Create action documents
    actions.forEach((action) => {
      const actionRef = db.collection('actions').doc(action.actionId);

      const payload = {
        title: action.title,
        description: action.description ?? '',
        frequency: action.frequency,
        order: action.order,
        completedDates: action.completedDates,
        isArchived: action.isArchived,
        targetId,
        userId,
        createdAt: action.createdAt,
        userDeadline: action.deadline,
        updatedAt: FieldValue.serverTimestamp(),
        status: 'pending',
      } as Record<string, unknown>;

      if (action.repeatConfig) {
        payload.repeatConfig = action.repeatConfig;
      }

      batch.set(actionRef, payload);
    });

    await batch.commit();

    return NextResponse.json({ success: true, targetId });
  } catch (error) {
    console.error('Failed to save goal data.', { error });
    return NextResponse.json(
      { error: 'Failed to save goal data.' },
      { status: 500 }
    );
  }
}
