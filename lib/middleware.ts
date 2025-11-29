import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  return payload?.userId || null;
}

export async function requireAuth(
  request: NextRequest
): Promise<{ userId: string } | NextResponse> {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return { userId };
}

