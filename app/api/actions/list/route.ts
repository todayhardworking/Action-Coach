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
  description: string;  // <-- NEW
  deadline: string;
  status: 'pending' | 'done';
  targetId: string;
  goalTitle: string;
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

    query = query.orderBy('deadline', 'asc');

    const snapshot = await query.get();

    const actions: Omit<ActionResponse, 'goalTitle'>[] = snapshot.docs.map((doc) => {
      const data = doc.data();

      const deadlineValue = data.deadline;
      let deadline = '';

      if (deadlineValue instanceof Timestamp) {
        deadline = deadlineValue.toDate().toISOString();
      } else if (typeof deadlineValue === 'string') {
        deadline = deadlineValue;
      } else {
        const deadlineDate = toSafeDate(deadlineValue);
        deadline = deadlineDate ? deadlineDate.toISOString() : '';
      }

      return {
        id: doc.id,
        title: typeof data.title === 'string' ? data.title : '',
        description:
          typeof data.description === 'string' ? data.description : '', // <-- NEW FIELD
        deadline,
        status: data.status === 'done' ? 'done' : 'pending',
        targetId: typeof data.targetId === 'string' ? data.targetId : '',
      };
    });

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
