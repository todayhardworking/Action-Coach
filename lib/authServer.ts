import { NextResponse } from 'next/server';
import { getAdminAuth } from './firebaseAdmin';

type AuthSuccess = { uid: string };
type AuthFailure = { response: NextResponse };

function extractBearerToken(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization) return null;

  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;

  return token.trim();
}

export async function requireAuthenticatedUser(request: Request): Promise<AuthSuccess | AuthFailure> {
  const token = extractBearerToken(request);

  if (!token) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(token);

    return { uid: decoded.uid };
  } catch (error) {
    console.error('Failed to verify auth token.', { error });
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
}
