import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('P1.3 — truthful browser evidence and technical contrast boundary', () => {
  const stage = readFileSync('src/dev/insideMachineI1/p1/P1WheelStage.tsx', 'utf8');
  const page = readFileSync('src/dev/insideMachineI1/p1/P1WheelLookdevPage.tsx', 'utf8');
  const probe = readFileSync('src/dev/insideMachineI1/p1/P1EvidenceProbe.tsx', 'utf8');
  const css = readFileSync('src/dev/insideMachineI1/p1/p1Wheel.css', 'utf8');
  const script = readFileSync('scripts/p1-wheel-visual-qa.mjs', 'utf8');

  it('does not export a browser evidence bridge in production', () => {
    expect(stage).toContain('import.meta.env.DEV &&');
    expect(probe).toContain('if (!import.meta.env.DEV) return');
    expect(page).toContain('if (!import.meta.env.DEV) return');
    expect(probe).toContain('__PEDS_ITM_P1_STAGE__');
    expect(page).toContain('__PEDS_ITM_P1_CTRL__');
  });

  it('records actual 7-part Three.js transforms and camera state', () => {
    expect(probe).toContain('node.getWorldPosition(world)');
    expect(probe).toContain('node.quaternion.toArray()');
    expect(probe).toContain('camera.getWorldDirection(direction)');
    expect(probe).toContain('new THREE.Box3().setFromObject');
    expect(probe).toContain('renderedFrames');
  });

  it('never reports the demand-driven R3F delta as a measured GPU frame time', () => {
    expect(page).toContain('NOT GPU TIME');
    expect(page).not.toContain(' GPU FPS');
  });

  it('uses a distinct technical text treatment for pale Blueprint scenes', () => {
    expect(page).toContain('itm-p1--blueprint');
    expect(page).toContain('data-p1-blueprint');
    expect(css).toContain('.itm-p1--blueprint .itm-p1__shot-label h1');
    expect(css).toContain('color: #172d3a');
  });

  it('captures four widths, 8 checkpoints and refuses a fake visual signoff', () => {
    for (const width of [375, 768, 1440, 1920]) {
      expect(script).toContain(`width: ${width}`);
    }
    for (const key of ['hero','nut-extracted','wheel-extracted','blueprint','macro','fully-assembled']) {
      expect(script).toContain(`'${key}'`);
    }
    expect(script).toContain('report.ownerVisualApproval = false').toBe(false);
    expect(script).toContain('ownerVisualApproval: false');
    expect(script).toContain('report.releaseApproved = false');
    expect(script).toContain('P1_3_BROWSER_QA.json');
    expect(script).toContain('getTransforms()');
  });
});
