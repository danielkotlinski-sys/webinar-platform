'use client';

import { useState } from 'react';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Chat } from '@/components/Chat';
import { SessionPing } from '@/components/SessionPing';

interface WebinarClientProps {
  userEmail: string;
}

export function WebinarClient({ userEmail }: WebinarClientProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <div className="h-screen bg-[#e8e6e1] flex flex-col overflow-hidden">
      <SessionPing />

      {/* Top Bar */}
      <header className="flex-shrink-0 h-14 px-4 flex items-center justify-between border-b border-[#d4d2cd] bg-white">
        <div className="flex items-center gap-3 sm:gap-4">
          <h1 className="font-serif text-lg sm:text-xl text-black">Webinar</h1>
          {/* Live indicator */}
          <span className="flex items-center gap-1.5 text-xs text-[#6b6b6b]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c45c3e] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c45c3e]" />
            </span>
            NA ŻYWO
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs sm:text-sm text-[#6b6b6b] hidden sm:block truncate max-w-[150px]">
            {userEmail}
          </span>
          {/* Mobile chat toggle */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="lg:hidden px-3 py-1.5 text-sm bg-[#f5f4f2] hover:bg-[#e8e6e1] text-black rounded-md transition-colors border border-[#d4d2cd]"
          >
            {isChatOpen ? 'Wideo' : 'Czat'}
          </button>
          <button
            onClick={handleLogout}
            className="text-xs sm:text-sm text-[#6b6b6b] hover:text-black transition-colors"
          >
            Wyjdź
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Video Player */}
        <main className={`flex-1 min-w-0 ${isChatOpen ? 'hidden lg:block' : 'block'}`}>
          <VideoPlayer />
        </main>

        {/* Chat Sidebar - full screen on mobile when open */}
        <aside
          className={`
            ${isChatOpen ? 'flex' : 'hidden'}
            lg:flex
            absolute lg:relative inset-0 lg:inset-auto
            w-full lg:w-80 xl:w-96 flex-shrink-0
            z-10 lg:z-auto
          `}
        >
          <Chat userEmail={userEmail} />
        </aside>
      </div>
    </div>
  );
}
