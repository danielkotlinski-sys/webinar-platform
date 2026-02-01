import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
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

    return NextResponse.json(data.value as WebinarSettings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}
