/**
 * P1.3 — browser capture and live-transform verification.
 *
 * Requires DEV server with the verified local R4.5 Meshopt assets.
 * Does not start Vite, publish binaries, or bypass source checks.
 *
 * Run:
 *   P1_ORIGIN=http://127.0.0.1:5184 \
 *   P1_CHROME=/path/to/chrome \
 *   P1_QA_OUT=/absolute/private/review-folder \
 *   node apps/web/scripts/p1-wheel-visual-qa.mjs
 *
 * Optional:
 *   P1_PROFILES=HIGH,BALANCED,PERFORMANCE
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import process from 'node:process';
import { chromium } from 'playwright-core';

const ROOT_URL = process.env.P1_ORIGIN ?? 'http://127.0.0.1:5184';
const OUT = path.resolve(process.env.P1_QA_OUT ?? path.join(os.tmpdir(), 'peds-p1-3-wheel-qa'));
const PROFILE_SET = (process.env.P1_PROFILES ?? 'BALANCED').split(',').map(s => s.trim()).filter(Boolean);
const ALLOWED_PROFILES = new Set(['HIGH', 'BALANCED', 'PERFORMANCE']);
if (!PROFILE_SET.length || PROFILE_SET.some(p => !ALLOWED_PROFILES.has(p))) {
  throw new Error('P1_PROFILES must be a comma-separated list of HIGH,BALANCED,PERFORMANCE');
}
const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
const CHECKPOINTS = [
  ['hero', 0],
  ['unlock', 0.30],
  ['nut-extracted', 0.4],
  ['wheel-extracted', 0.54],
  ['blueprint', 0.73],
  ['macro', 0.8],
  ['reassembly', 0.96],
  ['fully-assembled', 1],
];
const IDS = [
  'FRONT_LEFT_WHEEL.CENTER_LOCK_NUT',
  'FRONT_LEFT_WHEEL.WHEEL_OUTER',
  'FRONT_LEFT_WHEEL.WHEEL_HUB',
  'FRONT_LEFT_WHEEL.BRAKE_DISC',
  'FRONT_LEFT_WHEEL.BRAKE_CALIPER',
  'FRONT_LEFT_WHEEL.SUSPENSION_LINKS',
  'FRONT_LEFT_WHEEL.HUB_MOUNT_INTERFACE',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const near = (a, b, tolerance = 1e-5) =>
  a.length === b.length && a.every((value, i) => Math.abs(value - b[i]) <= tolerance);

function comparison(a, b, parts = IDS, tolerance = 1e-5) {
  const deltas = {};
  for (const id of parts) {
    if (!a[id] || !b[id]) throw new Error(`Missing scene evidence for ${id}`);
    const fields = ['position', 'quaternion', 'scale', 'worldPosition'];
    const maxima = fields.map(field =>
      Math.max(...a[id][field].map((v, i) => Math.abs(v - b[id][field][i]))),
    );
    deltas[id] = Math.max(...maxima);
  }
  return { max: Math.max(...Object.values(deltas)), deltas,
    pass: Object.values(deltas).every(delta => delta <= tolerance) };
}

async function chromePath() {
  const requested = [process.env.P1_CHROME, process.env.CHROME_PATH].filter(Boolean);
  const candidates = [
    ...requested,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/opt/google/chrome/chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  for (const candidate of candidates) {
    try { await fs.access(candidate); return candidate; } catch { /* Try another installation. */ }
  }
  throw new Error('Chrome/Chromium unavailable. Set P1_CHROME to a real browser executable.');
}

