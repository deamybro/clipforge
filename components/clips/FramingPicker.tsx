'use client';

import { cn } from '@/lib/utils';

export type FramingMode = 'auto' | 'fill' | 'fit';

const MODES: { id: FramingMode; label: string; description: string }[] = [
  { id: 'auto', label: 'Auto', description: 'Fill true 9:16 videos, fit videos that would be cut off.' },
  { id: 'fill', label: 'Fill', description: 'Fill the whole screen with a crop. Best when the subject is centered.' },
  { id: 'fit', label: 'Fit', description: 'Show the full video with a blurred background. Best when cropping cuts important parts.' },
];

interface FramingPickerProps {
  selected: FramingMode;
  onChange: (mode: FramingMode) => void;
}

export function FramingPicker({ selected, onChange }: FramingPickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[var(--cf-muted)]">Framing</span>
        <span className="text-[10px] text-[var(--cf-muted)]">Auto is safest</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={cn(
              'rounded-lg border px-2 py-1.5 text-xs font-medium transition-all duration-150',
              selected === mode.id
                ? 'bg-[var(--cf-accent)]/10 border-[var(--cf-accent)]/40 text-[var(--cf-accent)]'
                : 'border-[var(--cf-border)] text-[var(--cf-muted)] hover:border-[var(--cf-accent)]/20 hover:text-[var(--cf-text)]'
            )}
            title={mode.description}
          >
            {mode.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-[var(--cf-muted)]">
        Fill looks more native when the video already matches Shorts/Reels. Fit protects the full frame.
      </p>
    </div>
  );
}
