import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    // Verify the ID token and get claims
    const decoded = await adminAuth.verifyIdToken(idToken);
    const role = decoded.role as string | undefined;

    // Only allow admin and super_admin to create a session
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: insufficient role' }, { status: 403 });
    }

    // Create a Firebase session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const response = NextResponse.json({ success: true, role });

    response.cookies.set('jeep-in-session', sessionCookie, {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[session] Failed to create session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('jeep-in-session', '', {
    maxAge: 0,
    path: '/',
  });
  return response;
}