async function seek(page, progress) {
  const current = await page.evaluate(() => window.__PEDS_ITM_P1_STAGE__?.getState());
  assert(current, 'No P1.3 scene evidence API available');
  const previousFrames = current.renderedFrames;
  await page.evaluate(value => window.__PEDS_ITM_P1_CTRL__.setProgress(value), progress);
  await page.waitForFunction(
    ({ p, frames }) => {
      const app = window.__PEDS_ITM_P1_CTRL__;
      const scene = window.__PEDS_ITM_P1_STAGE__;
      return app && scene &&
        Math.abs(scene.getState().progress - p) < 1e-6 &&
        (Math.abs(currentProgress()) < 2 && p === 0 ? scene.getState().renderedFrames >= frames :
          scene.getState().renderedFrames > frames);
      function currentProgress() { return scene?.getState().progress ?? 0; }
    },
    { p: progress, frames: previousFrames },
    { timeout: 10000 },
  );
  await page.waitForTimeout(100);
  return page.evaluate(() => ({
    stage: window.__PEDS_ITM_P1_STAGE__.getState(),
    camera: window.__PEDS_ITM_P1_STAGE__.getCamera(),
    transforms: window.__PEDS_ITM_P1_STAGE__.getTransforms(),
    nutBounds: window.__PEDS_ITM_P1_STAGE__.getBounds('FRONT_LEFT_WHEEL.CENTER_LOCK_NUT'),
    wheelBounds: window.__PEDS_ITM_P1_STAGE__.getBounds('FRONT_LEFT_WHEEL.WHEEL_OUTER'),
    blueprintColor: getComputedStyle(document.querySelector('.itm-p1__shot-label h1')).color,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
  }));
}

function validateFrame(label, frame, scope) {
  const issues = [];
  if (frame.horizontalOverflow) issues.push('horizontal overflow');
  if (Object.keys(frame.transforms).length !== 7) issues.push('incorrect transform count');
  for (const id of IDS) if (!frame.transforms[id]?.finite) issues.push(`nonfinite transform: ${id}`);
  if (label === 'blueprint') {
    if (frame.stage.blueprint < 0.99) issues.push('blueprint did not reach its held state');
    if (frame.blueprintColor !== 'rgb(23, 45, 58)') issues.push('Blueprint title lacks dark-on-light contrast');
  }
  if (scope === 'lock-wheel') {
    // The five unfocused children must remain at their original local transforms.
    for (const id of IDS.slice(2)) {
      if (!frame.transforms[id]) issues.push('missing unfocused child: ' + id);
    }
  }
  return issues;
}

