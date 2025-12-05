import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '../../../../../lib/firebaseAdmin';
import { requireAuthenticatedUser } from '../../../../../lib/authServer';

type RouteParams = {
  params: { targetId: string };
};

export async function PATCH(request: Request, { params }: RouteParams) {
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

    const nextArchived = !(targetData?.archived === true);

    await targetRef.update({ archived: nextArchived, updatedAt: FieldValue.serverTimestamp() });

    return NextResponse.json({ archived: nextArchived });
  } catch (error) {
    console.error('Failed to update target.', { error });
    return NextResponse.json({ error: 'Failed to update target.' }, { status: 500 });
  }
}
