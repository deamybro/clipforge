'use client';
import { useState } from 'react';
import { Upload, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropZone } from './DropZone';
import { LinkInput } from './LinkInput';
import { isLocalDevMode } from '@/lib/runtime';

export type InputMethod = 'upload' | 'link';

interface Props {
  onVideoReady: (path: string, method: InputMethod, srcUrl?: string, url?: string) => void;
}

export function InputToggle({ onVideoReady }: Props) {
  const [method, setMethod] = useState<InputMethod>('upload');

  return (
    <div className="space-y-6">
      <div className="flex p-1 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] w-full max-w-md mx-auto">
        <button onClick={() => setMethod('upload')} className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2', method === 'upload' ? 'bg-[var(--cf-accent)]/10 text-[var(--cf-accent)]' : 'text-[var(--cf-muted)] hover:text-[var(--cf-text)]')}>
          <Upload className="w-4 h-4" /> Upload File
        </button>
        <button disabled={isLocalDevMode} onClick={() => setMethod('link')} className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2', method === 'link' ? 'bg-[var(--cf-accent)]/10 text-[var(--cf-accent)]' : 'text-[var(--cf-muted)] hover:text-[var(--cf-text)]', isLocalDevMode && 'cursor-not-allowed opacity-40')}>
          <LinkIcon className="w-4 h-4" /> Paste Link
        </button>
      </div>
      {isLocalDevMode && (
        <p className="text-center text-xs text-[var(--cf-muted)]">
          Link importing becomes available after the Railway downloader is configured.
        </p>
      )}
      
      {method === 'upload' ? (
        <DropZone onVideoReady={(p, url) => onVideoReady(p, 'upload', undefined, url)} />
      ) : (
        <LinkInput onVideoReady={(p, srcUrl, url) => onVideoReady(p, 'link', srcUrl, url)} />
      )}
    </div>
  );
}
