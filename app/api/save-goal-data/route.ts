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

type ActionItem = {
  title: string;
  deadline: string;
  description: string;
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

function isValidActions(actions: ActionItem[] | undefined): actions is ActionItem[] {
  if (!Array.isArray(actions) || actions.length === 0) {
    return false;
  }

  return actions.every(
    (action) =>
      typeof action?.title === 'string' &&
      action.title.trim().length > 0 &&
      typeof action?.deadline === 'string' &&
      action.deadline.trim().length > 0 &&
      typeof action.description === 'string' &&
      action.description.trim().length > 0
  );
}

function parseDeadline(deadline: string): Date | null {
  // Ensure a valid ISO format
  const normalized = deadline.includes('T')
    ? deadline
    : `${deadline}T00:00:00.000Z`;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

  const actions = body.actions;
  if (!isValidActions(actions)) {
    return NextResponse.json({
      error: 'Each action must have a title and deadline.',
    }, { status: 400 });
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
      const deadlineDate = parseDeadline(action.deadline);
      if (!deadlineDate) throw new Error('Invalid action deadline.');

      const actionRef = db.collection('actions').doc();

      batch.set(actionRef, {
        title: action.title.trim(),
        description: action.description.trim(),
        deadline: Timestamp.fromDate(deadlineDate),
        status: 'pending',
        targetId,
        userId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
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
