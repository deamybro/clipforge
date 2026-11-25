import type { ClipSuggestion } from './groq';

const MIN_DURATION = 30;
const MAX_DURATION = 60;

const HOOK_KEYWORDS = [
  'secret',
  'mistake',
  'wrong',
  'truth',
  'fail',
  'failed',
  'never',
  'why',
  'how',
  'what if',
  'but',
  'only',
  'finally',
  'shocking',
  'problem',
  'danger',
  'stop',
  'best',
  'worst',
];

type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

function parseTranscriptSegments(transcriptText: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const pattern = /\[([\d.]+)\s*-\s*([\d.]+)\]\s*([^\n]+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(transcriptText)) !== null) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    const text = match[3]?.trim() || '';
    if (Number.isFinite(start) && Number.isFinite(end) && text) {
      segments.push({ start, end, text });
    }
  }
  return segments;
}

function scoreSegment(text: string): number {
  const lower = text.toLowerCase();
  let score = Math.min(30, text.length / 4);
  for (const keyword of HOOK_KEYWORDS) {
    if (lower.includes(keyword)) score += 8;
  }
  if (/[?!]/.test(text)) score += 8;
  if (/^(you|what|why|how|this|there|if|but)\b/i.test(text.trim())) score += 8;
  return Math.min(100, Math.round(score));
}

export function createFallbackClipSuggestions(transcriptText: string): ClipSuggestion[] {
  const segments = parseTranscriptSegments(transcriptText);
  if (!segments.length) return [];

  const totalDuration = Math.max(...segments.map((segment) => segment.end), MIN_DURATION);
  const candidates = segments
    .map((segment) => ({
      segment,
      score: scoreSegment(segment.text),
    }))
    .sort((a, b) => b.score - a.score);

  const clips: ClipSuggestion[] = [];
  for (const candidate of candidates) {
    const start = Math.max(0, candidate.segment.start);
    const end = Math.min(totalDuration, start + MIN_DURATION);
    if (end - start < MIN_DURATION) continue;
    const overlaps = clips.some((clip) => start < clip.end_time && end > clip.start_time);
    if (overlaps) continue;
    clips.push({
      title: candidate.segment.text.slice(0, 58).replace(/[.?!,;:]+$/, '') || 'Strong Clip Moment',
      hook: candidate.segment.text,
      start_time: Number(start.toFixed(2)),
      end_time: Number(end.toFixed(2)),
      hook_score: Math.max(80, candidate.score),
    });
    if (clips.length === 3) break;
  }

  if (!clips.length) {
    clips.push({
      title: 'Best Clip Moment',
      hook: segments[0].text,
      start_time: Math.max(0, segments[0].start),
      end_time: Math.min(totalDuration, Math.max(0, segments[0].start) + MIN_DURATION),
      hook_score: 80,
    });
  }

  return clips;
}

export function normalizeClipSuggestions(
  clips: ClipSuggestion[],
  transcriptText: string
): ClipSuggestion[] {
  const transcriptEnds: number[] = [];
  const timestampPattern = /\[[\d.]+\s*-\s*([\d.]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = timestampPattern.exec(transcriptText)) !== null) {
    const end = Number(match[1]);
    if (Number.isFinite(end)) transcriptEnds.push(end);
  }
  const totalDuration = Math.max(...transcriptEnds, MIN_DURATION);

  const normalized = clips.map((clip) => {
    let start = Math.max(0, Number(clip.start_time) || 0);
    let end = Math.min(totalDuration, Number(clip.end_time) || start + MIN_DURATION);

    if (end - start < MIN_DURATION) {
      end = Math.min(totalDuration, start + MIN_DURATION);
      if (end - start < MIN_DURATION) start = Math.max(0, end - MIN_DURATION);
    }
    if (end - start > MAX_DURATION) end = start + MAX_DURATION;

    return {
      ...clip,
      start_time: Number(start.toFixed(2)),
      end_time: Number(end.toFixed(2)),
      hook_score: Math.min(100, Math.max(0, Number(clip.hook_score) || 0)),
    };
  });

  const strongestFirst = normalized.sort((a, b) => b.hook_score - a.hook_score);
  const selected: ClipSuggestion[] = [];
  for (const candidate of strongestFirst) {
    const overlaps = selected.some(
      (clip) => candidate.start_time < clip.end_time && candidate.end_time > clip.start_time
    );
    if (!overlaps) selected.push(candidate);
    if (selected.length === 3) break;
  }

  return selected;
}
