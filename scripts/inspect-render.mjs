import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';

const videoPath = process.argv[2];
if (!videoPath) throw new Error('Usage: node scripts/inspect-render.mjs <video-path>');
const requestedTimes = process.argv.slice(3).map(Number).filter(Number.isFinite);

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--disable-extensions', '--allow-file-access-from-files'],
});
const page = await browser.newPage({ viewport: { width: 500, height: 900 } });

await page.goto(pathToFileURL(videoPath).href, { waitUntil: 'domcontentloaded', timeout: 60_000 });
const video = page.locator('video');
await video.waitFor({ timeout: 60_000 });
await video.evaluate((element) => new Promise((resolve) => {
  if (element.readyState >= 1) resolve(null);
  else element.addEventListener('loadedmetadata', () => resolve(null), { once: true });
}));

const metadata = await video.evaluate((element) => ({
  width: element.videoWidth,
  height: element.videoHeight,
  duration: element.duration,
}));

for (const second of requestedTimes.length ? requestedTimes : [1, 5, 10, 15, 25]) {
  await video.evaluate((element, time) => {
    element.currentTime = Math.min(time, Math.max(0, element.duration - 0.5));
  }, second);
  await page.waitForTimeout(1_000);
  await page.screenshot({ path: `test-artifacts/rendered-frame-${second}.png` });
}
console.log(JSON.stringify(metadata));
await browser.close();
