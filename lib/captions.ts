import type { WordTimestamp } from './groq';

/**
 * Converts word-level timestamps into an .ass subtitle file string.
 * Words appear 1-2 at a time in sync with speech, centered at 65% from top.
 */
export function generateAssSubtitles(
  words: WordTimestamp[],
  clipStartTime: number,
  clipEndTime: number
): string {
  // Filter words within this clip's time range
  const clipWords = words.filter(
    (w) => w.start >= clipStartTime && w.end <= clipEndTime
  );

  // Re-zero timestamps relative to clip start
  const normalized = clipWords.map((w) => ({
    ...w,
    start: w.start - clipStartTime,
    end: w.end - clipStartTime,
  }));

  // Group into pairs of 2 words
  const groups: Array<{ words: WordTimestamp[]; start: number; end: number }> = [];
  for (let i = 0; i < normalized.length; i += 2) {
    const pair = normalized.slice(i, Math.min(i + 2, normalized.length));
    groups.push({
      words: pair,
      start: pair[0].start,
      end: pair[pair.length - 1].end,
    });
  }

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,72,&H00FFFFFF,&H000000FF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,5,0,5,80,80,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '00')}`;
  };

  const events = groups
    .map((g) => {
      const text = g.words
        .map((w) => w.word.trim())
        .join(' ')
        .replace(/[{}]/g, '')
        .replace(/\n/g, ' ');
      return `Dialogue: 0,${formatTime(g.start)},${formatTime(g.end)},Default,,0,0,0,,{\\an5\\pos(540,1248)}${text}`;
    })
    .join('\n');

  return header + events;
}

export function generateSrtSubtitles(
  words: WordTimestamp[],
  clipStartTime: number,
  clipEndTime: number
): string {
  const clipWords = words
    .filter((word) => word.start >= clipStartTime && word.end <= clipEndTime)
    .map((word) => ({
      ...word,
      start: word.start - clipStartTime,
      end: word.end - clipStartTime,
    }));

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const wholeSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
  };

  const cues: string[] = [];
  for (let index = 0; index < clipWords.length; index += 2) {
    const pair = clipWords.slice(index, index + 2);
    const text = pair.map((word) => word.word.trim()).join(' ').replace(/\n/g, ' ').toUpperCase();
    const start = Math.max(0, pair[0].start);
    const end = Math.max(pair[0].start + 0.08, pair[pair.length - 1].end);
    cues.push(`${cues.length + 1}\n${formatTime(start)} --> ${formatTime(end)}\n${text}`);
  }
  return cues.join('\n\n');
}

export function formatTranscriptForAI(
  segments: Array<{ start: number; end: number; text: string }>
): string {
  return segments
    .map((s) => `[${s.start.toFixed(2)} - ${s.end.toFixed(2)}] ${s.text.trim()}`)
    .join('\n');
}
