import { NextRequest, NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

const SETTINGS_KEY = 'webinar_settings';

interface WebinarSettings {
  slowModeSeconds: number;
  isLive: boolean;
  webinarStart: string | null; // ISO date string
}

const DEFAULT_SETTINGS: WebinarSettings = {
  slowModeSeconds: 10,
  isLive: false,
  webinarStart: null,
};

export async function GET() {
  const session = await getSession();

  // Allow any logged-in user to read settings (for isLive check)
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
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

    return NextResponse.json({ ...DEFAULT_SETTINGS, ...data.value });
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
    const { slowModeSeconds, isLive, webinarStart } = body as Partial<WebinarSettings>;

    const supabase = createServerSupabaseClient();

    // First get current settings
    const { data: currentData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single();

    const currentSettings = currentData?.value || DEFAULT_SETTINGS;

    // Merge with new settings
    const newSettings: WebinarSettings = {
      slowModeSeconds: slowModeSeconds ?? currentSettings.slowModeSeconds ?? DEFAULT_SETTINGS.slowModeSeconds,
      isLive: isLive ?? currentSettings.isLive ?? DEFAULT_SETTINGS.isLive,
      webinarStart: webinarStart !== undefined ? webinarStart : (currentSettings.webinarStart ?? DEFAULT_SETTINGS.webinarStart),
    };

    // Validate slowModeSeconds
    if (typeof newSettings.slowModeSeconds !== 'number' || newSettings.slowModeSeconds < 0 || newSettings.slowModeSeconds > 300) {
      return NextResponse.json(
        { error: 'Nieprawidłowa wartość pauzy (0-300 sekund)' },
        { status: 400 }
      );
    }

    // Upsert settings
    const { error } = await supabase
      .from('settings')
      .upsert({
        key: SETTINGS_KEY,
        value: newSettings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      ...newSettings,
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Nie udało się zapisać ustawień' },
      { status: 500 }
    );
  }
}
