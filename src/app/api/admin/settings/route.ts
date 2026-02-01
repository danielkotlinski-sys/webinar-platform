import { NextRequest, NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

const SETTINGS_KEY = 'webinar_settings';

interface WebinarSettings {
  slowModeSeconds: number;
}

const DEFAULT_SETTINGS: WebinarSettings = {
  slowModeSeconds: 10,
};

export async function GET() {
  const session = await getSession();

  if (!session || !isAdmin(session.email)) {
    return NextResponse.json(
      { error: 'Wymagany dostęp administratora' },
      { status: 403 }
    );
  }

  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single();

    if (error || !data) {
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    return NextResponse.json(data.value as WebinarSettings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session || !isAdmin(session.email)) {
    return NextResponse.json(
      { error: 'Wymagany dostęp administratora' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { slowModeSeconds } = body as { slowModeSeconds: number };

    if (typeof slowModeSeconds !== 'number' || slowModeSeconds < 0 || slowModeSeconds > 300) {
      return NextResponse.json(
        { error: 'Nieprawidłowa wartość pauzy (0-300 sekund)' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const settings: WebinarSettings = {
      slowModeSeconds,
    };

    // Upsert settings
    const { error } = await supabase
      .from('settings')
      .upsert({
        key: SETTINGS_KEY,
        value: settings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      ...settings,
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Nie udało się zapisać ustawień' },
      { status: 500 }
    );
  }
}
