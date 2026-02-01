'use client';

import { useState, useEffect } from 'react';

interface ViewerCountProps {
  className?: string;
}

export function ViewerCount({ className = '' }: ViewerCountProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/session/count');
        if (response.ok) {
          const data = await response.json();
          setCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch viewer count:', error);
      }
    };

    // Initial fetch
    fetchCount();

    // Poll every 3 seconds
    const interval = setInterval(fetchCount, 3000);

    return () => clearInterval(interval);
  }, []);

  if (count === null) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-pulse-live absolute inline-flex h-full w-full rounded-full bg-[#ef4444] opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ef4444]" />
      </span>
      <span className="text-sm font-medium tabular-nums">
        {count.toLocaleString()} widzów
      </span>
    </div>
  );
}
