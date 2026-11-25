import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import type { FramingMode } from '@/components/clips/FramingPicker';

let ffmpegInstance: FFmpeg | null = null;
let isLoaded = false;
let progressCallback: ((progress: number) => void) | undefined;

function makeRunId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function fileDataToBlob(data: Uint8Array | string, type: string): Blob {
  if (typeof data === 'string') {
    return new Blob([data], { type });
  }
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return new Blob([copy.buffer], { type });
}

function readVideoAspect(buffer: ArrayBuffer): Promise<number | null> {
  return new Promise((resolve) => {
    const blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'video/mp4' }));
    const video = document.createElement('video');
    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(blobUrl);
    };

    video.preload = 'metadata';
    video.muted = true;
    video.onloadedmetadata = () => {
      const aspect = video.videoWidth && video.videoHeight
        ? video.videoWidth / video.videoHeight
        : null;
      cleanup();
      resolve(aspect);
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
    video.src = blobUrl;
  });
}

function chooseFramingMode(requested: FramingMode, aspect: number | null): Exclude<FramingMode, 'auto'> {
  if (requested === 'fill' || requested === 'fit') return requested;

  const targetAspect = 9 / 16;
  if (!aspect) return 'fit';

  const aspectDelta = Math.abs(aspect - targetAspect) / targetAspect;
  return aspectDelta <= 0.08 ? 'fill' : 'fit';
}

function buildVideoGraph(mode: Exclude<FramingMode, 'auto'>): string {
  if (mode === 'fill') {
    return [
      '[0:v]scale=1080:1920:force_original_aspect_ratio=increase',
      'crop=1080:1920',
      'setsar=1',
      'setpts=PTS-STARTPTS[vout]',
    ].join(',');
  }

  return [
    '[0:v]split=2[bgsrc][fgsrc]',
    '[bgsrc]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=28:2,eq=brightness=-0.08:saturation=1.12[bg]',
    '[fgsrc]scale=1080:1920:force_original_aspect_ratio=decrease[fg]',
    '[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1,setpts=PTS-STARTPTS[vout]',
  ].join(';');
}

function generateBackgroundMusic(track: string, duration: number): Uint8Array {
  const sampleRate = 22050;
  const sampleCount = Math.ceil(duration * sampleRate);
  const dataSize = sampleCount * 2;
  const wav = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wav);
  const writeText = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index++) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  };

  writeText(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, dataSize, true);

  const progressions: Record<string, number[][]> = {
    lofi: [[130.81, 164.81, 196], [110, 130.81, 164.81], [146.83, 174.61, 220], [98, 123.47, 146.83]],
    phonk: [[73.42, 87.31], [65.41, 82.41], [61.74, 73.42], [55, 65.41]],
    dramatic: [[110, 130.81, 164.81], [98, 123.47, 146.83], [87.31, 110, 130.81], [82.41, 98, 123.47]],
    'chill-trap': [[123.47, 155.56, 185], [110, 138.59, 164.81], [98, 123.47, 155.56], [116.54, 146.83, 174.61]],
  };
  const chords = progressions[track] || progressions.lofi;

  for (let index = 0; index < sampleCount; index++) {
    const time = index / sampleRate;
    const chord = chords[Math.floor(time / 4) % chords.length];
    const beat = time % 0.5;
    const kick = Math.sin(2 * Math.PI * (70 - beat * 70) * time) * Math.exp(-beat * 18) * 0.18;
    const harmony = chord.reduce(
      (sum, frequency) => sum + Math.sin(2 * Math.PI * frequency * time),
      0
    ) / chord.length;
    const pulse = 0.65 + Math.sin(2 * Math.PI * 0.25 * time) * 0.15;
    const sample = Math.max(-1, Math.min(1, harmony * pulse * 0.34 + kick));
    view.setInt16(44 + index * 2, sample * 32767, true);
  }

  return new Uint8Array(wav);
}

export async function getFFmpeg(
  onProgress?: (progress: number) => void
): Promise<FFmpeg> {
  progressCallback = onProgress;

  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
    ffmpegInstance.on('progress', ({ progress }) => {
      progressCallback?.(Math.min(progress * 100, 100));
    });
  }

  if (!isLoaded) {
    const baseURL = `${window.location.origin}/ffmpeg`;
    await ffmpegInstance.load({
      coreURL: `${baseURL}/ffmpeg-core.js`,
      wasmURL: `${baseURL}/ffmpeg-core.wasm`,
    });
    isLoaded = true;
  }

  return ffmpegInstance;
}

function resetFFmpeg() {
  try {
    ffmpegInstance?.terminate();
  } finally {
    ffmpegInstance = null;
    isLoaded = false;
    progressCallback = undefined;
  }
}

export interface RenderOptions {
  videoUrl: string;
  startTime: number;
  endTime: number;
  musicTrack: string; // path like '/music/lofi.mp3'
  framingMode?: FramingMode;
  onProgress?: (progress: number) => void;
  clipIndex: number;
}

