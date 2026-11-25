import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const source = join(process.cwd(), 'node_modules', '@ffmpeg', 'core', 'dist', 'umd');
const destination = join(process.cwd(), 'public', 'ffmpeg');

await mkdir(destination, { recursive: true });
await Promise.all([
  copyFile(join(source, 'ffmpeg-core.js'), join(destination, 'ffmpeg-core.js')),
  copyFile(join(source, 'ffmpeg-core.wasm'), join(destination, 'ffmpeg-core.wasm')),
]);

console.log('Bundled ffmpeg core into public/ffmpeg.');
