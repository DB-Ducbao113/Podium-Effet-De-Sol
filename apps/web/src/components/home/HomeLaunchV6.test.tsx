import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HomeLaunchEnvironment } from './HomeLaunchEnvironment';

const root = 'src/components/home';
const stageSource = readFileSync(`${root}/HomeModelBStage.tsx`, 'utf8');
const environmentSource = readFileSync(`${root}/HomeTrackEnvironment3D.tsx`, 'utf8');
const hudSource = readFileSync(`${root}/HomeHudScene.tsx`, 'utf8');
const heroSource = readFileSync(`${root}/PodiumBrandHero.tsx`, 'utf8');

describe('Homepage Launch Corridor V6', () => {
  it('renders an image-free decorative corridor without a second Canvas', () => {
    const html = renderToStaticMarkup(<HomeLaunchEnvironment />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('launch-env__tunnel');
    expect(html).toContain('launch-env__track');
    expect(html).toContain('launch-env__speedfield');
    expect((html.match(/class="launch-env__rib"/g) ?? []).length).toBe(6);
    expect(html).not.toMatch(/<canvas|<img|<video|<picture/i);
  });

  it('adds real 3D geometry inside the existing Model B Canvas', () => {
    expect(heroSource).toContain('<HomeLaunchEnvironment />');
    expect(heroSource).toContain('r1-cinema--v6');
    expect(stageSource).toContain('<HomeTrackEnvironment3D mode={mode} reducedMotion={reducedMotion} />');
    expect((stageSource.match(/<Canvas\b/g) ?? []).length).toBe(1);
    expect(environmentSource).toContain('<planeGeometry');
    expect(environmentSource).toContain('<instancedMesh');
    expect(environmentSource).toContain('meshStandardMaterial');
    expect(environmentSource).not.toContain('<Canvas');
    expect(environmentSource).not.toMatch(/reflector|effectComposer|bloom|shaderMaterial|shadowMap|useFrame/);
    expect(stageSource).toContain('frameloop="demand"');
    expect(stageSource).toContain('dpr={[1, 1.35]}');
  });

  it('keeps original Model B and retired EDS-G01 isolation', () => {
    expect(stageSource).toContain("loadModelB");
    expect(stageSource).toContain("applyModelBLivery");
    expect(stageSource).not.toContain('eds-g01');
    expect(heroSource).not.toContain('hero-h3-2.mp4');
    expect(heroSource).not.toMatch(/<video|<picture|<img/);
    expect(hudSource).toContain('enabled && wasVisible');
  });
});
