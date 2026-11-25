'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Clock, Target, Play, Pause } from 'lucide-react';
import { MusicPicker, MusicTrack } from './MusicPicker';
import { FramingMode, FramingPicker } from './FramingPicker';
import { cn, formatTime, getHookScoreBg } from '@/lib/utils';
import type { ClipSuggestion } from '@/lib/groq';

interface ClipCardProps {
  clip: ClipSuggestion;
  index: number;
  videoUrl: string;
  selected: boolean;
  onToggle: (selected: boolean) => void;
  onTitleChange: (title: string) => void;
  onMusicChange: (track: MusicTrack) => void;
  onFramingChange: (mode: FramingMode) => void;
  selectedMusic: MusicTrack;
  selectedFraming: FramingMode;
  allowedTracks?: MusicTrack[];
}

export function ClipCard({
  clip,
  index,
  videoUrl,
  selected,
  onToggle,
  onTitleChange,
  onMusicChange,
  onFramingChange,
  selectedMusic,
  selectedFraming,
  allowedTracks,
}: ClipCardProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(clip.title);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = clip.start_time;
    }
  }, [clip.start_time, videoUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.currentTime = clip.start_time;
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleEnded = () => setPlaying(false);
    const handleTimeUpdate = () => {
      if (video.currentTime >= clip.end_time) {
        video.pause();
        setPlaying(false);
      }
    };
    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [clip.end_time]);

  const handleTitleSave = () => {
    setEditingTitle(false);
    onTitleChange(title);
  };

  const scoreBg = getHookScoreBg(clip.hook_score);
  const duration = clip.end_time - clip.start_time;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'cf-card p-5 space-y-4 transition-all duration-200',
        selected ? 'ring-1 ring-[var(--cf-accent)]/30 cf-glow' : 'opacity-80 hover:opacity-100'
      )}
    >
      {/* Header: clip number + include toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[var(--cf-accent)]/10 border border-[var(--cf-accent)]/30 flex items-center justify-center">
            <span className="text-xs font-bold text-[var(--cf-accent)]">{index + 1}</span>
          </div>
          <span className="text-xs text-[var(--cf-muted)]">Clip {index + 1}</span>
        </div>
        <button
          type="button"
          onClick={() => onToggle(!selected)}
          aria-pressed={selected}
          aria-label={`${selected ? 'Exclude' : 'Include'} clip ${index + 1}`}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <span className="text-xs text-[var(--cf-muted)] group-hover:text-[var(--cf-text)] transition-colors">
            {selected ? 'Included' : 'Excluded'}
          </span>
          <div
            className={cn(
              'relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer',
              selected ? 'bg-[var(--cf-accent)]' : 'bg-white/10'
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                selected ? 'translate-x-4' : 'translate-x-0.5'
              )}
            />
          </div>
        </button>
      </div>

      {/* Video preview */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          muted
          preload="metadata"
        />
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {playing ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </div>
        </button>
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-xs text-white font-mono">
          {Math.round(duration)}s
        </div>
      </div>

      {/* Title (editable) */}
      <div className="space-y-1">
        <label className="text-xs text-[var(--cf-muted)] font-medium">Title</label>
        {editingTitle ? (
          <div className="flex gap-2">
            <input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="cf-input text-sm flex-1"
              autoFocus
            />
          </div>
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-white/5 group transition-colors"
          >
            <span className="text-sm font-medium text-[var(--cf-text)] flex-1">{title}</span>
            <Edit3 className="w-3.5 h-3.5 text-[var(--cf-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Hook */}
      <div className="space-y-1">
        <label className="text-xs text-[var(--cf-muted)] font-medium">AI Hook</label>
        <div className="p-3 rounded-lg bg-[var(--cf-accent)]/5 border border-[var(--cf-accent)]/15">
          <p className="text-sm text-[var(--cf-text)] leading-relaxed italic">&ldquo;{clip.hook}&rdquo;</p>
        </div>
      </div>

      {/* Timestamps + Score */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-[var(--cf-muted)]">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono">{formatTime(clip.start_time)} - {formatTime(clip.end_time)}</span>
        </div>
        <div className="ml-auto">
          <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold', scoreBg)}>
            <Target className="w-3 h-3" />
            <span>{clip.hook_score} / 100</span>
          </div>
        </div>
      </div>

      {/* Music picker */}
      <MusicPicker
        selected={selectedMusic}
        onChange={onMusicChange}
        allowedTracks={allowedTracks}
      />

      <FramingPicker selected={selectedFraming} onChange={onFramingChange} />
    </motion.div>
  );
}
