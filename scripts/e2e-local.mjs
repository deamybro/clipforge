import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const videoPath = process.argv[2];
if (!videoPath) throw new Error('Usage: node scripts/e2e-local.mjs <video-path>');
const useCachedTranscription = process.argv.includes('--cached-transcription');
const useCachedApi = process.argv.includes('--cached-api');
const failTranscription = process.argv.includes('--fail-transcription');

const artifacts = 'test-artifacts';
await mkdir(artifacts, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: [
    '--disable-extensions',
    '--disable-dev-shm-usage',
    '--js-flags=--max-old-space-size=8192',
  ],
});

const context = await browser.newContext({
  acceptDownloads: true,
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
if (failTranscription) {
  await page.route('**/api/transcribe', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Forced transcription failure for fallback verification.' }),
    });
  });
} else if (useCachedApi) {
  const cachedAnalysis = await readFile(`${artifacts}/analysis.json`);
  await page.route('**/api/transcribe', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        text: 'Cached transcript for render verification.',
        words: [],
        segments: [{ start: 0, end: 1, text: 'Cached transcript for render verification.' }],
      }),
    });
  });
  await page.route('**/api/analyze', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: cachedAnalysis,
    });
  });
} else if (useCachedTranscription) {
  const cachedTranscription = await readFile(`${artifacts}/transcription.json`);
  await page.route('**/api/transcribe', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: cachedTranscription,
    });
  });
}
const events = [];
const record = (type, text) => {
  const line = `${new Date().toISOString()} ${type}: ${text}`;
  events.push(line);
  console.log(line);
};

page.on('console', (message) => record(`console.${message.type()}`, message.text()));
page.on('pageerror', (error) => record('pageerror', error.stack || error.message));
page.on('requestfailed', (request) => record('requestfailed', `${request.url()} ${request.failure()?.errorText}`));
page.on('response', (response) => {
  if (response.status() >= 400) record('response', `${response.status()} ${response.url()}`);
  if (response.url().includes('/api/transcribe') || response.url().includes('/api/analyze')) {
    const name = response.url().includes('/api/transcribe') ? 'transcription.json' : 'analysis.json';
    void response.body()
      .then((body) => writeFile(`${artifacts}/${name}`, body))
      .catch((error) => record('response-body-error', error.message));
  }
});

try {
  record('step', 'Opening dashboard');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.screenshot({ path: `${artifacts}/01-dashboard.png`, fullPage: true });

  record('step', `Uploading ${videoPath}`);
  await page.locator('input[type=file]').setInputFiles(videoPath);
  await page.waitForTimeout(2_000);
  await page.screenshot({ path: `${artifacts}/02-uploaded.png`, fullPage: true });

  record('step', 'Waiting for review dashboard');
  await page.getByText('Review Your Hooks').waitFor({ timeout: 1_200_000 });
  await page.screenshot({ path: `${artifacts}/03-review.png`, fullPage: true });

  for (const clipNumber of [2, 3]) {
    const excludeButton = page.getByRole('button', { name: `Exclude clip ${clipNumber}` });
    if (await excludeButton.count()) {
      await excludeButton.click();
    }
  }

  record('step', 'Rendering first selected clip');
  await page.getByRole('button', { name: 'Render Selected' }).click();
  await page.getByText('Your Clips Are Ready').waitFor({ timeout: 1_800_000 });
  await page.screenshot({ path: `${artifacts}/04-ready.png`, fullPage: true });

  const downloadPromise = page.waitForEvent('download', { timeout: 120_000 });
  await page.getByRole('button', { name: 'Download', exact: true }).first().click();
  const download = await downloadPromise;
  const outputPath = `${artifacts}/rendered-clip-${Date.now()}.mp4`;
  await download.saveAs(outputPath);
  record('success', `Saved ${outputPath}`);
} catch (error) {
  record('failure', error.stack || error.message);
  await page.screenshot({ path: `${artifacts}/failure.png`, fullPage: true }).catch(() => {});
  throw error;
} finally {
  await writeFile(`${artifacts}/events.log`, events.join('\n'));
  await browser.close();
}
