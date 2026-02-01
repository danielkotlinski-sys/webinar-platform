import { NextRequest, NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

const SETTINGS_KEY = 'webinar_settings';
const DEFAULT_SLOW_MODE_SECONDS = 10;

async function getSlowModeSeconds(supabase: ReturnType<typeof createServerSupabaseClient>): Promise<number> {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single();

    if (data?.value?.slowModeSeconds !== undefined) {
      return data.value.slowModeSeconds;
    }
  } catch {
    // Use default if settings not found
  }
  return DEFAULT_SLOW_MODE_SECONDS;
}

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

    // Get recent messages (last 100, non-deleted)
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      throw error;
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Chat fetch error:', error);
    return NextResponse.json(
      { error: 'Nie udało się pobrać wiadomości' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { content } = body as { content: string };

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Treść wiadomości jest wymagana' },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0 || trimmedContent.length > 500) {
      return NextResponse.json(
        { error: 'Wiadomość musi mieć od 1 do 500 znaków' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Check slow mode (skip for admin)
    if (!isAdmin(session.email)) {
      const slowModeSeconds = await getSlowModeSeconds(supabase);

      // Only check if slow mode is enabled (> 0)
      if (slowModeSeconds > 0) {
        const slowModeThreshold = new Date(Date.now() - slowModeSeconds * 1000).toISOString();

        const { data: recentMessage } = await supabase
          .from('chat_messages')
          .select('created_at')
          .eq('email', session.email)
          .gte('created_at', slowModeThreshold)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (recentMessage) {
          const lastMessageTime = new Date(recentMessage.created_at).getTime();
          const waitTime = Math.ceil((lastMessageTime + slowModeSeconds * 1000 - Date.now()) / 1000);

          return NextResponse.json(
            { error: `Poczekaj ${waitTime} sekund przed wysłaniem kolejnej wiadomości` },
            { status: 429 }
          );
        }
      }
    }

    // Insert message
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        email: session.email,
        content: trimmedContent,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Chat send error:', error);
    return NextResponse.json(
      { error: 'Nie udało się wysłać wiadomości' },
      { status: 500 }
    );
  }
}
