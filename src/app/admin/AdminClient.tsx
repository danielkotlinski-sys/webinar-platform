'use client';

import { useState, useEffect } from 'react';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Chat } from '@/components/Chat';
import { ViewerCount } from '@/components/ViewerCount';
import { SessionPing } from '@/components/SessionPing';

interface AdminClientProps {
  userEmail: string;
}

const SLOW_MODE_OPTIONS = [
  { value: 0, label: 'Brak pauzy' },
  { value: 5, label: '5 sekund' },
  { value: 10, label: '10 sekund' },
  { value: 15, label: '15 sekund' },
  { value: 30, label: '30 sekund' },
  { value: 60, label: '1 minuta' },
];

export function AdminClient({ userEmail }: AdminClientProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [slowModeSeconds, setSlowModeSeconds] = useState(10);
  const [isLive, setIsLive] = useState(false);
  const [webinarStart, setWebinarStart] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          setSlowModeSeconds(data.slowModeSeconds ?? 10);
          setIsLive(data.isLive ?? false);
          setWebinarStart(data.webinarStart ?? null);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const updateSettings = async (updates: Record<string, unknown>) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.slowModeSeconds !== undefined) setSlowModeSeconds(data.slowModeSeconds);
        if (data.isLive !== undefined) setIsLive(data.isLive);
        if (data.webinarStart !== undefined) setWebinarStart(data.webinarStart);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGoLive = () => {
    updateSettings({ isLive: true });
  };

  const handleStopLive = () => {
    if (confirm('Czy na pewno chcesz zakończyć transmisję? Widzowie stracą dostęp do streamu.')) {
      updateSettings({ isLive: false });
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  // Format date for datetime-local input
  const formatDateForInput = (isoString: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16);
  };

  return (
    <div className="h-screen bg-[#e8e6e1] flex flex-col overflow-hidden">
      <SessionPing />

      {/* Top Bar */}
      <header className="flex-shrink-0 h-14 px-4 flex items-center justify-between border-b border-[#d4d2cd] bg-white">
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#285943]/10 text-[#285943] text-xs font-medium rounded">
              ADMIN
            </span>
            <h1 className="font-serif text-lg hidden sm:block text-black">Webinar</h1>
          </div>
          <ViewerCount className="text-black" />
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Live Toggle Button */}
          {isLive ? (
            <button
              onClick={handleStopLive}
              disabled={isUpdating}
              className="px-3 py-1.5 text-xs sm:text-sm bg-[#c45c3e] hover:bg-[#a84d33] text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              NA ŻYWO
            </button>
          ) : (
            <button
              onClick={handleGoLive}
              disabled={isUpdating}
              className="px-3 py-1.5 text-xs sm:text-sm bg-[#285943] hover:bg-[#1e4633] text-white rounded-md transition-colors disabled:opacity-50"
            >
              Uruchom stream
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-black bg-[#f5f4f2] hover:bg-[#e8e6e1] rounded-md transition-colors border border-[#d4d2cd]"
            title="Ustawienia"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <a
            href="/admin/upload"
            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-black bg-[#f5f4f2] hover:bg-[#e8e6e1] rounded-md transition-colors border border-[#d4d2cd]"
          >
            <span className="hidden sm:inline">Uczestnicy</span>
            <span className="sm:hidden">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v1" />
              </svg>
            </span>
          </a>

          {/* Mobile chat toggle */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="lg:hidden px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-[#f5f4f2] hover:bg-[#e8e6e1] text-black rounded-md transition-colors border border-[#d4d2cd]"
          >
            {isChatOpen ? 'Wideo' : 'Czat'}
          </button>

          <button
            onClick={handleLogout}
            className="text-xs sm:text-sm text-[#6b6b6b] hover:text-black transition-colors"
          >
            Wyloguj
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="flex-shrink-0 px-4 py-4 bg-white border-b border-[#d4d2cd]">
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Webinar Start Time */}
            <div>
              <label className="block text-xs text-[#6b6b6b] mb-1">Data startu webinaru</label>
              <input
                type="datetime-local"
                value={formatDateForInput(webinarStart)}
                onChange={(e) => {
                  const value = e.target.value ? new Date(e.target.value).toISOString() : null;
                  setWebinarStart(value);
                  updateSettings({ webinarStart: value });
                }}
                className="w-full px-2 py-1.5 text-sm bg-white border border-[#d4d2cd] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#285943]"
              />
            </div>

            {/* Slow Mode */}
            <div>
              <label className="block text-xs text-[#6b6b6b] mb-1">Pauza między wiadomościami</label>
              <select
                value={slowModeSeconds}
                onChange={(e) => updateSettings({ slowModeSeconds: Number(e.target.value) })}
                disabled={isUpdating}
                className="w-full px-2 py-1.5 text-sm bg-white border border-[#d4d2cd] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#285943] disabled:opacity-50"
              >
                {SLOW_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status info */}
            <div>
              <label className="block text-xs text-[#6b6b6b] mb-1">Status streamu</label>
              <div className={`px-3 py-1.5 rounded text-sm font-medium ${isLive ? 'bg-[#c45c3e]/10 text-[#c45c3e]' : 'bg-[#6b6b6b]/10 text-[#6b6b6b]'}`}>
                {isLive ? '● Na żywo' : '○ Offline'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Video Player - admin always sees it */}
        <main className={`flex-1 min-w-0 ${isChatOpen ? 'hidden lg:block' : 'block'}`}>
          <VideoPlayer isAdmin={true} webinarStart={webinarStart} />
        </main>

        {/* Chat Sidebar with Admin Controls - full screen on mobile when open */}
        <aside
          className={`
            ${isChatOpen ? 'flex' : 'hidden'}
            lg:flex
            absolute lg:relative inset-0 lg:inset-auto
            w-full lg:w-80 xl:w-96 flex-shrink-0
            z-10 lg:z-auto
          `}
        >
          <Chat userEmail={userEmail} isAdmin />
        </aside>
      </div>
    </div>
  );
}
