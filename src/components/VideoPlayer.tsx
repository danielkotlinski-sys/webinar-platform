'use client';

import { useState, useEffect } from 'react';

interface VideoPlayerProps {
  streamUrl?: string;
  webinarStart?: string | null; // ISO date string
  isAdmin?: boolean;
}

export function VideoPlayer({ streamUrl, webinarStart: webinarStartProp, isAdmin = false }: VideoPlayerProps) {
  const embedUrl = streamUrl || process.env.NEXT_PUBLIC_CF_STREAM_EMBED_URL;
  const [now, setNow] = useState(new Date());
  const [isLive, setIsLive] = useState(false);
  const [webinarStart, setWebinarStart] = useState<string | null>(webinarStartProp || null);

  // Update time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if stream is live and get webinarStart (polling)
  useEffect(() => {
    const checkSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          setIsLive(data.isLive === true);
          if (data.webinarStart) {
            setWebinarStart(data.webinarStart);
          }
        }
      } catch (error) {
        console.error('Failed to check settings:', error);
      }
    };

    checkSettings();
    const interval = setInterval(checkSettings, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Update from prop if it changes
  useEffect(() => {
    if (webinarStartProp) {
      setWebinarStart(webinarStartProp);
    }
  }, [webinarStartProp]);

  // Parse webinar start time
  const startTime = webinarStart ? new Date(webinarStart) : null;
  const hasStarted = startTime ? now >= startTime : true;

  // Show waiting room if not started and not live (unless admin)
  if (!isAdmin && !isLive && startTime && !hasStarted) {
    const diff = startTime.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return (
      <div className="relative w-full h-full bg-[#f5f4f2] flex items-center justify-center">
        <div className="text-center px-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#285943]/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-[#285943]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-serif text-black mb-3">Webinar wkrótce się rozpocznie</h3>
          <p className="text-[#6b6b6b] mb-6">
            {startTime.toLocaleDateString('pl-PL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })} o {startTime.toLocaleTimeString('pl-PL', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>

          {/* Countdown */}
          <div className="flex justify-center gap-4 mb-8">
            {days > 0 && (
              <div className="text-center">
                <div className="text-3xl font-semibold text-black tabular-nums">{days}</div>
                <div className="text-xs text-[#6b6b6b] uppercase tracking-wide">dni</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-3xl font-semibold text-black tabular-nums">{hours.toString().padStart(2, '0')}</div>
              <div className="text-xs text-[#6b6b6b] uppercase tracking-wide">godz</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-semibold text-black tabular-nums">{minutes.toString().padStart(2, '0')}</div>
              <div className="text-xs text-[#6b6b6b] uppercase tracking-wide">min</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-semibold text-black tabular-nums">{seconds.toString().padStart(2, '0')}</div>
              <div className="text-xs text-[#6b6b6b] uppercase tracking-wide">sek</div>
            </div>
          </div>

          <p className="text-sm text-[#6b6b6b]">
            Zostań na tej stronie – transmisja uruchomi się automatycznie.
          </p>
        </div>
      </div>
    );
  }

  // Show "not live yet" message if time has passed but stream not started
  if (!isAdmin && !isLive) {
    return (
      <div className="relative w-full h-full bg-[#f5f4f2] flex items-center justify-center">
        <div className="text-center px-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white border border-[#d4d2cd] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#6b6b6b]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-serif text-black mb-2">Transmisja jeszcze nie rozpoczęta</h3>
          <p className="text-[#6b6b6b] max-w-md">
            Webinar rozpocznie się za chwilę. Proszę czekać na rozpoczęcie transmisji.
          </p>
        </div>
      </div>
    );
  }

  // Show stream
  if (!embedUrl || embedUrl.includes('customer-stream-url')) {
    return (
      <div className="relative w-full h-full bg-[#f5f4f2] flex items-center justify-center">
        <div className="text-center px-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white border border-[#d4d2cd] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#6b6b6b]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-serif text-black mb-2">Brak skonfigurowanego streamu</h3>
          <p className="text-[#6b6b6b] max-w-md">
            Skontaktuj się z administratorem.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
