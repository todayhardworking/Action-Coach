import { NextResponse } from 'next/server';
import { getAdminDb } from '../../../../lib/firebaseAdmin';

type UpdateActionRequest = {
  actionId?: string;
  status?: 'pending' | 'done';
};

export async function POST(request: Request) {
  let body: UpdateActionRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const actionId = typeof body.actionId === 'string' ? body.actionId.trim() : '';
  const status = body.status === 'done' || body.status === 'pending' ? body.status : null;

  if (!actionId) {
    return NextResponse.json({ error: 'actionId is required.' }, { status: 400 });
  }

  if (!status) {
    return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    await db.collection('actions').doc(actionId).update({ status });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update action status.', { error });
    return NextResponse.json({ error: 'Failed to update action.' }, { status: 500 });
  }
}
