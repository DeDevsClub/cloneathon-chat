import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { generateToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = session?.user?.email
    ? generateToken(session.user.id, session?.user?.email)
    : null;

  return NextResponse.json({ token });
}
