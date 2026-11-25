'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InputToggle, InputMethod } from '@/components/upload/InputToggle';
import { ReviewDashboard } from '@/components/clips/ReviewDashboard';
import { useAuth } from '@/components/providers/AuthProvider';
import { getFileUrl } from '@/lib/storage';
import { formatTranscriptForAI } from '@/lib/captions';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import type { ClipSuggestion, WordTimestamp } from '@/lib/groq';
import { isLocalDevMode } from '@/lib/runtime';

const TRANSCRIBE_TIMEOUT_MS = 150_000;
const ANALYZE_TIMEOUT_MS = 90_000;

type PipelineStage =
  | 'input'
  | 'extracting-audio'
  | 'transcribing'
  | 'analyzing'
  | 'review';

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

function readVideoDuration(videoBlob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const videoUrl = URL.createObjectURL(videoBlob);
    const video = document.createElement('video');
    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(videoUrl);
    };

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 30;
      cleanup();
      resolve(Math.max(1, duration));
    };
    video.onerror = () => {
      cleanup();
      resolve(30);
    };
    video.src = videoUrl;
  });
}

function createEstimatedClips(duration: number): ClipSuggestion[] {
  const safeDuration = Math.max(1, duration);
  const clipLength = Math.min(45, Math.max(8, safeDuration));
  const starts = safeDuration <= clipLength + 2
    ? [0]
    : [0, safeDuration * 0.33, safeDuration * 0.66]
        .map((start) => Math.min(Math.max(0, start), Math.max(0, safeDuration - clipLength)));

  return Array.from(new Set(starts.map((start) => Number(start.toFixed(2)))))
    .slice(0, 3)
    .map((start, index) => {
      const end = Math.min(safeDuration, start + clipLength);
      return {
        title: index === 0 ? 'Best Opening Moment' : `Strong Moment ${index + 1}`,
        hook: 'Estimated clip because transcription was unavailable. Review the preview before rendering.',
        start_time: Number(start.toFixed(2)),
        end_time: Number(end.toFixed(2)),
        hook_score: Math.max(70, 82 - index * 4),
      };
    });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stage, setStage] = useState<PipelineStage>('input');
  const [storagePath, setStoragePath] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [clips, setClips] = useState<ClipSuggestion[]>([]);
  const [words, setWords] = useState<WordTimestamp[]>([]);
  const [stageMessage, setStageMessage] = useState('');

  const handleVideoReady = async (
    path: string,
    _method: InputMethod,
    _srcUrl?: string,
    url?: string
  ) => {
    setStoragePath(path);

    try {
      // Get download URL from Firebase Storage
      let downloadUrl = url;
      if (!downloadUrl) {
        downloadUrl = await getFileUrl(path);
      }
      setVideoUrl(downloadUrl);

      // Step 2: Extract audio
      setStage('extracting-audio');
      setStageMessage('Analysing your video...');

      // Dynamically import ffmpeg to avoid SSR issues
      const { extractAudio } = await import('@/lib/ffmpeg');

      // Download the video as blob for ffmpeg
      const videoResponse = await fetch(downloadUrl);
      const videoBlob = await videoResponse.blob();
      const videoDuration = await readVideoDuration(videoBlob);
      const videoFile = new File([videoBlob], 'video.mp4', { type: 'video/mp4' });

      const audioBlob = await extractAudio(videoFile);
      if (audioBlob.size > 19 * 1024 * 1024) {
        setWords([]);
        setClips(createEstimatedClips(videoDuration));
        toast.warning('Audio is too large for transcription, so ClipForge made estimated clips you can still render.');
        setStage('review');
        return;
      }

      // Step 3: Transcribe
      setStage('transcribing');
      setStageMessage('Transcribing audio...');

      const idToken = await user!.getIdToken();
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.mp3');
      formData.append('idToken', idToken);

      let transcribeData: { words?: WordTimestamp[]; segments?: Array<{ start: number; end: number; text: string }> };
      try {
        const transcribeRes = await fetchWithTimeout('/api/transcribe', {
          method: 'POST',
          body: formData,
        }, TRANSCRIBE_TIMEOUT_MS);

        if (!transcribeRes.ok) {
          const errData = await transcribeRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Transcription failed');
        }

        transcribeData = await transcribeRes.json();
      } catch {
        setWords([]);
        setClips(createEstimatedClips(videoDuration));
        toast.warning('Transcription did not finish, so ClipForge made estimated clips you can still render.');
        setStage('review');
        return;
      }
      setWords(transcribeData.words || []);

      const transcriptText = formatTranscriptForAI(transcribeData.segments || []);
      if (!transcriptText.trim()) {
        setClips(createEstimatedClips(videoDuration));
        toast.warning('No clear speech was detected, so ClipForge made estimated clips you can still render.');
        setStage('review');
        return;
      }

      // Step 4: Analyze
      setStage('analyzing');
      setStageMessage('AI is finding your best clips...');

      try {
        const analyzeRes = await fetchWithTimeout('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcriptText, idToken }),
        }, ANALYZE_TIMEOUT_MS);

        if (!analyzeRes.ok) {
          const errData = await analyzeRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Analysis failed');
        }

        const analyzeData = await analyzeRes.json();
        setClips(analyzeData.clips?.length ? analyzeData.clips : createEstimatedClips(videoDuration));
      } catch {
        setClips(createEstimatedClips(videoDuration));
        toast.warning('AI analysis did not finish, so ClipForge made estimated clips you can still render.');
      }

      setStage('review');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Processing failed';
      toast.error(msg, { action: { label: 'Retry', onClick: () => setStage('input') } });
      setStage('input');
    }
  };

  const handleRegenerate = async () => {
    if (!user || !words.length) return;
    setStage('analyzing');
    setStageMessage('Finding different clip moments...');

    try {
      const idToken = await user.getIdToken();
      const segments = words.reduce((acc: Array<{ start: number; end: number; text: string }>, w) => {
        const last = acc[acc.length - 1];
        if (!last || w.start - last.end > 0.5) {
          acc.push({ start: w.start, end: w.end, text: w.word });
        } else {
          last.text += ' ' + w.word;
          last.end = w.end;
        }
        return acc;
      }, []);

      const transcriptText = formatTranscriptForAI(segments);

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptText, idToken }),
      });

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json();
        throw new Error(errData.error || 'Analysis failed');
      }

      const data = await analyzeRes.json();
      setClips(data.clips);
      setStage('review');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Regeneration failed';
      toast.error(msg);
      setStage('review');
    }
  };

  const STAGE_MESSAGES: Record<string, string> = {
    'extracting-audio': 'Extracting audio from video...',
    'transcribing': 'Transcribing speech with AI...',
    'analyzing': stageMessage || 'AI is finding your best viral moments...',
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--cf-text)]">Dashboard</h1>
          <p className="text-sm text-[var(--cf-muted)] mt-1">
            Paste a link or upload a video to generate viral clips
          </p>
          {isLocalDevMode && (
            <p className="mt-3 inline-flex rounded-full border border-[var(--cf-accent)]/30 bg-[var(--cf-accent)]/10 px-3 py-1 text-xs text-[var(--cf-accent)]">
              Local mode: uploads and rendered clips stay in this browser
            </p>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* Input Stage */}
          {stage === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-8"
            >
              <div className="max-w-2xl">
                <InputToggle onVideoReady={handleVideoReady} />
              </div>

            </motion.div>
          )}

          {/* Processing Stages */}
          {['extracting-audio', 'transcribing', 'analyzing'].includes(stage) && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-6"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-[var(--cf-accent)]/10 border border-[var(--cf-accent)]/20 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-[var(--cf-accent)]" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--cf-bg)] border-2 border-[var(--cf-accent)]/30 flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 text-[var(--cf-accent)] animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-[var(--cf-text)]">
                  {STAGE_MESSAGES[stage] || 'Processing...'}
                </p>
                <p className="text-sm text-[var(--cf-muted)] mt-1">This may take a moment</p>
              </div>

              {/* Stage progress dots */}
              <div className="flex items-center gap-2">
                {['extracting-audio', 'transcribing', 'analyzing'].map((s) => (
                  <div
                    key={s}
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      s === stage
                        ? 'bg-[var(--cf-accent)] scale-125'
                        : ['extracting-audio', 'transcribing', 'analyzing'].indexOf(s) <
                          ['extracting-audio', 'transcribing', 'analyzing'].indexOf(stage)
                        ? 'bg-[var(--cf-accent)]/40'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Review Stage */}
          {stage === 'review' && clips.length > 0 && (
            <motion.div
              key="review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ReviewDashboard
                clips={clips}
                videoUrl={videoUrl}
                storagePath={storagePath}
                onRegenerate={handleRegenerate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
