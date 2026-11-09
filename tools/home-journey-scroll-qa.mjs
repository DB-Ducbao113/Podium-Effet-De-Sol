/**
 * Real-browser QA for the four pinned Home scroll floors.
 * Run from repo root while the Vite dev server is running:
 *   node tools/home-journey-scroll-qa.mjs
 * Env: PEDS_URL (default http://localhost:5176), CHROME_PATH (Edge/Chrome).
 * Untracked output: .local-assets/home-journey/qa/
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const base = (process.env.PEDS_URL || 'http://localhost:5176').replace(/\/$/, '');
const output = resolve('.local-assets/home-journey/qa');
mkdirSync(output, { recursive: true });
const candidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);
const executablePath = candidates.find((item) => existsSync(item));
const report = { generatedAt: new Date().toISOString(), base, gates: {}, viewports: [], scrub: [], errors: [] };

const smoothstep = (a, b, v) => {
  if (b === a) return v >= b ? 1 : 0;
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

async function openPage(browser, viewport, opts = {}) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, ...opts });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.locator('#launch-control').waitFor({ timeout: 30000 });
  await page.waitForTimeout(1200);
  return { page, errors };
}

async function scrollToProgress(page, id, p) {
  await page.evaluate(({ id, p }) => {
    const frame = document.querySelector(`[data-home-chapter-frame="${id}"]`);
    const section = document.getElementById(id);
    // scrollY and getBoundingClientRect are both visual px under the site's root
    // CSS zoom; offsetHeight/innerHeight are layout px, so stay in rect space.
    const top = frame.getBoundingClientRect().top + window.scrollY;
    const span = frame.getBoundingClientRect().height - section.getBoundingClientRect().height;
    window.scrollTo(0, top + p * span);
  }, { id, p });
  await page.waitForTimeout(900);
}

if (!executablePath) {
  console.error('No Edge/Chrome executable found; set CHROME_PATH.');
  process.exit(1);
}

const browser = await chromium.launch({ headless: true, executablePath });
try {
  // --- Desktop scrub lab at 1440x900 ---
  const { page, errors } = await openPage(browser, { width: 1440, height: 900 });
  const desktop = await page.evaluate(() => {
    const host = document.querySelector('.home-v3');
    const frames = ['launch-control', 'race-control', 'championship-overview', 'eds-explore'].map((id) => {
      const f = document.querySelector(`[data-home-chapter-frame="${id}"]`);
      const cs = getComputedStyle(f);
      return { id, display: cs.display, height: Math.round(f.getBoundingClientRect().height), zIndex: cs.zIndex };
    });
    const section = document.querySelector('[data-home-chapter-frame="race-control"] > section');
    return {
      motion: host?.dataset.homeMotion,
      innerHeight: window.innerHeight,
      frames,
      sticky: section ? getComputedStyle(section).position : 'missing',
      track: Boolean(document.querySelector('.home-rc__track')),
      sessions: document.querySelectorAll('[data-session-row]').length,
      signalGone: !document.querySelector('.home-rc__signal'),
    };
  });
  report.desktop = desktop;
  report.gates.fullQuality = desktop.motion === 'full';
  report.gates.framesPromoted = desktop.frames.every((f) => f.display === 'block' && f.height > desktop.innerHeight);
  report.gates.stickyStage = desktop.sticky === 'sticky';
  report.gates.realCircuit = desktop.track && desktop.sessions >= 5 && desktop.signalGone;

  for (const id of ['race-control', 'championship-overview', 'eds-explore']) {
    for (const p of [0, .25, .5, .75, 1]) {
      await scrollToProgress(page, id, p);
      const sample = await page.evaluate((id) => {
        const frame = document.querySelector(`[data-home-chapter-frame="${id}"]`);
        const progress = Number(frame.style.getPropertyValue('--home-pin-progress'));
        const out = { id, progress };
        if (id === 'race-control') {
          out.dashoffset = Number(document.querySelector('.home-rc__track-draw')?.getAttribute('stroke-dashoffset'));
          out.activeSessions = document.querySelectorAll('[data-session-row][data-scrub-active="true"]').length;
          out.skyTop = frame.querySelector('section')?.style.getPropertyValue('--home-sky-top');
        }
        if (id === 'championship-overview') {
          const bar = document.querySelector('.home-title-fight__scorebar');
          out.barTransform = bar ? getComputedStyle(bar).transform : 'missing';
        }
        if (id === 'eds-explore') {
          out.cardOpacity = Array.from(document.querySelectorAll('.eds-explore__card')).map((c) => Number(getComputedStyle(c).opacity).toFixed(2));
        }
        return out;
      }, id);
      report.scrub.push({ target: p, ...sample });
      if (id === 'race-control') {
        await page.screenshot({ path: resolve(output, `race-p${Math.round(p * 100)}.png`), animations: 'disabled' });
      }
    }
  }
  // scrub assertions
  const raceSamples = report.scrub.filter((s) => s.id === 'race-control');
  report.gates.pinProgressTracks = raceSamples.every((s) => Math.abs(s.progress - s.target) < .02);
  report.gates.lapDraws = raceSamples.every((s) => Math.abs(s.dashoffset - (1 - smoothstep(.12, .92, s.progress))) < .02);
  report.gates.sessionsSequence = raceSamples[0].activeSessions === 0 && raceSamples[4].activeSessions >= 5;
  const exploreEnd = report.scrub.filter((s) => s.id === 'eds-explore').at(-1);
  report.gates.exploreSettlesVisible = exploreEnd.cardOpacity.every((o) => Number(o) > .98);

  // keyboard focus forces explore cards visible even mid-scrub
  await scrollToProgress(page, 'eds-explore', .1);
  await page.locator('.eds-explore__card').first().focus();
  await page.waitForTimeout(200);
  const focusedOpacity = await page.locator('.eds-explore__card').first().evaluate((c) => getComputedStyle(c).opacity);
  report.gates.keyboardReveals = Number(focusedOpacity) > .98;

  // rail navigation lands on the frame, not the inert contents wrapper
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.locator('.home-section-nav button[aria-label="Section 02"]').click();
  await page.waitForTimeout(900);
  const railY = await page.evaluate(() => {
    const f = document.querySelector('[data-home-chapter-frame="race-control"]');
    return Math.round(f.getBoundingClientRect().top);
  });
  report.gates.railNavigates = Math.abs(railY) < 4;
  report.errors.push(...errors);
  await page.close();

  // --- Responsive overflow + quality tiers ---
  for (const size of [
    { width: 360, height: 780 }, { width: 390, height: 844 }, { width: 768, height: 980 },
    { width: 1024, height: 768 }, { width: 1920, height: 1080 },
  ]) {
    const { page, errors } = await openPage(browser, size);
    const info = await page.evaluate(() => ({
      motion: document.querySelector('.home-v3')?.dataset.homeMotion,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      frameDisplay: getComputedStyle(document.querySelector('[data-home-chapter-frame="race-control"]')).display,
      sections: ['launch-control', 'race-control', 'championship-overview', 'eds-explore'].every((id) => document.getElementById(id)),
    }));
    report.viewports.push({ ...size, ...info });
    await page.screenshot({ path: resolve(output, `vp-${size.width}.png`), fullPage: true, animations: 'disabled' });
    report.errors.push(...errors);
    await page.close();
  }
  report.gates.responsiveNoOverflow = report.viewports.every((v) => v.overflow <= 2);
  report.gates.compactLite = report.viewports.filter((v) => v.width <= 850).every((v) => v.motion === 'lite' && v.frameDisplay === 'contents');
  report.gates.wideFull = report.viewports.filter((v) => v.width > 850).every((v) => v.motion === 'full' && v.frameDisplay === 'block');
  report.gates.allSectionsPresent = report.viewports.every((v) => v.sections);

  // --- Reduced motion ---
  const rm = await openPage(browser, { width: 1440, height: 900 }, { reducedMotion: 'reduce' });
  const rmInfo = await rm.page.evaluate(() => ({
    motion: document.querySelector('.home-v3')?.dataset.homeMotion,
    frameDisplay: getComputedStyle(document.querySelector('[data-home-chapter-frame="race-control"]')).display,
    entered: document.getElementById('race-control')?.dataset.homeEntered,
  }));
  report.reducedMotion = rmInfo;
  report.gates.reducedMotionOff = rmInfo.motion === 'off' && rmInfo.frameDisplay === 'contents' && rmInfo.entered === 'true';
  report.errors.push(...rm.errors);
  await rm.page.close();
} finally {
  await browser.close();
}

report.gates.consoleClean = report.errors.length === 0;
report.pass = Object.values(report.gates).every(Boolean);
writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.gates, null, 2));
console.log('PASS:', report.pass);
if (report.errors.length) console.log('ERRORS:', report.errors.slice(0, 10));
process.exitCode = report.pass ? 0 : 1;