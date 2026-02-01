import { NextResponse } from 'next/server';
import { getSessionCookieOptions } from '@/lib/auth';

export async function POST() {
  const cookieOptions = getSessionCookieOptions();

  const response = NextResponse.json({ success: true });

  response.cookies.set(cookieOptions.name, '', {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    maxAge: 0,
    path: cookieOptions.path,
  });

  return response;
}