const report = {
  schema: 'peds.itm.p1.3.browser.v1',
  generatedAt: new Date().toISOString(),
  branch: 'feat/engineering-inside-machine-v2',
  source: 'local DEV / verified R4.5 Meshopt GLB',
  origin: ROOT_URL,
  profiles: PROFILE_SET,
  viewports: VIEWPORTS,
  cases: [],
  checks: [],
  errors: [],
  ownerVisualApproval: false,
  note: 'Automated structural PASS is not cinematic visual approval; independent owner score required.',
};
await fs.mkdir(OUT, { recursive: true });
let browser;
try {
  browser = await chromium.launch({
    executablePath: await chromePath(),
    headless: process.env.P1_HEADED !== '1',
    args: ['--no-sandbox', '--enable-webgl', '--use-gl=angle'],
  });
  for (const profile of PROFILE_SET) {
    for (const viewport of VIEWPORTS) {
      const slug = `${profile.toLowerCase()}-${viewport.width}x${viewport.height}`;
      const folder = path.join(OUT, slug);
      const videos = path.join(folder, 'video');
      await fs.mkdir(videos, { recursive: true });
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 1,
        recordVideo: { dir: videos, size: { width: viewport.width, height: viewport.height } },
      });
      const page = await context.newPage();
      const caseInfo = { profile, viewport, screenshots: [], errors: [], checks: [], states: [] };
      const addError = error => caseInfo.errors.push(String(error));
      page.on('pageerror', error => addError(error.message));
      page.on('requestfailed', request => {
        if (/__itm-i2/.test(request.url())) addError(`Verified local asset failed: ${request.url()}`);
      });
      try {
        await page.goto(`${ROOT_URL}/engineering/p1-front-left`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await page.waitForFunction(() =>
          window.__PEDS_ITM_P1_CTRL__?.getUIState().loaded &&
          window.__PEDS_ITM_P1_STAGE__?.getState().renderedFrames > 0,
          undefined, { timeout: 60000 },
        ).catch(async error => {
          const state = await page.evaluate(() => ({
            ui: window.__PEDS_ITM_P1_CTRL__?.getUIState(),
            body: document.body.innerText.slice(0, 600),
          }));
          throw new Error(`Real model loading failed: ${error.message}. State: ${JSON.stringify(state)}`);
        });

        const activeProfile = await page.evaluate(() => window.__PEDS_ITM_P1_CTRL__.getUIState().profile);
        if (activeProfile !== profile) {
          await page.evaluate(value => window.__PEDS_ITM_P1_CTRL__.setProfile(value), profile);
          await page.waitForFunction(p =>
            window.__PEDS_ITM_P1_STAGE__?.getState().profile === p &&
            window.__PEDS_ITM_P1_CTRL__?.getUIState().loaded,
            profile, { timeout: 60000 },
          );
        }
        await page.evaluate(() => window.__PEDS_ITM_P1_CTRL__.setScope('lock-wheel'));

        const timeline = {};
        for (const [label, position] of CHECKPOINTS) {
          const data = await seek(page, position);
          timeline[label] = data;
          caseInfo.states.push({
            label, progress: position, stage: data.stage,
            camera: data.camera, bounds: { nut: data.nutBounds, wheel: data.wheelBounds },
          });
          caseInfo.checks.push({
            label, structuralIssues: validateFrame(label, data, 'lock-wheel'),
          });
          const imagePath = path.join(folder, `${label}.png`);
          await page.screenshot({ path: imagePath, animations: 'disabled' });
          caseInfo.screenshots.push(path.relative(OUT, imagePath));
        }

        const atZero = timeline.hero.transforms;
        const atOne = timeline['fully-assembled'].transforms;
        const reassembly = comparison(atZero, atOne);

        // Check the five inactive source nodes against the assembled baseline.
        const unfocused = comparison(atZero, timeline['wheel-extracted'].transforms, IDS.slice(2));

        await seek(page, 0.54);
        await seek(page, 0.4);
        const reverse = await seek(page, 0);
        const backwards = comparison(atZero, reverse.transforms);

        // Run one full-corner checkpoint to verify both scopes can coexist.
        await page.evaluate(() => window.__PEDS_ITM_P1_CTRL__.setScope('full'));
        const full = await seek(page, 0.54);
        const fullMoved = IDS.slice(2).some(id => !near(
          full.transforms[id].position, atZero[id].position, 1e-4,
        ));
        await page.screenshot({ path: path.join(folder, 'full-seven-part-explode.png') });

        caseInfo.checks.push({
          name: 'roundtrip-0-100-0', pass: reassembly.pass && backwards.pass,
          reassembly, backwards,
        });
        caseInfo.checks.push({ name: 'two-part-isolation', pass: unfocused.pass, unfocused });
        caseInfo.checks.push({ name: 'full-seven-part-regression', pass: fullMoved });
        caseInfo.checks.push({ name: 'source-geometry-canvas', pass: timeline.hero.stage.drawCalls > 0 });
        caseInfo.pass = caseInfo.errors.length === 0 &&
          caseInfo.checks.every(entry =>
            entry.structuralIssues ? entry.structuralIssues.length === 0 : entry.pass,
          );
      } catch (error) {
        addError(error.stack ?? error.message ?? String(error));
        caseInfo.pass = false;
        try { await page.screenshot({ path: path.join(folder, 'FAILURE.png') }); } catch { /* No browser context. */ }
      } finally {
        report.cases.push(caseInfo);
        await context.close();
      }
    }
  }
} catch (error) {
  report.errors.push(String(error.stack ?? error));
} finally {
  await browser?.close();
}
report.functionalPass = report.errors.length === 0 && report.cases.length ===
  PROFILE_SET.length * VIEWPORTS.length && report.cases.every(item => item.pass);
report.releaseApproved = false;
await fs.writeFile(path.join(OUT, 'P1_3_BROWSER_QA.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  functionalPass: report.functionalPass,
  releaseApproved: report.releaseApproved,
  evidenceDirectory: OUT,
  cases: report.cases.map(item => ({
    profile: item.profile, viewport: item.viewport.width, pass: item.pass, errors: item.errors,
  })),
  errors: report.errors,
}, null, 2));
if (!report.functionalPass) process.exitCode = 1;
