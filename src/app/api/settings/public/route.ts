import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

const SETTINGS_KEY = 'webinar_settings';

// Public settings that any logged-in user can read
interface PublicSettings {
  chatEnabled: boolean;
  welcomeMessage: string | null;
}

const DEFAULT_SETTINGS: PublicSettings = {
  chatEnabled: false,
  welcomeMessage: null,
};

export async function GET() {
  const session = await getSession();

  // Require login
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

    // Only return public fields
    const value = data.value as Record<string, unknown>;
    return NextResponse.json({
      chatEnabled: value.chatEnabled ?? DEFAULT_SETTINGS.chatEnabled,
      welcomeMessage: value.welcomeMessage ?? DEFAULT_SETTINGS.welcomeMessage,
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}
