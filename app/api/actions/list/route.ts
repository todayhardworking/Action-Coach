import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { requireAuthenticatedUser } from '../../../../lib/authServer';
import { toSafeDate } from '../../../../lib/firestoreTimestamps';

type ListActionsRequest = {
  userId?: string;
  targetId?: string;
};

type ActionResponse = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  userDeadline?: string;
  status: 'pending' | 'done';
  targetId: string;
  goalTitle: string;
  frequency?: string;
  repeatConfig?: { onDays?: string[]; dayOfMonth?: number };
  completedDates?: string[];
  createdAt?: string;
};

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedUser(request);
  if ('response' in authResult) {
    return authResult.response;
  }

  let body: ListActionsRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const targetId = typeof body.targetId === 'string' ? body.targetId.trim() : '';

  try {
    const db = getAdminDb();
    let query = db.collection('actions').where('userId', '==', authResult.uid);

    if (targetId) {
      query = query.where('targetId', '==', targetId);
    }

    query = query.orderBy('userDeadline', 'asc');

    const snapshot = await query.get();

    const normalizeDate = (value: unknown): string => {
      if (value instanceof Timestamp) {
        return value.toDate().toISOString();
      }

      if (typeof value === 'string') {
        return value;
      }

      const safeDate = toSafeDate(value);
      return safeDate ? safeDate.toISOString() : '';
    };

    const actions: Omit<ActionResponse, 'goalTitle'>[] = snapshot.docs
      .map((doc) => {
        const data = doc.data();

        if (data.isArchived) return null;

        const deadline = normalizeDate(data.deadline);
        const userDeadline = normalizeDate(data.userDeadline);
        const createdAt = normalizeDate(data.createdAt);

        const completedDates = Array.isArray(data.completedDates)
          ? data.completedDates
              .map((date) => normalizeDate(date))
              .filter((date): date is string => Boolean(date))
          : [];

        const repeatConfig =
          data.repeatConfig && typeof data.repeatConfig === 'object'
            ? {
                onDays: Array.isArray(data.repeatConfig.onDays)
                  ? data.repeatConfig.onDays.filter((value): value is string => typeof value === 'string')
                  : undefined,
                dayOfMonth:
                  typeof data.repeatConfig.dayOfMonth === 'number'
                    ? data.repeatConfig.dayOfMonth
                    : undefined,
              }
            : undefined;

        return {
          id: doc.id,
          title: typeof data.title === 'string' ? data.title : '',
          description: typeof data.description === 'string' ? data.description : '',
          deadline,
          userDeadline,
          status: data.status === 'done' ? 'done' : 'pending',
          targetId: typeof data.targetId === 'string' ? data.targetId : '',
          frequency: typeof data.frequency === 'string' ? data.frequency : undefined,
          repeatConfig,
          completedDates,
          createdAt,
        };
      })
      .filter((action): action is Omit<ActionResponse, 'goalTitle'> => Boolean(action));

    const uniqueTargetIds = Array.from(new Set(actions.map((action) => action.targetId).filter(Boolean)));

    const targets = await Promise.all(
      uniqueTargetIds.map(async (targetId) => {
        const targetDoc = await db.collection('targets').doc(targetId).get();
        const data = targetDoc.data();

        const title = data && typeof data.title === 'string' ? data.title : '';
        return [targetId, title] as const;
      })
    );

    const targetTitleMap = new Map<string, string>(targets);

    const actionsWithGoals: ActionResponse[] = actions.map((action) => ({
      ...action,
      goalTitle: targetTitleMap.get(action.targetId) ?? '',
    }));

    return NextResponse.json({ actions: actionsWithGoals });
  } catch (error) {
    console.error('Failed to fetch actions.', { error });
    return NextResponse.json(
      { error: 'Failed to fetch actions.' },
      { status: 500 }
    );
  }
}
