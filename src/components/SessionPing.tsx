'use client';

import { useEffect, useCallback } from 'react';

export function SessionPing() {
  const sendPing = useCallback(async (disconnect = false) => {
    try {
      await fetch('/api/session/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disconnect }),
      });
    } catch (error) {
      console.error('Session ping failed:', error);
    }
  }, []);

  useEffect(() => {
    // Send initial ping
    sendPing();

    // Ping every 10 seconds
    const interval = setInterval(() => sendPing(), 10000);

    // Attempt to send disconnect on unmount
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery on page close
      const data = JSON.stringify({ disconnect: true });
      navigator.sendBeacon('/api/session/ping', data);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendPing(true);
      } else {
        sendPing();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      sendPing(true);
    };
  }, [sendPing]);

  return null;
}
