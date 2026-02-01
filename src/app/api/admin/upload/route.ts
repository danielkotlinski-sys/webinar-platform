import { NextRequest, NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session || !isAdmin(session.email)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { emails } = body as { emails: string[] };

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Nie podano prawidłowych emaili' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Insert emails one by one to handle duplicates gracefully
    let insertedCount = 0;

    for (const email of emails) {
      const normalizedEmail = email.toLowerCase().trim();

      // Check if already exists
      const { data: existing } = await supabase
        .from('registered_users')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('registered_users')
          .insert({ email: normalizedEmail });

        if (!error) {
          insertedCount++;
        }
      }
    }

    // Get total count after insertion
    const { count } = await supabase
      .from('registered_users')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      insertedCount,
      totalCount: count || 0,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Nie udało się wgrać emaili' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await getSession();

  if (!session || !isAdmin(session.email)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const supabase = createServerSupabaseClient();

    // Delete all registered users
    const { error } = await supabase
      .from('registered_users')
      .delete()
      .neq('id', 0); // Delete all rows

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Wszyscy zarejestrowani użytkownicy zostali usunięci',
    });
  } catch (error) {
    console.error('Clear error:', error);
    return NextResponse.json(
      { error: 'Nie udało się usunąć użytkowników' },
      { status: 500 }
    );
  }
}
