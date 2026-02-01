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
  const [isUpdatingSlowMode, setIsUpdatingSlowMode] = useState(false);

  // Fetch current slow mode setting
  useEffect(() => {
    const fetchSlowMode = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          setSlowModeSeconds(data.slowModeSeconds ?? 10);
        }
      } catch (error) {
        console.error('Failed to fetch slow mode setting:', error);
      }
    };
    fetchSlowMode();
  }, []);

  const handleSlowModeChange = async (value: number) => {
    setIsUpdatingSlowMode(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slowModeSeconds: value }),
      });
      if (response.ok) {
        setSlowModeSeconds(value);
      }
    } catch (error) {
      console.error('Failed to update slow mode:', error);
    } finally {
      setIsUpdatingSlowMode(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
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
          {/* Slow Mode Selector */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-[#6b6b6b]">Pauza czatu:</span>
            <select
              value={slowModeSeconds}
              onChange={(e) => handleSlowModeChange(Number(e.target.value))}
              disabled={isUpdatingSlowMode}
              className="px-2 py-1 text-xs bg-white border border-[#d4d2cd] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#285943] disabled:opacity-50"
            >
              {SLOW_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <a
            href="/admin/upload"
            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-black bg-[#f5f4f2] hover:bg-[#e8e6e1] rounded-md transition-colors border border-[#d4d2cd]"
          >
            <span className="hidden sm:inline">Zarządzaj uczestnikami</span>
            <span className="sm:hidden">Uczestnicy</span>
          </a>
          {/* Mobile chat toggle */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="lg:hidden px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-[#f5f4f2] hover:bg-[#e8e6e1] text-black rounded-md transition-colors border border-[#d4d2cd]"
          >
            {isChatOpen ? 'Wideo' : 'Czat'}
          </button>
          <span className="text-xs sm:text-sm text-[#6b6b6b] hidden md:block truncate max-w-[150px]">
            {userEmail}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs sm:text-sm text-[#6b6b6b] hover:text-black transition-colors"
          >
            Wyloguj
          </button>
        </div>
      </header>

      {/* Mobile Slow Mode Selector */}
      <div className="md:hidden flex-shrink-0 px-4 py-2 bg-white border-b border-[#d4d2cd] flex items-center justify-between">
        <span className="text-xs text-[#6b6b6b]">Pauza między wiadomościami:</span>
        <select
          value={slowModeSeconds}
          onChange={(e) => handleSlowModeChange(Number(e.target.value))}
          disabled={isUpdatingSlowMode}
          className="px-2 py-1 text-xs bg-white border border-[#d4d2cd] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#285943] disabled:opacity-50"
        >
          {SLOW_MODE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Video Player */}
        <main className={`flex-1 min-w-0 ${isChatOpen ? 'hidden lg:block' : 'block'}`}>
          <VideoPlayer />
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
