'use client';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function RenderProgress({ progress, activeClip, totalClips }: { progress: number; activeClip: number; totalClips: number }) {
  return (
    <div className="cf-card p-8 max-w-md mx-auto text-center space-y-6">
      <div className="w-20 h-20 rounded-2xl bg-[var(--cf-accent)]/10 border border-[var(--cf-accent)]/20 mx-auto flex items-center justify-center relative overflow-hidden">
        <Loader2 className="w-10 h-10 text-[var(--cf-accent)] animate-spin relative z-10" />
        <div className="absolute inset-x-0 bottom-0 bg-[var(--cf-accent)]/20 transition-all duration-300" style={{ height: `${progress}%` }} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-[var(--cf-text)]">Rendering locally...</h3>
        <p className="text-sm text-[var(--cf-muted)] mt-1">Rendering clip {activeClip} of {totalClips}. Keep this tab open.</p>
      </div>
      <div>
        <div className="flex justify-between text-xs text-[var(--cf-text)] font-medium mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-[#6EE7B7] to-[#34D399]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>
    </div>
  );
}
