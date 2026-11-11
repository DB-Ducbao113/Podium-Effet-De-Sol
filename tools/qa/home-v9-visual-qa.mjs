/**
 * Run from repository root while the Vite dev server is running.
 *   $env:CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
 *   $env:V9_URL="http://localhost:5173"
 *   node tools/home-v9-visual-qa.mjs
 *
 * Untracked output: .local-assets/home-v9/qa/
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const base = (process.env.V9_URL || 'http://localhost:5173').replace(/\/$/, '');
const output = resolve('.local-assets/home-v9/qa');
mkdirSync(output, { recursive: true });
const candidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const executablePath = candidates.find((item) => existsSync(item));

if (!executablePath) {
  console.error('Chrome executable not found. Set CHROME_PATH to Chrome.exe.');
  process.exitCode = 1;
} else {
  const browser = await chromium.launch({ headless: true, executablePath });
  const report = { generatedAt: new Date().toISOString(), base, viewports: [], lab: [], gates: {} };
  const sizes = [
    { width: 360, height: 780 },
    { width: 390, height: 844 },
    { width: 768, height: 980 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ];
  try {
    for (const size of sizes) {
      const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      try {
        await page.goto(base + '/?v9=1', { waitUntil: 'domcontentloaded' });
        await page.locator('#launch-control').waitFor({ timeout: 25000 });
        await page.waitForTimeout(1300);
        const info = await page.evaluate(() => ({
          actualWidth: window.innerWidth,
          contentWidth: document.documentElement.scrollWidth,
          worldQuality: document.querySelector('.home-v9-world')?.getAttribute('data-world-quality') ?? 'missing',
          worldCanvases: document.querySelectorAll('.home-v9-world canvas').length,
          appAttribute: document.querySelector('[data-home-v9]')?.getAttribute('data-home-v9'),
          car: document.querySelector('.f1hero__car')?.getAttribute('src'),
          carIsLoaded: Boolean(document.querySelector('.f1hero__car')?.naturalWidth),
          sections: ['launch-control','race-control','championship-overview','eds-engineering','eds-explore','peds-credits']
            .map((id) => ({ id, exists: Boolean(document.getElementById(id)) })),
        }));
        const name = 'v9-' + size.width;
        await page.screenshot({ path: resolve(output, name + '-full.png'), fullPage: true, animations: 'disabled' });
        if (size.width === 1440) {
          for (const id of ['launch-control','race-control','championship-overview','eds-engineering','eds-explore','peds-credits']) {
            const section = page.locator('#' + id);
            if (await section.count()) {
              await section.scrollIntoViewIfNeeded();
              await page.waitForTimeout(550);
              await page.screenshot({ path: resolve(output, 'v9-' + id + '.png'), animations: 'disabled' });
            }
          }
          const diffuser = page.locator('#eds-engineering button').filter({ hasText: 'DIFFUSER' });
          if (await diffuser.count()) {
            await diffuser.click();
            report.gates.engineeringSelection = await diffuser.getAttribute('aria-pressed') === 'true';
          }
        }
        report.viewports.push({
          ...size, ...info, overflowPx: Math.max(0, info.contentWidth - info.actualWidth), errors,
        });
      } catch (error) {
        report.viewports.push({ ...size, failure: String(error), errors });
      } finally {
        await page.close();
      }
    }
    const labPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await labPage.goto(base + '/__home-v9-lab', { waitUntil: 'domcontentloaded' });
      await labPage.locator('[data-v9-lab]').waitFor({ timeout: 25000 });
      for (const [key, label] of [
        ['pressure', '01 / PRESSURE'],
        ['velocity', '02 / VELOCITY'],
        ['carbon', '03 / CARBON'],
      ]) {
        await labPage.getByRole('button', { name: label }).click();
        await labPage.waitForTimeout(900);
        report.lab.push({
          mode: key,
          selected: await labPage.locator('[data-v9-lab]').getAttribute('data-v9-lab'),
          quality: await labPage.locator('.home-v9-world').getAttribute('data-world-quality'),
        });
        await labPage.screenshot({ path: resolve(output, 'v9-lab-' + key + '.png'), animations: 'disabled' });
      }
      await labPage.emulateMedia({ reducedMotion: 'reduce' });
      await labPage.reload({ waitUntil: 'domcontentloaded' });
      await labPage.waitForTimeout(350);
      report.gates.reducedMotionStatic = await labPage.locator('.home-v9-world')
        .getAttribute('data-world-quality') === 'static';
    } catch (error) {
      report.lab.push({ failure: String(error) });
    } finally {
      await labPage.close();
    }
  } finally {
    await browser.close();
    writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  }
  const failures = [
    report.viewports.some((v) => v.failure || v.overflowPx > 2 || v.appAttribute !== 'true' ||
      v.sections?.some((section) => !section.exists)),
    report.lab.some((v) => v.failure || v.selected !== v.mode),
    report.gates.engineeringSelection !== true,
    report.gates.reducedMotionStatic !== true,
  ];
  if (failures.some(Boolean)) process.exitCode = 1;
  console.log('\nManual visual review and real-device FPS profiling remain mandatory.');
}
