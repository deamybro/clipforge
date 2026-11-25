import { readFile, writeFile } from 'node:fs/promises';

const transcription = JSON.parse(await readFile('test-artifacts/transcription.json', 'utf8'));
const analysis = JSON.parse(await readFile('test-artifacts/analysis.json', 'utf8'));
const clip = analysis.clips[0];
const words = transcription.words.filter((word) => word.start >= clip.start_time && word.end <= clip.end_time);

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
};

const events = [];
for (let index = 0; index < words.length; index += 2) {
  const pair = words.slice(index, index + 2);
  events.push(
    `Dialogue: 0,${formatTime(pair[0].start - clip.start_time)},${formatTime(pair.at(-1).end - clip.start_time)},Default,,0,0,0,,{\\an5\\pos(540,1248)}${pair.map((word) => word.word).join(' ')}`
  );
}

const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,72,&H00FFFFFF,&H000000FF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,5,0,5,80,80,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join('\n')}`;

await writeFile('test-artifacts/subs-fixture.ass', ass);
console.log(`Wrote ${events.length} caption events.`);
