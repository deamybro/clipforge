'use client';

import { useState, useRef } from 'react';
import { Music, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MusicTrack = 'lofi' | 'phonk' | 'dramatic' | 'chill-trap' | 'silent';

const TRACKS: { id: MusicTrack; label: string; badge: string; description: string }[] = [
  { id: 'lofi', label: 'Lo-fi', badge: 'L', description: 'Chill lo-fi beats' },
  { id: 'phonk', label: 'Phonk', badge: 'P', description: 'Dark phonk / trap' },
  { id: 'dramatic', label: 'Dramatic', badge: 'D', description: 'Cinematic / tense' },
  { id: 'chill-trap', label: 'Chill', badge: 'C', description: 'Smooth chill trap' },
  { id: 'silent', label: 'None', badge: '-', description: 'No music' },
];

interface MusicPickerProps {
  selected: MusicTrack;
  onChange: (track: MusicTrack) => void;
  allowedTracks?: MusicTrack[];
}

export function MusicPicker({ selected, onChange, allowedTracks }: MusicPickerProps) {
  const [hovering, setHovering] = useState<MusicTrack | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeout = useRef<NodeJS.Timeout>();

  const handleHoverStart = (track: MusicTrack) => {
    if (track === 'silent') return;
    setHovering(track);

    previewTimeout.current = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      const audio = new Audio(`/music/${track}.mp3`);
      audio.volume = 0.3;
      audio.play().catch(() => {});
      audioRef.current = audio;

      // Stop after 5 seconds
      setTimeout(() => audio.pause(), 5000);
    }, 200);
  };

  const handleHoverEnd = () => {
    setHovering(null);
    clearTimeout(previewTimeout.current);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const tracks = allowedTracks
    ? TRACKS.filter((t) => allowedTracks.includes(t.id))
    : TRACKS;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Music className="w-3.5 h-3.5 text-[var(--cf-muted)]" />
        <span className="text-xs font-medium text-[var(--cf-muted)]">Background Music</span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => onChange(track.id)}
            onMouseEnter={() => handleHoverStart(track.id)}
            onMouseLeave={handleHoverEnd}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
              selected === track.id
                ? 'bg-[var(--cf-accent)]/10 border-[var(--cf-accent)]/40 text-[var(--cf-accent)]'
                : 'border-[var(--cf-border)] text-[var(--cf-muted)] hover:border-[var(--cf-accent)]/20 hover:text-[var(--cf-text)]'
            )}
            title={track.description}
          >
            <span>{track.badge}</span>
            <span>{track.label}</span>
            {hovering === track.id && (
              <Volume2 className="w-3 h-3 text-[var(--cf-accent)] animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
