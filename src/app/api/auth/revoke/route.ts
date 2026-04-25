import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();

    // Verify the caller is a super_admin via their session cookie
    const sessionCookie = request.cookies.get('jeep-in-session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Revoke all refresh tokens — kicks the user out of any active session
    await adminAuth.revokeRefreshTokens(uid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[revoke] Failed to revoke session:', error);
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
  }
}
