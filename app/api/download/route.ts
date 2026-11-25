import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

const SUPPORTED_DOMAINS = [
  'youtube.com', 'youtu.be',
  'tiktok.com',
  'instagram.com',
  'twitter.com', 'x.com',
  'facebook.com', 'fb.watch',
];

function isSupportedUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
    return SUPPORTED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url, idToken } = await req.json();

    if (!url || !idToken) {
      return NextResponse.json({ error: 'Missing url or idToken' }, { status: 400 });
    }

    // Verify Firebase ID token server-side
    let userId: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      userId = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Whitelist check
    if (!isSupportedUrl(url)) {
      return NextResponse.json(
        { error: 'Unsupported platform. Paste a link from YouTube, TikTok, Instagram, X, or Facebook.' },
        { status: 400 }
      );
    }

    const railwayUrl = process.env.RAILWAY_DOWNLOADER_URL;
    const railwaySecret = process.env.RAILWAY_DOWNLOADER_SECRET;

    if (!railwayUrl) {
      return NextResponse.json(
        { error: 'Download service not configured. Please set RAILWAY_DOWNLOADER_URL.' },
        { status: 503 }
      );
    }

    // Forward to Railway yt-dlp service
    const railwayResponse = await fetch(`${railwayUrl}/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret': railwaySecret || '',
      },
      body: JSON.stringify({ url, user_id: userId }),
      signal: AbortSignal.timeout(620_000), // 10+ minute timeout
    });

    const data = await railwayResponse.json();

    if (!railwayResponse.ok) {
      return NextResponse.json(
        { error: data.detail || 'Download failed' },
        { status: railwayResponse.status }
      );
    }

    return NextResponse.json({ storage_path: data.storage_path });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('timeout') || message.includes('abort')) {
      return NextResponse.json(
        { error: 'Download timed out. Try again or use a shorter video.' },
        { status: 408 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
