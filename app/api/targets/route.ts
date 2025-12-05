import { NextResponse } from 'next/server';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { requireAuthenticatedUser } from '../../../lib/authServer';
import { serializeTarget } from '../../../lib/targets';

export async function GET(request: Request) {
  const authResult = await requireAuthenticatedUser(request);
  if ('response' in authResult) {
    return authResult.response;
  }

  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('targets')
      .where('userId', '==', authResult.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const targets = snapshot.docs.map((doc) => serializeTarget(doc));

    return NextResponse.json({ targets });
  } catch (error) {
    console.error('Failed to load targets.', { error });
    return NextResponse.json({ error: 'Failed to load targets.' }, { status: 500 });
  }
}
