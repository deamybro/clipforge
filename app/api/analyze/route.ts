import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { analyzeWithGemini } from '@/lib/gemini';
import { analyzeWithLlama } from '@/lib/groq';
import { isServerLocalDevMode } from '@/lib/runtime';
import { createFallbackClipSuggestions, normalizeClipSuggestions } from '@/lib/clip-validation';

// In-memory rate limiter for analyze endpoint
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

export async function POST(req: NextRequest) {
  try {
    const { transcriptText, idToken } = await req.json();

    if (!transcriptText || (!idToken && !isServerLocalDevMode())) {
      return NextResponse.json({ error: 'Missing transcriptText or idToken' }, { status: 400 });
    }

    // Verify token
    let userId = 'local-dev-user';
    if (!isServerLocalDevMode()) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
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

    // Try Gemini first, fallback to Llama 3
    let clips;
    try {
      clips = await analyzeWithGemini(transcriptText);
    } catch {
      try {
        clips = await analyzeWithLlama(transcriptText);
      } catch {
        clips = createFallbackClipSuggestions(transcriptText);
      }
    }
    clips = normalizeClipSuggestions(clips, transcriptText);

    return NextResponse.json({ clips });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}
