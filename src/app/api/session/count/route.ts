import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const supabase = createServerSupabaseClient();

    // Get count of active sessions (last ping within 15 seconds)
    const fifteenSecondsAgo = new Date(Date.now() - 15000).toISOString();

    const { count, error } = await supabase
      .from('active_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('last_ping', fifteenSecondsAgo);

    if (error) {
      throw error;
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Session count error:', error);
    return NextResponse.json(
      { error: 'Failed to get session count' },
      { status: 500 }
    );
  }
}
