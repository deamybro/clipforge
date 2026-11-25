'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { getUserClips, deleteClipMetadata, ClipMetadata } from '@/lib/firestore';
import { toast } from 'sonner';
import { Film, Trash2, Target, Music, Clock } from 'lucide-react';
import { formatDuration, getHookScoreColor } from '@/lib/utils';
import Link from 'next/link';

export default function ClipsPage() {
  const { user } = useAuth();
  const [clips, setClips] = useState<ClipMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      getUserClips(user.uid, 50)
        .then(setClips)
        .catch(() => toast.error('Failed to load clips'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleDelete = async (clipId: string) => {
    if (!user || !clipId) return;
    setDeleting((prev) => new Set(prev).add(clipId));
    try {
      await deleteClipMetadata(user.uid, clipId);
      setClips((prev) => prev.filter((c) => c.id !== clipId));
      toast.success('Clip deleted');
    } catch {
      toast.error('Failed to delete clip');
    } finally {
      setDeleting((prev) => { const s = new Set(prev); s.delete(clipId); return s; });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--cf-text)]">Clip History</h1>
          <p className="text-sm text-[var(--cf-muted)] mt-1">
            Metadata log of your processed clips. Files are auto-deleted after download.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="cf-card p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-48 h-4 bg-white/10 rounded" />
                  <div className="w-24 h-4 bg-white/10 rounded" />
                  <div className="w-16 h-4 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-border)] flex items-center justify-center">
              <Film className="w-8 h-8 text-[var(--cf-muted)]" />
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-[var(--cf-text)]">No clips yet</p>
              <p className="text-sm text-[var(--cf-muted)] mt-1">Process a video to see your clips here.</p>
            </div>
            <Link href="/dashboard" className="cf-btn-primary">Go to Dashboard</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {clips.map((clip, i) => (
              <motion.div
                key={clip.id || i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="cf-card p-4 flex items-center gap-4 hover:border-[var(--cf-accent)]/20 transition-colors"
              >
                {/* Index */}
                <div className="w-8 h-8 rounded-lg bg-[var(--cf-accent)]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[var(--cf-accent)]">{i + 1}</span>
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--cf-text)] truncate">{clip.clipTitle}</p>
                  <p className="text-xs text-[var(--cf-muted)] mt-0.5 truncate">{clip.originalVideoName}</p>
                </div>

                {/* Meta */}
                <div className="hidden md:flex items-center gap-4 text-xs text-[var(--cf-muted)]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(clip.duration)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span className={getHookScoreColor(clip.hookScore)}>{clip.hookScore}/100</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Music className="w-3 h-3" />
                    <span className="capitalize">{clip.musicTrack}</span>
                  </div>
                  <span className="capitalize px-2 py-0.5 rounded-full border border-[var(--cf-border)] text-xs">{clip.inputMethod}</span>
                </div>

                {/* Delete */}
                <button
                  onClick={() => clip.id && handleDelete(clip.id)}
                  disabled={!clip.id || deleting.has(clip.id || '')}
                  className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-[var(--cf-muted)] transition-colors"
                  title="Delete metadata"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
