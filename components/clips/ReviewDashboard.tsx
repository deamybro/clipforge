'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Play } from 'lucide-react';
import { toast } from 'sonner';
import { ClipCard } from './ClipCard';
import { RenderProgress } from './RenderProgress';
import { ClipsReady, RenderedClip } from './ClipsReady';
import type { ClipSuggestion } from '@/lib/groq';
import { MusicTrack } from './MusicPicker';
import { FramingMode } from './FramingPicker';
import { useAuth } from '@/components/providers/AuthProvider';
import { uploadFile, deleteFiles } from '@/lib/storage';
import { isLocalDevMode } from '@/lib/runtime';

interface Props {
  clips: ClipSuggestion[];
  videoUrl: string;
  storagePath: string;
  onRegenerate: () => void;
}

export function ReviewDashboard({
  clips,
  videoUrl,
  storagePath,
  onRegenerate,
}: Props) {
  const { user } = useAuth();
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeClip, setActiveClip] = useState(0);
  const [completedClips, setCompletedClips] = useState<RenderedClip[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [titles, setTitles] = useState<Record<number, string>>({});
  const [musicSelections, setMusicSelections] = useState<Record<number, MusicTrack>>({});
  const [framingSelections, setFramingSelections] = useState<Record<number, FramingMode>>({});

  useEffect(() => {
    setSelected(Object.fromEntries(clips.map((_, index) => [index, true])));
    setTitles(Object.fromEntries(clips.map((clip, index) => [index, clip.title])));
    setMusicSelections(Object.fromEntries(clips.map((_, index) => [index, 'lofi'])));
    setFramingSelections(Object.fromEntries(clips.map((_, index) => [index, 'auto'])));
  }, [clips]);

  const selectedEntries = useMemo(
    () => clips.map((clip, index) => ({ clip, index })).filter(({ index }) => selected[index]),
    [clips, selected]
  );

  const handleRender = async () => {
    if (!user || selectedEntries.length === 0) {
      toast.error('Select at least one clip to render.');
      return;
    }

    setRendering(true);
    setProgress(0);
    setCompletedClips([]);
    const rendered: RenderedClip[] = [];
    const failed: string[] = [];

    try {
      const { renderClip } = await import('@/lib/ffmpeg');

      for (let queueIndex = 0; queueIndex < selectedEntries.length; queueIndex++) {
        const { clip, index } = selectedEntries[queueIndex];
        const music = musicSelections[index] || 'lofi';
        const framingMode = framingSelections[index] || 'auto';
        const title = titles[index] || clip.title;
        setActiveClip(queueIndex + 1);

        try {
          const outputBlob = await renderClip({
            videoUrl,
            startTime: clip.start_time,
            endTime: clip.end_time,
            musicTrack: `/music/${music}.mp3`,
            framingMode,
            clipIndex: index,
            onProgress: (clipProgress) => {
              setProgress(((queueIndex + clipProgress / 100) / selectedEntries.length) * 100);
            },
          });

          const outputPath = isLocalDevMode
            ? `local:clip_${Date.now()}_${index + 1}.mp4`
            : `users/${user.uid}/clips/${Date.now()}_${index + 1}.mp4`;
          const outputUrl = isLocalDevMode
            ? URL.createObjectURL(outputBlob)
            : await uploadFile(outputPath, outputBlob);
          rendered.push({ url: outputUrl, storagePath: outputPath, title });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Render failed';
          failed.push(`Clip ${index + 1}: ${message}`);
          toast.error(`Clip ${index + 1} failed: ${message}`);
        }
      }

      setProgress(100);
      if (rendered.length > 0) {
        setCompletedClips(rendered);
        if (failed.length > 0) {
          toast.warning(`${rendered.length} clip${rendered.length === 1 ? '' : 's'} rendered. ${failed.length} failed.`);
        } else {
          toast.success(`${rendered.length} clip${rendered.length === 1 ? '' : 's'} rendered.`);
        }
      } else {
        throw new Error(failed[0] || 'Render failed');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Render failed');
    } finally {
      setRendering(false);
    }
  };

  const cleanupAll = async () => {
    await deleteFiles([storagePath, ...completedClips.map((clip) => clip.storagePath)]);
  };

  if (completedClips.length > 0) {
    return (
      <ClipsReady
        clips={completedClips}
        sourceStoragePath={storagePath}
        onReset={async () => {
          await cleanupAll();
          window.location.reload();
        }}
      />
    );
  }

  if (rendering) {
    return <RenderProgress progress={progress} activeClip={activeClip} totalClips={selectedEntries.length} />;
  }

  const allowedTracks: MusicTrack[] = ['lofi', 'phonk', 'dramatic', 'chill-trap', 'silent'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-[var(--cf-text)]">Review Your Hooks</h2>
          <p className="text-sm text-[var(--cf-muted)] mt-1">AI found {clips.length} viral moments.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={onRegenerate} className="cf-btn-secondary flex-1 sm:flex-none">
            <RefreshCw className="w-4 h-4" /> Regenerate
          </button>
          <button onClick={handleRender} className="cf-btn-primary flex-1 sm:flex-none py-2.5 px-6">
            <Play className="w-4 h-4 fill-black" /> Render Selected
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clips.map((clip, index) => (
          <ClipCard
            key={`${clip.start_time}-${clip.end_time}`}
            clip={clip}
            index={index}
            videoUrl={videoUrl}
            selected={selected[index] ?? true}
            onToggle={(value) => setSelected((current) => ({ ...current, [index]: value }))}
            onTitleChange={(title) => setTitles((current) => ({ ...current, [index]: title }))}
            selectedMusic={musicSelections[index] || 'lofi'}
            onMusicChange={(music) => setMusicSelections((current) => ({ ...current, [index]: music }))}
            selectedFraming={framingSelections[index] || 'auto'}
            onFramingChange={(framing) => setFramingSelections((current) => ({ ...current, [index]: framing }))}
            allowedTracks={allowedTracks}
          />
        ))}
      </div>
    </div>
  );
}
