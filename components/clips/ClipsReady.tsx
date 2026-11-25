'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Download, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { deleteFile, deleteFiles } from '@/lib/storage';

export interface RenderedClip {
  url: string;
  storagePath: string;
  title: string;
}

interface Props {
  clips: RenderedClip[];
  sourceStoragePath: string;
  onReset: () => void;
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function ClipsReady({ clips, sourceStoragePath, onReset }: Props) {
  useEffect(() => {
    const cleanup = () => {
      void deleteFiles([sourceStoragePath, ...clips.map((clip) => clip.storagePath)]);
    };
    window.addEventListener('pagehide', cleanup);
    return () => window.removeEventListener('pagehide', cleanup);
  }, [clips, sourceStoragePath]);

  const downloadOne = async (clip: RenderedClip, index: number) => {
    triggerDownload(clip.url, `clipforge_${index + 1}.mp4`);
    await deleteFile(clip.storagePath);
    toast.success(`Downloaded ${clip.title}`);
  };

  const downloadAll = async () => {
    try {
      for (let index = 0; index < clips.length; index++) {
        triggerDownload(clips[index].url, `clipforge_${index + 1}.mp4`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      await deleteFiles([sourceStoragePath, ...clips.map((clip) => clip.storagePath)]);
      toast.success(`Downloaded ${clips.length} MP4 file${clips.length === 1 ? '' : 's'}.`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to download clips');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="cf-card p-8 max-w-2xl mx-auto text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-[var(--cf-accent)]/10 border-2 border-[var(--cf-accent)] mx-auto flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-[var(--cf-accent)]" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-[var(--cf-text)]">Your Clips Are Ready</h2>
        <p className="text-[var(--cf-muted)] mt-2">Download each clip as an MP4, ready to post.</p>
      </div>
      <div className="space-y-2 text-left">
        {clips.map((clip, index) => (
          <div key={clip.storagePath} className="flex items-center justify-between gap-4 rounded-lg border border-[var(--cf-border)] p-3">
            <span className="truncate text-sm text-[var(--cf-text)]">{clip.title}</span>
            <button onClick={() => downloadOne(clip, index)} className="cf-btn-secondary shrink-0">
              <Download className="w-4 h-4" /> Download
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <button onClick={downloadAll} className="cf-btn-primary py-3 flex items-center justify-center gap-2 text-base">
          <Download className="w-5 h-5" /> Download All MP4s
        </button>
        <button onClick={onReset} className="cf-btn-ghost py-3 flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4" /> Start New Video
        </button>
      </div>
    </motion.div>
  );
}
