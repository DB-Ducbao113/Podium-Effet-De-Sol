import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/showroom/ModelBShowroom.tsx', 'utf8');

describe('Model B simplified showroom layout contract', () => {
  it('uses the compact V2 shell with graphics, anatomy and metrics in separate slots', () => {
    expect(source).toContain('<CompactShowroomLayout');
    expect(source).toContain('anatomyPanel={(');
    expect(source).toContain('graphicsPanel={(');
    expect(source).toContain('specificationsPanel={(');
    expect(source).toContain('<GraphicsSettings lang={lang}');
    expect(source).toContain('MODEL_B_HOTSPOTS.map');
    expect(source).not.toContain('<aside className=');
    expect(source).not.toContain('settingsOpen');
  });

  it('keeps one camera and zoom dock within the stage', () => {
    expect(source).toContain('data-testid="commercial-b-stage"');
    expect(source).toContain('cameraControls={modelLoaded');
    expect(source.match(/CAMERA_PRESETS\.map/g)).toHaveLength(1);
    expect(source.match(/Zoom \+/g)).toHaveLength(1);
    expect(source.match(/Zoom −/g)).toHaveLength(1);
    expect(source).not.toContain('rollbackToEds');
  });

  it('retains the paint picker and model attribution', () => {
    expect(source).toContain('MODEL_B_LIVERIES.map');
    expect(source).toContain('readModelBPaint(getModelBPaintStorage())');
    expect(source).toContain('Luis Adrian V.');
    expect(source).toContain('CC BY 4.0');
  });
});
