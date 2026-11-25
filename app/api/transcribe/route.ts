import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import Groq from 'groq-sdk';
import { isServerLocalDevMode } from '@/lib/runtime';
import { transcribeWithGemini } from '@/lib/gemini-transcribe';

// Simple in-memory rate limiter (resets on server restart)
// For production, replace with Upstash Redis
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(uid: string, maxPerHour = 10): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(uid);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(uid, { count: 1, resetAt: now + 3600_000 });
    return true;
  }
  if (entry.count >= maxPerHour) return false;
  entry.count++;
  return true;
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const TRANSCRIPTION_TIMEOUT_MS = 90_000;

interface VerboseTranscription {
  text: string;
  words?: Array<{ word: string; start: number; end: number }>;
  segments?: Array<{ text: string; start: number; end: number }>;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const idToken = formData.get('idToken') as string | null;

    if (!audioFile || (!idToken && !isServerLocalDevMode())) {
      return NextResponse.json({ error: 'Missing audio or idToken' }, { status: 400 });
    }

    // Verify token
    let userId = 'local-dev-user';
    if (!isServerLocalDevMode()) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken!);
        userId = decoded.uid;
      } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again in an hour.' },
        { status: 429 }
      );
    }

    try {
      const response = await withTimeout(
        groq.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-large-v3',
          response_format: 'verbose_json',
          timestamp_granularities: ['word', 'segment'],
        }),
        TRANSCRIPTION_TIMEOUT_MS,
        'Groq transcription'
      );
      const verboseResponse = response as VerboseTranscription;
      return NextResponse.json({
        provider: 'groq',
        text: verboseResponse.text,
        words: verboseResponse.words || [],
        segments: verboseResponse.segments || [],
      });
    } catch (groqError) {
      console.warn('Groq transcription failed, using Gemini fallback:', groqError);
      const fallback = await withTimeout(
        transcribeWithGemini(audioFile),
        TRANSCRIPTION_TIMEOUT_MS,
        'Gemini transcription'
      );
      return NextResponse.json({ provider: 'gemini', ...fallback });
    }
  } catch (error: unknown) {
    console.error('Transcription error:', error);
    const message = error instanceof Error ? error.message : 'Unknown transcription error';
    return NextResponse.json(
      {
        error: isServerLocalDevMode()
          ? `Transcription failed: ${message}`
          : 'Transcription failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
