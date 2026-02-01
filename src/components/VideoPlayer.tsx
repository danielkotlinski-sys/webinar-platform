'use client';

interface VideoPlayerProps {
  streamUrl?: string;
}

export function VideoPlayer({ streamUrl }: VideoPlayerProps) {
  const embedUrl = streamUrl || process.env.NEXT_PUBLIC_CF_STREAM_EMBED_URL;

  if (!embedUrl || embedUrl.includes('customer-stream-url')) {
    // Placeholder when no stream URL is configured
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
            Webinar rozpocznie się wkrótce. Proszę czekać na rozpoczęcie transmisji przez prowadzącego.
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
