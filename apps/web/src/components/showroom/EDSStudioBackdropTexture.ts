import * as THREE from 'three';
import { EDSLiveryPreset } from '../../data/showroom/edsLiveries';

export type EDSBackdropPanel = 'identity' | 'technical' | 'aero' | 'provenance';

const PANEL_COPY: Record<EDSBackdropPanel, { en: string; vi: string; code: string }> = {
  identity: {
    en: 'ORIGINAL ENGINEERING PROTOTYPE',
    vi: 'NGUYÊN MẪU KỸ THUẬT GỐC',
    code: 'EDS // G01',
  },
  technical: {
    en: 'GROUND EFFECT DEVELOPMENT',
    vi: 'PHÁT TRIỂN HIỆU ỨNG MẶT ĐẤT',
    code: '05.05M // 3.60M WB',
  },
  aero: {
    en: 'FLOW FIELD LABORATORY',
    vi: 'PHÒNG THÍ NGHIỆM DÒNG KHÍ',
    code: 'VENTURI // DELTA FLOOR',
  },
  provenance: {
    en: 'PODIUM EDS AUTHORED ASSET',
    vi: 'TÀI SẢN DO PODIUM EDS TẠO',
    code: 'M2 // PHASE 1',
  },
};

export function createEDSBackdropTexture(
  panel: EDSBackdropPanel,
  livery: EDSLiveryPreset,
  lang: 'vi' | 'en',
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context unavailable for EDS studio backdrop.');

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#070b12');
  gradient.addColorStop(0.58, livery.secondary);
  gradient.addColorStop(1, '#05070a');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = `${livery.accent}44`;
  context.lineWidth = 1;
  for (let x = -canvas.height; x < canvas.width + canvas.height; x += 54) {
    context.beginPath();
    context.moveTo(x, canvas.height);
    context.lineTo(x + canvas.height, 0);
    context.stroke();
  }

  context.strokeStyle = livery.accent;
  context.lineWidth = 5;
  context.strokeRect(42, 42, canvas.width - 84, canvas.height - 84);
  context.fillStyle = livery.accent;
  context.fillRect(42, 42, 210, 12);

  const copy = PANEL_COPY[panel];
  context.fillStyle = '#f8fafc';
  context.font = '900 78px Arial, sans-serif';
  context.fillText('EDS-G01', 72, 205);
  context.font = '700 28px Arial, sans-serif';
  context.fillStyle = livery.accent;
  context.fillText(copy[lang], 76, 260);
  context.font = '600 20px monospace';
  context.fillStyle = '#cbd5e1';
  context.fillText(`${copy.code} // ${livery.name.toUpperCase()}`, 76, 330);
  context.font = '500 15px monospace';
  context.fillStyle = '#94a3b8';
  context.fillText('NO THIRD-PARTY MARKS // PROCEDURAL SOURCE CONTROLLED', 76, 382);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}
