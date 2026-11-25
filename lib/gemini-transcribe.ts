import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TranscriptionResult } from './groq';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function cleanJson(text: string): string {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

function normalizeResult(value: Partial<TranscriptionResult>): TranscriptionResult {
  const text = typeof value.text === 'string' ? value.text.trim() : '';
  const segments = Array.isArray(value.segments) ? value.segments : [];
  const words = Array.isArray(value.words) ? value.words : [];

  if (segments.length === 0 && text) {
    return {
      text,
      words,
      segments: [{ start: 0, end: Math.max(30, words.at(-1)?.end || 60), text }],
    };
  }

  return { text, segments, words };
}

export async function transcribeWithGemini(audioFile: File): Promise<TranscriptionResult> {
  if (audioFile.size > 19 * 1024 * 1024) {
    throw new Error('Extracted audio is too large for transcription. Try a shorter video.');
  }
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });
  const bytes = Buffer.from(await audioFile.arrayBuffer()).toString('base64');

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: audioFile.type || 'audio/mpeg',
        data: bytes,
      },
    },
    `Transcribe this audio accurately. Return only JSON in this exact shape:
{
  "text": "complete transcript",
  "segments": [{"start": 0.0, "end": 3.2, "text": "segment text"}],
  "words": [{"word": "spoken word", "start": 0.0, "end": 0.4}]
}
Use seconds for timestamps. Include every spoken word. If there is no speech, return empty arrays and an empty text string.`,
  ]);

  const responseText = cleanJson(result.response.text());
  try {
    return normalizeResult(JSON.parse(responseText) as Partial<TranscriptionResult>);
  } catch {
    return normalizeResult({ text: responseText });
  }
}
