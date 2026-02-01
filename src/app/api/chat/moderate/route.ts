import { NextRequest, NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

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
    const { messageId, action } = body as {
      messageId: number;
      action: 'pin' | 'unpin' | 'delete';
    };

    if (!messageId || !action) {
      return NextResponse.json(
        { error: 'ID wiadomości i akcja są wymagane' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    switch (action) {
      case 'pin':
        // First, unpin all messages
        await supabase
          .from('chat_messages')
          .update({ is_pinned: false })
          .eq('is_pinned', true);

        // Then pin the selected message
        await supabase
          .from('chat_messages')
          .update({ is_pinned: true })
          .eq('id', messageId);
        break;

      case 'unpin':
        await supabase
          .from('chat_messages')
          .update({ is_pinned: false })
          .eq('id', messageId);
        break;

      case 'delete':
        await supabase
          .from('chat_messages')
          .update({ is_deleted: true })
          .eq('id', messageId);
        break;

      default:
        return NextResponse.json(
          { error: 'Nieprawidłowa akcja' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, action, messageId });
  } catch (error) {
    console.error('Moderation error:', error);
    return NextResponse.json(
      { error: 'Nie udało się zmoderować wiadomości' },
      { status: 500 }
    );
  }
}
