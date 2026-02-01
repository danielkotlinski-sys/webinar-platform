import { NextRequest, NextResponse } from 'next/server';
import { signToken, getSessionCookieOptions, isAdmin } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email: string; password?: string };

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email jest wymagany' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is admin
    if (isAdmin(normalizedEmail)) {
      // Admin requires password
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!password) {
        return NextResponse.json({
          requiresPassword: true,
          message: 'Podaj hasło administratora',
        });
      }

      if (password !== adminPassword) {
        return NextResponse.json(
          { error: 'Nieprawidłowe hasło' },
          { status: 401 }
        );
      }

      const token = await signToken(normalizedEmail);
      const cookieOptions = getSessionCookieOptions();

      const response = NextResponse.json({
        success: true,
        isAdmin: true,
        redirectTo: '/admin',
      });

      response.cookies.set(cookieOptions.name, token, {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge,
        path: cookieOptions.path,
      });

      return response;
    }

    // Check if email is registered
    const supabase = createServerSupabaseClient();

    const { data: user, error } = await supabase
      .from('registered_users')
      .select('email')
      .eq('email', normalizedEmail)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Ten email nie jest zarejestrowany na webinar' },
        { status: 401 }
      );
    }

    // Create session token
    const token = await signToken(normalizedEmail);
    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json({
      success: true,
      isAdmin: false,
      redirectTo: '/webinar',
    });

    response.cookies.set(cookieOptions.name, token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      maxAge: cookieOptions.maxAge,
      path: cookieOptions.path,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd. Spróbuj ponownie.' },
      { status: 500 }
    );
  }
}
