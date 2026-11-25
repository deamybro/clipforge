import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ClipSuggestion } from './groq';
import { CLIP_PROMPT } from './groq';

// Server-side only
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeWithGemini(transcriptText: string): Promise<ClipSuggestion[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = CLIP_PROMPT.replace('{TRANSCRIPT_TEXT_HERE}', transcriptText);

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // First parse attempt
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed as ClipSuggestion[];
    throw new Error('Not an array');
  } catch {
    // Retry with explicit JSON instruction
    const retryResult = await model.generateContent(
      prompt + '\n\nReturn only valid JSON with no other text.'
    );
    const retryText = retryResult.response.text();
    const cleaned = retryText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed as ClipSuggestion[];
    throw new Error('Gemini returned invalid JSON after retry');
  }
}
