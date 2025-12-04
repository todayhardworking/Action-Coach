import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '../../../../lib/firebaseAdmin';

type ListActionsRequest = {
  userId?: string;
};

type ActionResponse = {
  id: string;
  title: string;
  description: string;  // <-- NEW
  deadline: string;
  status: 'pending' | 'done';
  targetId: string;
};

export async function POST(request: Request) {
  let body: ListActionsRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';

  if (!userId) {
    return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('actions')
      .where('userId', '==', userId)
      .orderBy('deadline', 'asc')
      .get();

    const actions: ActionResponse[] = snapshot.docs.map((doc) => {
      const data = doc.data();

      const deadlineValue = data.deadline;
      const deadline =
        deadlineValue instanceof Timestamp
          ? deadlineValue.toDate().toISOString()
          : '';

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

    return NextResponse.json({ actions });
  } catch (error) {
    console.error('Failed to fetch actions.', { error });
    return NextResponse.json(
      { error: 'Failed to fetch actions.' },
      { status: 500 }
    );
  }
}
