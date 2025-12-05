import { NextResponse } from 'next/server';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { requireAuthenticatedUser } from '../../../../lib/authServer';

type DeleteActionRequest = {
  actionId?: string;
};

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedUser(request);
  if ('response' in authResult) {
    return authResult.response;
  }

  let body: DeleteActionRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const actionId = typeof body.actionId === 'string' ? body.actionId.trim() : '';

  if (!actionId) {
    return NextResponse.json({ error: 'actionId is required.' }, { status: 400 });
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

    await actionRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete action.', { error });
    return NextResponse.json({ error: 'Failed to delete action.' }, { status: 500 });
  }
}
