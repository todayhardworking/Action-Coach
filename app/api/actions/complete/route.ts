import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { requireAuthenticatedUser } from '../../../../lib/authServer';

function getTodayMidnight(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

type CompleteActionRequest = {
  actionId?: string;
  userId?: string;
};

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedUser(request);
  if ('response' in authResult) {
    return authResult.response;
  }

  let body: CompleteActionRequest;
  try {
    body = await request.json();
  } catch (error) {
    console.error('Invalid JSON body for complete action request.', { error });
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const actionId = typeof body.actionId === 'string' ? body.actionId.trim() : '';
  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';

  if (!actionId || !userId) {
    return NextResponse.json({ error: 'actionId and userId are required.' }, { status: 400 });
  }

  if (userId !== authResult.uid) {
    return NextResponse.json({ error: 'Unauthorized user context.' }, { status: 403 });
  }

  try {
    const db = getAdminDb();
    const actionRef = db.collection('actions').doc(actionId);
    const actionSnapshot = await actionRef.get();

    if (!actionSnapshot.exists) {
      return NextResponse.json({ error: 'Action not found.' }, { status: 404 });
    }

    const actionData = actionSnapshot.data();

    if (!actionData || actionData.userId !== userId) {
      return NextResponse.json({ error: 'Action does not belong to the user.' }, { status: 403 });
    }

    if (actionData.isActive === false) {
      return NextResponse.json({ error: 'Action is not active.' }, { status: 400 });
    }

    const todayMidnight = getTodayMidnight();
    const todayTimestamp = Timestamp.fromDate(todayMidnight);
    const tomorrowMidnight = Timestamp.fromDate(new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000));

    const completionQuery = await db
      .collection('completions')
      .where('actionId', '==', actionId)
      .where('completionDate', '>=', todayTimestamp)
      .where('completionDate', '<', tomorrowMidnight)
      .limit(1)
      .get();

    if (!completionQuery.empty) {
      return NextResponse.json({ success: true, message: 'Action already checked in for today.' });
    }

    await db.collection('completions').add({
      actionId,
      userId,
      completionDate: todayTimestamp,
      timestamp: Timestamp.now(),
    });

    return NextResponse.json({ success: true, message: 'Action checked in successfully.' });
  } catch (error) {
    console.error('Failed to complete action.', { error });
    return NextResponse.json({ error: 'Failed to complete action.' }, { status: 500 });
  }
}
