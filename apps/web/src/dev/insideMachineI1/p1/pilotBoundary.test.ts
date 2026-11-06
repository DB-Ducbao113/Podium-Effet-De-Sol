import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('P1.1 pilot — DEV-only engineering source boundary', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  const page = readFileSync('src/dev/insideMachineI1/p1/P1WheelLookdevPage.tsx', 'utf8');
  const stage = readFileSync('src/dev/insideMachineI1/p1/P1WheelStage.tsx', 'utf8');

  it('is mounted after the DEV gate, preserving existing routes', () => {
    expect(app).toContain('const P1WheelLookdevPage = insideMachineTrialEnabled');
    expect(app).toContain('path="/engineering/p1-front-left"');
    expect(app).toContain('path="/engineering/car-anatomy"');
    expect(app.indexOf('path="/engineering/p1-front-left"')).toBeLessThan(
      app.indexOf('path="/engineering/:slug"'),
    );
    expect(app).toContain('const insideMachineTrialEnabled = import.meta.env.DEV');
  });

  it('does not publish a duplicate or unverified binary path', () => {
    expect(stage).toContain('ASSET_URLS');
    expect(stage).toContain('MANIFEST_URL');
    expect(stage).toContain('MeshoptDecoder');
    expect(stage).not.toContain('/public/models/engineering/');
    expect(stage).not.toContain('model-b-eds-optimized-v1.glb');
  });

  it('uses actual GLB feature angles rather than wireframe triangle edges', () => {
    expect(stage).toContain('new THREE.EdgesGeometry(mesh.geometry, 48)');
    expect(stage).not.toContain('wireframe: true');
    expect(stage).toContain('model.getObjectByName(part.node)');
    expect(stage).toContain('positionFromBaseline');
  });

  it('has accessible scene controls and never auto-starts animation', () => {
    expect(page).toContain('type="range"');
    expect(page).toContain('aria-label={lang');
    expect(page).toContain('aria-pressed={selectedPart === part.id}');
    expect(page).toContain('const [playing, setPlaying] = useState(false)');
    expect(page).toContain('LOOKDEV ONLY / NOT PRODUCTION READY');
  });
});
