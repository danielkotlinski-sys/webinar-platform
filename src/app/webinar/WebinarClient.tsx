'use client';

import { useState, useEffect } from 'react';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Chat } from '@/components/Chat';
import { SessionPing } from '@/components/SessionPing';

interface WebinarClientProps {
  userEmail: string;
}

export function WebinarClient({ userEmail }: WebinarClientProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);

  // Fetch settings on mount and poll for updates
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          setChatEnabled(data.chatEnabled === true);
          setWelcomeMessage(data.welcomeMessage || null);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    fetchSettings();
    const interval = setInterval(fetchSettings, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

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
          {/* Live indicator - only show when chat is enabled */}
          {chatEnabled && (
            <span className="flex items-center gap-1.5 text-xs text-[#6b6b6b]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c45c3e] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c45c3e]" />
              </span>
              NA ŻYWO
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs sm:text-sm text-[#6b6b6b] hidden sm:block truncate max-w-[150px]">
            {userEmail}
          </span>
          {/* Mobile chat toggle - only show when chat is enabled */}
          {chatEnabled && (
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="lg:hidden px-3 py-1.5 text-sm bg-[#f5f4f2] hover:bg-[#e8e6e1] text-black rounded-md transition-colors border border-[#d4d2cd]"
            >
              {isChatOpen ? 'Wideo' : 'Czat'}
            </button>
          )}
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
        <main className={`flex-1 min-w-0 ${isChatOpen && chatEnabled ? 'hidden lg:block' : 'block'}`}>
          <VideoPlayer />
        </main>

        {/* Chat Sidebar or Welcome Message */}
        <aside
          className={`
            ${isChatOpen || !chatEnabled ? 'flex' : 'hidden'}
            lg:flex
            absolute lg:relative inset-0 lg:inset-auto
            w-full lg:w-80 xl:w-96 flex-shrink-0
            z-10 lg:z-auto
          `}
        >
          {chatEnabled ? (
            <Chat userEmail={userEmail} />
          ) : (
            <div className="w-full h-full bg-white border-l border-[#d4d2cd] flex items-center justify-center p-6">
              <div className="text-center max-w-xs">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#285943]/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-[#285943]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-serif text-black mb-2">Witaj!</h3>
                {welcomeMessage ? (
                  <p className="text-[#6b6b6b] text-sm">{welcomeMessage}</p>
                ) : (
                  <p className="text-[#6b6b6b] text-sm">
                    Czat zostanie uruchomiony wkrótce. Zostań na tej stronie.
                  </p>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