export async function extractAudio(
  videoFile: File | Blob,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg(onProgress);

  const runId = makeRunId();
  const inputName = `input_video_${runId}`;
  const outputName = `output_audio_${runId}.mp3`;

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    const exitCode = await ffmpeg.exec([
      '-y',
      '-i', inputName,
      '-vn',
      '-acodec', 'libmp3lame',
      '-ac', '1',
      '-ar', '16000',
      '-b:a', '32k',
      outputName,
    ], 10 * 60 * 1000);
    if (exitCode !== 0) {
      throw new Error(`Audio extraction failed with ffmpeg exit code ${exitCode}.`);
    }

    const data = await ffmpeg.readFile(outputName);
    return fileDataToBlob(data, 'audio/mp3');
  } catch (error) {
    if (error instanceof Error && error.message.includes('terminated')) {
      throw new Error('Audio extraction timed out. Try a shorter video.');
    }
    throw error;
  } finally {
    await Promise.allSettled([ffmpeg.deleteFile(inputName), ffmpeg.deleteFile(outputName)]);
  }
}

export async function renderClip(options: RenderOptions): Promise<Blob> {
  const { videoUrl, startTime, endTime, musicTrack, framingMode = 'auto', onProgress, clipIndex } = options;

  const ffmpeg = await getFFmpeg(onProgress);

  const runId = makeRunId();
  const videoInput = `video_${clipIndex}_${runId}`;
  const musicInput = `music_${clipIndex}_${runId}.wav`;
  const outputFile = `clip_${clipIndex}_${runId}.mp4`;

  // Write input files
  const videoResponse = await fetch(videoUrl);
  if (!videoResponse.ok) throw new Error('Could not load the source video for rendering.');
  const videoData = await videoResponse.arrayBuffer();
  const resolvedFramingMode = chooseFramingMode(framingMode, await readVideoAspect(videoData.slice(0)));
  await ffmpeg.writeFile(videoInput, new Uint8Array(videoData));

  // Write music if not silent
  let hasMusicInput = false;
  if (musicTrack && !musicTrack.includes('silent')) {
    const trackName = musicTrack.split('/').pop()?.replace(/\.[^.]+$/, '') || 'lofi';
    if (musicTrack.startsWith('/music/')) {
      await ffmpeg.writeFile(musicInput, generateBackgroundMusic(trackName, endTime - startTime + 1));
      hasMusicInput = true;
    } else {
      try {
        const musicResponse = await fetch(musicTrack);
        if (!musicResponse.ok) throw new Error('Music file not found');
        const musicData = await musicResponse.arrayBuffer();
        await ffmpeg.writeFile(musicInput, new Uint8Array(musicData));
        hasMusicInput = true;
      } catch {
        await ffmpeg.writeFile(musicInput, generateBackgroundMusic(trackName, endTime - startTime + 1));
        hasMusicInput = true;
      }
    }
  }

  const duration = endTime - startTime;

  // Build ffmpeg command
  const args: string[] = [
    '-y',
    '-ss', String(startTime),
    '-i', videoInput,
  ];

  if (hasMusicInput) {
    args.push('-stream_loop', '-1', '-i', musicInput);
  }

  const videoGraph = buildVideoGraph(resolvedFramingMode);
  const filterGraph = hasMusicInput
    ? `${videoGraph};[0:a]asetpts=PTS-STARTPTS,volume=1.0[a1];[1:a]asetpts=PTS-STARTPTS,volume=0.22[a2];[a1][a2]amix=inputs=2:duration=shortest:normalize=0[aout]`
    : videoGraph;

  if (hasMusicInput) {
    args.push(
      '-filter_complex',
      filterGraph,
      '-map', '[vout]',
      '-map', '[aout]',
    );
  } else {
    args.push(
      '-filter_complex', filterGraph,
      '-map', '[vout]',
      '-map', '0:a?',
      '-af', 'asetpts=PTS-STARTPTS',
    );
  }

  args.push(
    '-t', String(duration),
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '28',
    '-threads', '2',
    '-c:a', 'aac',
    '-ar', '44100',
    '-movflags', '+faststart',
    outputFile,
  );

  const renderTimeoutMs = Math.min(15 * 60 * 1000, Math.max(4 * 60 * 1000, Math.ceil(duration * 15000)));

  try {
    const exitCode = await ffmpeg.exec(args, renderTimeoutMs);
    if (exitCode !== 0) {
      if (exitCode === 1) {
        resetFFmpeg();
        throw new Error('Clip rendering timed out. Try rendering one shorter clip.');
      }
      throw new Error(`Clip rendering failed with ffmpeg exit code ${exitCode}.`);
    }

    const data = await ffmpeg.readFile(outputFile);
    return fileDataToBlob(data, 'video/mp4');
  } finally {
    await Promise.allSettled([
      ffmpeg.deleteFile(videoInput),
      ffmpeg.deleteFile(outputFile),
      ...(hasMusicInput ? [ffmpeg.deleteFile(musicInput)] : []),
    ]);
  }
}
