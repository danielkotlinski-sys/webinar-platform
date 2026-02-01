import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { disconnect } = body as { disconnect?: boolean };

    const supabase = createServerSupabaseClient();

    if (disconnect) {
      // Remove session on disconnect
      await supabase
        .from('active_sessions')
        .delete()
        .eq('email', session.email);

      return NextResponse.json({ success: true, action: 'disconnected' });
    }

    // Check if session exists
    const { data: existingSession } = await supabase
      .from('active_sessions')
      .select('id')
      .eq('email', session.email)
      .single();

    if (existingSession) {
      // Update existing session
      await supabase
        .from('active_sessions')
        .update({ last_ping: new Date().toISOString() })
        .eq('email', session.email);
    } else {
      // Create new session
      await supabase
        .from('active_sessions')
        .insert({
          email: session.email,
          last_ping: new Date().toISOString(),
        });
    }

    return NextResponse.json({ success: true, action: 'pinged' });
  } catch (error) {
    console.error('Session ping error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
