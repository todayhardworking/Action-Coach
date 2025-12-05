import { NextResponse } from 'next/server';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { requireAuthenticatedUser } from '../../../../lib/authServer';

type RouteParams = {
  params: { targetId: string };
};

export async function DELETE(request: Request, { params }: RouteParams) {
  const authResult = await requireAuthenticatedUser(request);
  if ('response' in authResult) {
    return authResult.response;
  }

  const targetId = params?.targetId?.trim();
  if (!targetId) {
    return NextResponse.json({ error: 'targetId is required.' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const targetRef = db.collection('targets').doc(targetId);
    const targetDoc = await targetRef.get();

    if (!targetDoc.exists) {
      return NextResponse.json({ error: 'Target not found.' }, { status: 404 });
    }

    const targetData = targetDoc.data();
    if (targetData?.userId !== authResult.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batch = db.batch();
    batch.delete(targetRef);

    const actionsSnapshot = await db
      .collection('actions')
      .where('targetId', '==', targetId)
      .where('userId', '==', authResult.uid)
      .get();

    actionsSnapshot.forEach((actionDoc) => batch.delete(actionDoc.ref));

    await batch.commit();

    return NextResponse.json({ success: true, deletedActions: actionsSnapshot.size });
  } catch (error) {
    console.error('Failed to delete target.', { error });
    return NextResponse.json({ error: 'Failed to delete target.' }, { status: 500 });
  }
}
