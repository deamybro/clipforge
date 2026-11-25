import Groq from 'groq-sdk';

// This file is server-side only
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptionResult {
  text: string;
  words: WordTimestamp[];
  segments: Array<{ start: number; end: number; text: string }>;
}

interface VerboseTranscription {
  text: string;
  words?: WordTimestamp[];
  segments?: Array<{ start: number; end: number; text: string }>;
}

export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  const file = new File([audioBlob], 'audio.mp3', { type: 'audio/mp3' });

  const response = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    response_format: 'verbose_json',
    timestamp_granularities: ['word', 'segment'],
  });

  const verboseResponse = response as VerboseTranscription;

  return {
    text: verboseResponse.text,
    words: (verboseResponse.words || []).map((w) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    })),
    segments: (verboseResponse.segments || []).map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text,
    })),
  };
}

export interface ClipSuggestion {
  title: string;
  hook: string;
  start_time: number;
  end_time: number;
  hook_score: number;
}

const CLIP_PROMPT = `You are an elite short-form video editor and viral content strategist.
Analyze the timestamped transcript and identify exactly 3 non-overlapping
segments that will perform best on TikTok, YouTube Shorts, and Instagram Reels.

Every selected clip must:
- Be between 30 and 60 seconds long
- Start EXACTLY at the first word of the strongest spoken hook sentence
- Create immediate interest within the first 1.5 seconds through tension,
  surprise, emotion, a bold claim, a compelling question, or a clear promise
- Never include greetings, setup, filler, pauses, or context before the hook
- Contain a clear story arc: hook, context, then payoff or cliffhanger
- Be one continuous timestamp range with no gaps or jumps
- Preserve the exact hook timestamp; never move the start merely to reach a duration
- Use the actual first spoken sentence as "hook", not a rewritten sentence
- Prioritize controversy, revelation, strong emotion, unexpected data,
  compelling questions, and shocking statistics
- Score above 80 for hook_score

Return ONLY a raw JSON array with the strongest clip first. No markdown,
backticks, or explanation. Exact format:
[
  {
    "title": "Short punchy viral title for this clip",
    "hook": "The actual first spoken scroll-stopping sentence",
    "start_time": 45.20,
    "end_time": 98.50,
    "hook_score": 87
  }
]

Transcript:
{TRANSCRIPT_TEXT_HERE}`;

export async function analyzeWithLlama(transcriptText: string): Promise<ClipSuggestion[]> {
  const prompt = CLIP_PROMPT.replace('{TRANSCRIPT_TEXT_HERE}', transcriptText);

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || '';
  const parsed = JSON.parse(content.trim());
  if (!Array.isArray(parsed)) throw new Error('Invalid response format from Llama');
  return parsed as ClipSuggestion[];
}

export { CLIP_PROMPT };
