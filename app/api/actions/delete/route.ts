import { NextResponse } from 'next/server';
import { getAdminDb } from '../../../../lib/firebaseAdmin';

type DeleteActionRequest = {
  actionId?: string;
};

export async function POST(request: Request) {
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
    await db.collection('actions').doc(actionId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete action.', { error });
    return NextResponse.json({ error: 'Failed to delete action.' }, { status: 500 });
  }
}
