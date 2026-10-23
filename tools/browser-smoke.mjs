import { chromium } from 'playwright-core';
import fs from 'node:fs';

const baseUrl = process.env.PEDS_SMOKE_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
});
const cases = [
  { route: '/', viewport: { width: 1440, height: 900 } },
  { route: '/season/2026', viewport: { width: 1440, height: 900 } },
  { route: '/showroom', viewport: { width: 1440, height: 900 } },
  { route: '/showroom?model=commercial-b', viewport: { width: 1440, height: 900 } },
  { route: '/engineering', viewport: { width: 1440, height: 900 } },
  { route: '/teams', viewport: { width: 375, height: 812 } },
  { route: '/drivers', viewport: { width: 375, height: 812 } },
  { route: '/about', viewport: { width: 375, height: 812 } },
];
const results = [];

try {
  for (const item of cases) {
    const context = await browser.newContext({ viewport: item.viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    const failedRequests = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('requestfailed', (request) =>
      failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? null }),
    );
    const response = await page.goto(`${baseUrl}${item.route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await page.waitForTimeout(item.route.includes('commercial-b') ? 8_000 : 2_000);
    const state = await page.evaluate(() => ({
      title: document.title,
      bodyTextLength: document.body.textContent?.trim().length ?? 0,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      graphicsSettings: [...document.querySelectorAll('button')].some((button) =>
        /Graphics Settings|Cài đặt đồ họa/.test(button.textContent ?? ''),
      ),
      canvasCount: document.querySelectorAll('canvas').length,
    }));
    results.push({
      ...item,
      status: response?.status() ?? null,
      pageErrors,
      consoleErrors,
      failedRequests,
      ...state,
    });
    await context.close();
  }
} finally {
  await browser.close();
}

const failures = results.filter(
  (result) =>
    result.status !== 200 ||
    result.pageErrors.length > 0 ||
    result.horizontalOverflow ||
    result.bodyTextLength === 0 ||
    (result.route.includes('commercial-b') && (!result.graphicsSettings || result.canvasCount === 0)),
);
const report = { generatedAt: new Date().toISOString(), baseUrl, results };
fs.mkdirSync('scratch/plan-d', { recursive: true });
fs.writeFileSync('scratch/plan-d/browser-smoke.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
