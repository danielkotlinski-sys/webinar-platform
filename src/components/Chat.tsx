'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '@/types/database';

interface ChatProps {
  userEmail: string;
  isAdmin?: boolean;
}

const DEFAULT_SLOW_MODE_SECONDS = 10;

export function Chat({ userEmail, isAdmin = false }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [slowModeSeconds, setSlowModeSeconds] = useState(DEFAULT_SLOW_MODE_SECONDS);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTimeRef = useRef<number>(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch slow mode settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setSlowModeSeconds(data.slowModeSeconds ?? DEFAULT_SLOW_MODE_SECONDS);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    fetchSettings();

    // Refresh settings every 30 seconds to catch admin changes
    const interval = setInterval(fetchSettings, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/chat');
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (!newMsg.is_deleted) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const updatedMsg = payload.new as ChatMessage;
          setMessages((prev) =>
            prev
              .map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
              .filter((msg) => !msg.is_deleted)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const timer = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isSending || cooldownRemaining > 0) return;

    setIsSending(true);
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewMessage('');
        lastMessageTimeRef.current = Date.now();
        // Only apply cooldown for non-admins when slow mode is enabled
        if (!isAdmin && slowModeSeconds > 0) {
          setCooldownRemaining(slowModeSeconds);
        }
      } else {
        setError(data.error || 'Nie udało się wysłać wiadomości');
      }
    } catch (err) {
      setError('Błąd sieci. Spróbuj ponownie.');
    } finally {
      setIsSending(false);
    }
  };

  const handleModerate = async (messageId: number, action: 'pin' | 'unpin' | 'delete') => {
    try {
      const response = await fetch('/api/chat/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, action }),
      });

      if (!response.ok) {
        console.error('Moderation failed');
      }
    } catch (error) {
      console.error('Moderation error:', error);
    }
  };

  const getDisplayName = (email: string) => {
    return email.split('@')[0];
  };

  const pinnedMessage = messages.find((m) => m.is_pinned);

  // Check if slow mode is enabled
  const isSlowModeEnabled = slowModeSeconds > 0;

  return (
    <div className="flex flex-col h-full w-full bg-white border-l border-[#d4d2cd]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#d4d2cd]">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg text-black">Czat na żywo</h2>
          {isSlowModeEnabled && !isAdmin && (
            <span className="text-xs text-[#6b6b6b]">
              Pauza: {slowModeSeconds}s
            </span>
          )}
        </div>
      </div>

      {/* Pinned Message */}
      {pinnedMessage && (
        <div className="flex-shrink-0 px-4 py-3 bg-[#285943]/5 border-b border-[#285943]/20">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-[#285943] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a.75.75 0 01.75.75v7.5a.75.75 0 01-1.5 0v-7.5A.75.75 0 0110 2z" />
                  <path fillRule="evenodd" d="M5.404 14.596A6.5 6.5 0 1116.5 10a1.25 1.25 0 01-2.5 0 4 4 0 10-8 0 1.25 1.25 0 01-2.5 0 6.5 6.5 0 011.904-4.596z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-[#285943] font-medium">Przypięte</span>
              </div>
              <p className="text-sm text-black break-words">{pinnedMessage.content}</p>
              <p className="text-xs text-[#6b6b6b] mt-1">— {getDisplayName(pinnedMessage.email)}</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => handleModerate(pinnedMessage.id, 'unpin')}
                className="text-[#6b6b6b] hover:text-black p-1 flex-shrink-0"
                title="Odepnij"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.filter(m => !m.is_pinned).map((message) => (
          <div
            key={message.id}
            className="animate-fade-in group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-[#285943]">
                  {getDisplayName(message.email)}
                </span>
                <p className="text-sm text-black break-words mt-0.5">
                  {message.content}
                </p>
              </div>
              {isAdmin && (
                <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleModerate(message.id, 'pin')}
                    className="text-[#6b6b6b] hover:text-[#285943] p-1"
                    title="Przypnij"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleModerate(message.id, 'delete')}
                    className="text-[#6b6b6b] hover:text-[#c45c3e] p-1"
                    title="Usuń"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-[#d4d2cd]">
        {error && (
          <p className="text-[#c45c3e] text-xs mb-2">{error}</p>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={cooldownRemaining > 0 ? `Poczekaj ${cooldownRemaining}s...` : 'Napisz wiadomość...'}
            disabled={isSending || cooldownRemaining > 0}
            maxLength={500}
            className="flex-1 px-3 py-2 bg-[#f5f4f2] border border-[#d4d2cd] rounded-lg text-sm text-black placeholder:text-[#6b6b6b] focus:outline-none focus:ring-2 focus:ring-[#285943] focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending || cooldownRemaining > 0}
            className="px-4 py-2 bg-[#285943] hover:bg-[#1e4633] text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            {cooldownRemaining > 0 ? cooldownRemaining : 'Wyślij'}
          </button>
        </form>
      </div>
    </div>
  );
}
