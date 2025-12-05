import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { requireAuthenticatedUser } from '../../../../lib/authServer';

type UpdateActionRequest = {
  actionId?: string;
  status?: 'pending' | 'done';
};

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedUser(request);
  if ('response' in authResult) {
    return authResult.response;
  }

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
    const actionRef = db.collection('actions').doc(actionId);
    const actionDoc = await actionRef.get();

    if (!actionDoc.exists) {
      return NextResponse.json({ error: 'Action not found.' }, { status: 404 });
    }

    const data = actionDoc.data();
    if (data?.userId !== authResult.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await actionRef.update({ status, updatedAt: FieldValue.serverTimestamp() });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update action status.', { error });
    return NextResponse.json({ error: 'Failed to update action.' }, { status: 500 });
  }
}
