# ClipForge

ClipForge is a Next.js 14 app that turns long-form videos into short vertical
clips. It supports Firebase authentication and temporary storage, Groq
transcription, Gemini/Groq highlight detection, browser-side ffmpeg rendering,
and a separate Railway yt-dlp downloader.

## Run now

Local mode keeps source videos and rendered clips in browser memory. It skips
authentication, Firebase Storage, history, and link importing.

1. Set `NEXT_PUBLIC_LOCAL_DEV_MODE=true` and `LOCAL_DEV_MODE=true`.
2. Add a valid `GEMINI_API_KEY`. Add `GROQ_API_KEY` when Groq is available;
   Gemini automatically handles transcription when Groq is blocked.
3. Optionally add licensed tracks to `public/music`.
4. Run `npm install` to install dependencies and bundle ffmpeg locally.
5. Run `npm run dev`.
6. Open `http://localhost:3000/dashboard` and upload a short MP4, MOV, or WebM.

If licensed MP3 files are absent, ClipForge generates a simple local backing
track so exports still include background music.

## Enable cloud features later

Set both local-mode values to `false`, then configure Firebase to enable login,
temporary cloud storage, history, and account management. Configure the Railway
downloader to enable pasted links.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Deploy

- Deploy the Next.js app to Vercel and add every value from
  `.env.local.example`.
- Deploy `railway-downloader` to Railway with
  `FIREBASE_SERVICE_ACCOUNT_JSON` and `RAILWAY_DOWNLOADER_SECRET`.
- Install the Firebase CLI, select your project, then deploy rules and cleanup:

```bash
firebase deploy --only firestore:rules,storage
cd firebase/functions
npm install
npm run build
cd ../..
firebase deploy --only functions
```

Temporary clip files are deleted after downloads and swept by the daily
Firebase function after 24 hours.
