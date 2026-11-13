import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Inside the Machine V2 visual isolation', () => {
  const trial = readFileSync('src/dev/insideMachineI1/InsideMachineTrialPage.tsx', 'utf8');
  const css = readFileSync('src/dev/insideMachineI1/v2-precision.css', 'utf8');
  const app = readFileSync('src/App.tsx', 'utf8');

  it('loads the V2 visual layer after the existing REV4.2 styles', () => {
    expect(trial.indexOf("import './v2-precision.css'")).toBeGreaterThan(
      trial.indexOf("import './ux1.css'"),
    );
    expect(trial).toContain('className="itm-i1 itm-v2"');
  });

  it('keeps the original Engineering route DEV-only', () => {
    expect(app).toContain('const cadFirstLabEnabled = import.meta.env.DEV;');
    expect(app).toContain('const AssemblyPreviewPage = import.meta.env.DEV');
    expect(app).toContain('const CadFirstFullCarScrollPage = import.meta.env.DEV');
    expect(app).toContain('{AssemblyPreviewPage && <Route path="/engineering/assembly-preview"');
    expect(app).toContain('path="/engineering/car-anatomy"');
    expect(app).toContain('path="/engineering/:slug"');
  });

  it('scopes the theme to the engineering feature and respects reduced motion', () => {
    expect(css).toContain('.itm-i1.itm-v2');
    expect(css).toContain('@media(prefers-reduced-motion:reduce)');
    expect(css).toContain('.itm-v2 .precision-hud');
    expect(css).not.toMatch(/(^|\n)\s*(body|html)\s*\{/);
  });

  it('displays real story state, not invented live racing telemetry', () => {
    const hud = readFileSync('src/dev/insideMachineI1/PrecisionHud.tsx', 'utf8');
    expect(hud).toContain('Math.round');
    expect(hud).toContain('beatCount');
    expect(hud).toContain('profile');
    expect(hud).not.toContain('km/h');
  });
});
