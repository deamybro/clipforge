'use client';
import { useState, useRef } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/storage';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';
import { isLocalDevMode } from '@/lib/runtime';

const MAX_VIDEO_SIZE_BYTES = 8 * 1024 * 1024 * 1024;
const MAX_VIDEO_SIZE_LABEL = '8 GB';

export function DropZone({ onVideoReady }: { onVideoReady: (path: string, url?: string) => void }) {
  const { user } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!user) return toast.error('Please sign in first');
    const allowedTypes = new Set(['video/mp4', 'video/quicktime', 'video/webm']);
    if (!allowedTypes.has(file.type)) return toast.error('Choose an MP4, MOV, or WebM video.');
    if (file.size > MAX_VIDEO_SIZE_BYTES) return toast.error(`Videos must be ${MAX_VIDEO_SIZE_LABEL} or smaller.`);
    
    setUploading(true);
    setProgress(0);
    try {
      if (isLocalDevMode) {
        setProgress(100);
        toast.success('Video loaded locally');
        onVideoReady(`local:${Date.now()}_${file.name}`, URL.createObjectURL(file));
        return;
      }
      const path = `users/${user.uid}/uploads/${Date.now()}_${file.name}`;
      const url = await uploadFile(path, file, (p) => setProgress(p));
      toast.success('Upload complete');
      onVideoReady(path, url);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
      }}
      onClick={() => !uploading && fileInputRef.current?.click()}
      className={cn('cf-card p-12 flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer text-center', dragging ? 'border-[var(--cf-accent)] bg-[var(--cf-accent)]/5' : 'border-[var(--cf-border)] hover:border-[var(--cf-accent)]/50', uploading && 'cursor-not-allowed')}
    >
      <input type="file" ref={fileInputRef} className="hidden" accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
      }} />
      
      {uploading ? (
        <div className="space-y-4 w-full max-w-xs">
          <Loader2 className="w-10 h-10 text-[var(--cf-accent)] animate-spin mx-auto" />
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#6EE7B7] to-[#34D399] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-[var(--cf-text)]">Uploading... {Math.round(progress)}%</p>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 rounded-2xl bg-[var(--cf-accent)]/10 flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8 text-[var(--cf-accent)]" />
          </div>
          <p className="text-base font-semibold text-[var(--cf-text)]">Click or drag video to upload</p>
          <p className="text-sm text-[var(--cf-muted)] mt-2">MP4, MOV, WebM up to {MAX_VIDEO_SIZE_LABEL}</p>
          <p className="text-xs text-[var(--cf-muted)] mt-1">Shorter videos process faster and transcribe more reliably.</p>
        </>
      )}
    </div>
  );
}
