'use client';
import { useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';

const PLATFORMS = [
  { name: 'YouTube', domains: ['youtube.com', 'youtu.be'] },
  { name: 'TikTok', domains: ['tiktok.com'] },
  { name: 'Instagram', domains: ['instagram.com'] },
  { name: 'X', domains: ['x.com', 'twitter.com'] },
  { name: 'Facebook', domains: ['facebook.com', 'fb.watch'] },
];

function detectPlatform(value: string): string | null {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
    return PLATFORMS.find((platform) =>
      platform.domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
    )?.name || null;
  } catch {
    return null;
  }
}

export function LinkInput({ onVideoReady }: { onVideoReady: (path: string, srcUrl: string, url?: string) => void }) {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const platform = detectPlatform(url);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('Please sign in first');
    if (!url.trim()) return toast.error('Please enter a URL');
    if (!platform) return toast.error('Unsupported platform. Use YouTube, TikTok, Instagram, X, or Facebook.');

    setDownloading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, idToken }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Download failed');
      
      toast.success('Video downloaded successfully');
      onVideoReady(data.storage_path, url);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <form onSubmit={handleDownload} className="cf-card p-8">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-[var(--cf-accent)]/10 flex items-center justify-center mb-4">
          <Link2 className="w-8 h-8 text-[var(--cf-accent)]" />
        </div>
        <p className="text-base font-semibold text-[var(--cf-text)]">Paste a video link</p>
        <p className="text-sm text-[var(--cf-muted)] mt-1">YouTube, TikTok, Instagram Reels, X, Facebook</p>
      </div>
      
      <div className="flex gap-2 max-w-xl mx-auto">
        <input 
          type="url" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          placeholder="https://youtube.com/watch?v=..." 
          className="cf-input flex-1" 
          disabled={downloading}
          required 
        />
        <button type="submit" disabled={downloading || !url} className="cf-btn-primary whitespace-nowrap px-6">
          {downloading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Downloading...</> : 'Import Video'}
        </button>
      </div>
      {url && (
        <p className={`max-w-xl mx-auto mt-2 text-xs ${platform ? 'text-[var(--cf-accent)]' : 'text-red-400'}`}>
          {platform ? `${platform} link detected` : 'Unsupported platform link'}
        </p>
      )}
    </form>
  );
}
