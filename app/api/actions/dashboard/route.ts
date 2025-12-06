import { NextResponse } from 'next/server';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { requireAuthenticatedUser } from '../../../../lib/authServer';
import { toIsoStringOrNull, toSafeDate } from '../../../../lib/firestoreTimestamps';

type DashboardAction = {
  id: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  isCompletedToday: boolean;
  streak: number;
};

function getTodayMidnight(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

function startOfMonth(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

function calculateDailyStreak(completionDates: Date[], todayMidnightMs: number) {
  const completionSet = new Set(
    completionDates.map((date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized.getTime();
    })
  );

  let streak = 0;
  let cursor = todayMidnightMs;

  while (completionSet.has(cursor)) {
    streak += 1;
    cursor -= 24 * 60 * 60 * 1000;
  }

  return streak;
}

function calculateWeeklyStreak(completionDates: Date[], today: Date) {
  const completionSet = new Set(completionDates.map((date) => startOfWeek(date)));
  let streak = 0;
  let cursor = startOfWeek(today);

  while (completionSet.has(cursor)) {
    streak += 1;
    cursor -= 7 * 24 * 60 * 60 * 1000;
  }

  return streak;
}

function calculateMonthlyStreak(completionDates: Date[], today: Date) {
  const completionSet = new Set(completionDates.map((date) => startOfMonth(date)));
  let streak = 0;
  let cursor = startOfMonth(today);

  while (completionSet.has(cursor)) {
    streak += 1;
    const cursorDate = new Date(cursor);
    cursorDate.setMonth(cursorDate.getMonth() - 1);
    cursor = startOfMonth(cursorDate);
  }

  return streak;
}

function calculateStreak(frequency: DashboardAction['frequency'], completionDates: Date[], today: Date) {
  const todayMidnight = today.getTime();

  if (frequency === 'weekly') {
    return calculateWeeklyStreak(completionDates, today);
  }

  if (frequency === 'monthly') {
    return calculateMonthlyStreak(completionDates, today);
  }

  return calculateDailyStreak(completionDates, todayMidnight);
}

export async function GET(request: Request) {
  const authResult = await requireAuthenticatedUser(request);
  if ('response' in authResult) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId')?.trim();

  if (!userId) {
    return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
  }

  if (userId !== authResult.uid) {
    return NextResponse.json({ error: 'Unauthorized user context.' }, { status: 403 });
  }

  try {
    const db = getAdminDb();
    const today = getTodayMidnight();

    const actionsSnapshot = await db
      .collection('actions')
      .where('userId', '==', userId)
      .get();

    const actions: DashboardAction[] = await Promise.all(
      actionsSnapshot.docs.map(async (actionDoc) => {
        const data = actionDoc.data();
        const frequency = ['daily', 'weekly', 'monthly'].includes(data.frequency)
          ? (data.frequency as DashboardAction['frequency'])
          : 'daily';

        const isActive = data.isActive !== false;

        const completionsSnapshot = await db
          .collection('completions')
          .where('actionId', '==', actionDoc.id)
          .orderBy('completionDate', 'desc')
          .limit(120)
          .get();

        const completionDates = completionsSnapshot.docs
          .map((doc) => toSafeDate(doc.data().completionDate))
          .filter((date): date is Date => Boolean(date));

        const isCompletedToday = completionDates.some((date) => {
          const normalized = new Date(date);
          normalized.setHours(0, 0, 0, 0);
          return normalized.getTime() === today.getTime();
        });

        const streak = calculateStreak(frequency, completionDates, today);

        return {
          id: actionDoc.id,
          description: typeof data.description === 'string' ? data.description : '',
          frequency,
          startDate: toIsoStringOrNull(toSafeDate(data.startDate)),
          endDate: toIsoStringOrNull(toSafeDate(data.endDate)),
          isActive,
          isCompletedToday,
          streak,
        };
      })
    );

    const activeActions = actions.filter((action) => action.isActive);

    return NextResponse.json({ actions: activeActions });
  } catch (error) {
    console.error('Failed to load dashboard actions.', { error });
    return NextResponse.json({ error: 'Failed to load actions.' }, { status: 500 });
  }
}
