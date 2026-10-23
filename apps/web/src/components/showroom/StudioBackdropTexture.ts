import * as THREE from 'three';
import { TeamId } from '../../types';
import { TEAMS_DATA } from '../../data/teams';
import { TEAM_LOGO_SVG_STRINGS, TEAM_BACKDROP_LABEL } from '../../data/showroom/teamLogoSVGs';
import { getTeam3DLivery } from '../../data/showroom/teamLiveries';
import { TEAM_HISTORY_DATA } from '../../data/showroom/teamHistoryStats';

/**
 * Cleanly translates Vietnamese driver role descriptions to English when viewing in EN mode.
 */
export function formatDriverRole(role: string, lang: 'vi' | 'en'): string {
  if (lang === 'vi') return role;
  return role
    .replace(/Nhà Vô Địch Thế Giới/gi, 'World Champion')
    .replace(/Vô Địch Thế Giới/gi, 'World Champion')
    .replace(/Vô Địch cùng/gi, 'Champion with')
    .replace(/Vô Địch/gi, 'Champion')
    .replace(/Chiến Thắng cùng/gi, 'Wins with')
    .replace(/Chiến Thắng GP/gi, 'GP Winner')
    .replace(/Chiến Thắng/gi, 'Victory')
    .replace(/Lãnh Đội/gi, 'Team Leader')
    .replace(/Siêu Tài Năng/gi, 'Rising Star')
    .replace(/Tân Binh/gi, 'Rookie Driver')
    .replace(/Huyền Thoại Trở Lại F1/gi, 'Comeback Legend')
    .replace(/Huyền Thoại Bất Tử F1/gi, 'F1 Immortal Legend')
    .replace(/Huyền thoại thể thao tốc độ/gi, 'Motorsport Legend')
    .replace(/Huyền Thoại Turbo/gi, 'Turbo Legend')
    .replace(/Huyền thoại/gi, 'Legend')
    .replace(/Nhà Sáng Lập & Tay Đua/gi, 'Founder & Driver')
    .replace(/Trụ Cột/gi, 'Core Driver')
    .replace(/Sao Trẻ/gi, 'Young Phenom')
    .replace(/Ra mắt F1 tại/gi, 'F1 Debut with')
    .replace(/Ra mắt F1 cùng/gi, 'F1 Debut with')
    .replace(/Tay đua F1 đầu tiên của/gi, 'First F1 Driver for')
    .replace(/Tay đua đặt nền móng/gi, 'Foundation Driver');
}

/**
 * Formats season tenure cleanly for Vietnamese or English.
 */
export function formatDriverYears(years: string | undefined, lang: 'vi' | 'en'): string {
  if (!years) return '';
  const label = lang === 'vi' ? 'MÙA GIẢI' : 'SEASONS';
  const val = lang === 'vi' ? years : years.replace(/Hiện tại/gi, 'Present');
  return `${label}: ${val}`;
}

/**
 * Safely applies letter-spacing to a 2D canvas context if supported.
 */
function applyLetterSpacing(ctx: CanvasRenderingContext2D, spacing: string): void {
  if ('letterSpacing' in ctx) {
    try {
      (ctx as any).letterSpacing = spacing;
    } catch {
      // Ignored: non-critical aesthetic feature in unsupported environments
    }
  }
}

/**
 * Safely renders multi-line text with word wrapping onto canvas.
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + (line ? ' ' : '') + words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n];
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}

/**
 * 1. NORTH WALL TEXTURE — Official Constructor Premiere Launch Wall
 * High-legibility manufacturer launch display synchronized with VI / EN language.
 */
export function createTeamBackdropTexture(
  teamId: TeamId,
  lang: 'vi' | 'en' = 'vi',
  onLoaded?: () => void,
): THREE.CanvasTexture {
  const WIDTH = 2048;
  const HEIGHT = 1024;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH / 2;
  canvas.height = HEIGHT / 2;
  const ctx = canvas.getContext('2d');
  ctx?.scale(0.5, 0.5);

  const team = TEAMS_DATA[teamId] || TEAMS_DATA.ferrari;
  const label = TEAM_BACKDROP_LABEL[teamId] || {
    headline: team.name.toUpperCase(),
    subtitle: 'FORMULA 1',
  };

  const drawBaseAndTypography = () => {
    if (!ctx) return;

    // Deep Luxury Titanium / Obsidian Exhibition Wall Panel
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0.0, '#1c1e26');
    bgGrad.addColorStop(0.4, '#13141a');
    bgGrad.addColorStop(0.8, '#0d0e13');
    bgGrad.addColorStop(1.0, '#090a0d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle brushed horizontal titanium grain
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    for (let y = 0; y < HEIGHT; y += 4) {
      ctx.fillRect(0, y, WIDTH, 1);
    }

    // Cinematic Diagonal Lighting Sheen
    const sheenGrad = ctx.createLinearGradient(WIDTH * 0.15, 0, WIDTH * 0.85, HEIGHT);
    sheenGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.06)');
    sheenGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.02)');
    sheenGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.15)');
    sheenGrad.addColorStop(1.0, 'transparent');
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle atmospheric ambient halo behind the emblem
    const flareGrad = ctx.createRadialGradient(WIDTH / 2, 280, 20, WIDTH / 2, 280, 480);
    const flareColor = team.accentColor || team.primaryColor || '#ffffff';
    flareGrad.addColorStop(0.0, `${flareColor}28`);
    flareGrad.addColorStop(0.45, `${flareColor}0a`);
    flareGrad.addColorStop(1.0, 'transparent');
    ctx.fillStyle = flareGrad;
    ctx.fillRect(0, 0, WIDTH, 600);

    // Refined Architectural Bevel (Clean luxury edge)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, WIDTH - 72, HEIGHT - 72);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.strokeRect(48, 48, WIDTH - 96, HEIGHT - 96);
    ctx.restore();

    // Top Category Header
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = team.accentColor || '#38bdf8';
    applyLetterSpacing(ctx, '8px');
    const topCategory =
      lang === 'vi'
        ? 'GIẢI ĐUA XE CÔNG THỨC 1 THẾ GIỚI · LỄ RA MẮT ĐỘI ĐUA CHÍNH THỨC'
        : 'FIA FORMULA ONE WORLD CHAMPIONSHIP · OFFICIAL CONSTRUCTOR PREMIERE';
    ctx.fillText(topCategory, WIDTH / 2, 90);

    // Prestigious Manufacturer Typography
    applyLetterSpacing(ctx, '10px');

    // Headline (e.g. "CADILLAC", "MERCEDES-AMG", "SCUDERIA FERRARI")
    ctx.font =
      '900 80px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(label.headline, WIDTH / 2, 595);

    // Subtitle (e.g. "FORMULA 1", "PETRONAS FORMULA ONE")
    applyLetterSpacing(ctx, '14px');
    ctx.font =
      '800 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#E2E8F0';
    const subText = lang === 'vi' ? 'ĐỘI ĐUA CÔNG THỨC 1 CHÍNH THỨC' : label.subtitle;
    ctx.fillText(subText, WIDTH / 2, 690);

    // Dynamic Team Accent Color Underline Bar
    applyLetterSpacing(ctx, '0px');
    const barW = 140;
    const barH = 4;
    ctx.fillStyle = team.accentColor || team.primaryColor || '#d4af37';
    ctx.fillRect(WIDTH / 2 - barW / 2, 745, barW, barH);

    // Bottom Status Line
    ctx.font = '700 18px ui-monospace, SFMono-Regular, monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    const statusText =
      lang === 'vi'
        ? '// HỘI TRƯỜNG TRƯNG BÀY XE ĐUA F1 // QUY CHUẨN KỸ THUẬT 2026 //'
        : '// OFFICIAL CONSTRUCTOR EXHIBITION PAVILION // 2026 SPECIFICATION //';
    ctx.fillText(statusText, WIDTH / 2, 948);
    ctx.restore();
  };

  drawBaseAndTypography();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  texture.needsUpdate = true;

  const rawSvg = TEAM_LOGO_SVG_STRINGS[teamId];
  if (rawSvg && ctx) {
    let preparedSvg = rawSvg.trim();
    if (!preparedSvg.includes('width=')) {
      preparedSvg = preparedSvg.replace('<svg ', '<svg width="400" height="240" ');
    }

    const svgBlob = new Blob([preparedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const URLObj = window.URL || window.webkitURL;
    const blobUrl = URLObj.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      drawBaseAndTypography();

      const aspect =
        img.naturalWidth && img.naturalHeight
          ? img.naturalWidth / img.naturalHeight
          : img.width && img.height
            ? img.width / img.height
            : 360 / 220;

      const maxW = 380;
      const maxH = 220;
      let drawW = maxW;
      let drawH = drawW / aspect;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * aspect;
      }

      const posX = WIDTH / 2 - drawW / 2;
      const posY = 135 + (maxH - drawH) / 2;

      ctx.shadowColor = team.accentColor || '#ffffff';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 4;

      ctx.drawImage(img, posX, posY, drawW, drawH);
      ctx.restore();

      texture.needsUpdate = true;
      URLObj.revokeObjectURL(blobUrl);
      if (onLoaded) onLoaded();
    };

    img.onerror = () => {
      URLObj.revokeObjectURL(blobUrl);
    };

    img.src = blobUrl;
  }

  return texture;
}

/**
 * 2. SOUTH WALL TEXTURE — Machine Technical Dossier Wall
 * Displays full aerodynamics and powertrain technical cards synchronized with VI / EN.
 */
export function createTechnicalBackdropTexture(
  teamId: TeamId,
  lang: 'vi' | 'en' = 'vi',
  onLoaded?: () => void,
): THREE.CanvasTexture {
  const WIDTH = 2048;
  const HEIGHT = 1024;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH / 2;
  canvas.height = HEIGHT / 2;
  const ctx = canvas.getContext('2d');
  ctx?.scale(0.5, 0.5);

  const team = TEAMS_DATA[teamId] || TEAMS_DATA.ferrari;
  const livery = getTeam3DLivery(teamId);

  const drawContent = () => {
    if (!ctx) return;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0.0, '#1a1c24');
    bgGrad.addColorStop(0.5, '#12141a');
    bgGrad.addColorStop(1.0, '#090a0e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle technical grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < WIDTH; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }

    // Outer Bevel Frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, WIDTH - 80, HEIGHT - 80);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Header category
    ctx.font = '800 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = team.accentColor || '#38bdf8';
    applyLetterSpacing(ctx, '8px');
    const topHeader =
      lang === 'vi'
        ? 'GIẢI ĐUA XE CÔNG THỨC 1 THẾ GIỚI · HỒ SƠ KỸ THUẬT 2026'
        : 'FIA FORMULA ONE WORLD CHAMPIONSHIP · 2026 SPECIFICATION';
    ctx.fillText(topHeader, WIDTH / 2, 110);

    // Headline (e.g. W15 E PERFORMANCE, SF-24)
    ctx.font = '900 78px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    applyLetterSpacing(ctx, '6px');
    ctx.fillText(livery.carModelName.toUpperCase(), WIDTH / 2, 215);

    // Subtitle
    ctx.font = '800 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#E2E8F0';
    applyLetterSpacing(ctx, '8px');
    const subText =
      lang === 'vi'
        ? 'KHÍ ĐỘNG HỌC HIỆU ỨNG MẶT ĐẤT & CÔNG NGHỆ KHUNG GẦM'
        : 'AERODYNAMICS & GROUND EFFECT CHASSIS DOSSIER';
    ctx.fillText(subText, WIDTH / 2, 295);

    const accentLineW = 220;
    ctx.fillStyle = team.primaryColor || '#dc0000';
    ctx.fillRect(WIDTH / 2 - accentLineW / 2, 335, accentLineW, 4);

    // 4 High-Legibility Technical Spec Cards
    const cards =
      lang === 'vi'
        ? [
            {
              label: 'HỆ THỐNG ĐỘNG CƠ',
              val: team.powerUnit.split(' ')[0] + ' ' + (team.powerUnit.split(' ')[1] || 'HYBRID'),
            },
            { label: 'TRỤ SỞ HOẠT ĐỘNG', val: team.base },
            { label: 'ĐỘI ĐUA CHỦ QUẢN', val: team.fullName },
            { label: 'QUY CHUẨN LỐP ĐUA', val: 'LỐP 18-INCH PIRELLI P ZERO' },
          ]
        : [
            {
              label: 'POWER UNIT ARCHITECTURE',
              val: team.powerUnit.split(' ')[0] + ' ' + (team.powerUnit.split(' ')[1] || 'HYBRID'),
            },
            { label: 'BASE OF OPERATIONS', val: team.base },
            { label: 'CONSTRUCTOR ENTRY', val: team.fullName },
            { label: 'TIRE REGULATION', val: '18-INCH PIRELLI P ZERO' },
          ];

    const cardW = 450;
    const cardH = 170;
    const gapX = 30;
    const startX = (WIDTH - (4 * cardW + 3 * gapX)) / 2;
    const cardY = 440;

    cards.forEach((card, i) => {
      const cx = startX + i * (cardW + gapX);
      ctx.fillStyle = '#161924';
      ctx.fillRect(cx, cardY, cardW, cardH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx, cardY, cardW, cardH);

      // Card Label (Larger, bright accent color)
      ctx.textAlign = 'left';
      ctx.font = '800 21px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = team.accentColor || '#38bdf8';
      applyLetterSpacing(ctx, '2px');
      ctx.fillText(card.label, cx + 26, cardY + 48);

      // Card Value (Larger, crisp pure white)
      const fontSize = card.val.length > 28 ? '800 20px' : '900 23px';
      ctx.font = `${fontSize} -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      applyLetterSpacing(ctx, '0px');
      ctx.fillText(card.val, cx + 26, cardY + 105);

      // Bottom accent notch
      ctx.fillStyle = team.accentColor || team.primaryColor || '#d4af37';
      ctx.fillRect(cx + 26, cardY + 144, 52, 3);
    });

    // Telemetry Status Line
    ctx.textAlign = 'center';
    ctx.font = '700 18px ui-monospace, SFMono-Regular, monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    const statusText =
      lang === 'vi'
        ? '// DỮ LIỆU TELEMETRY THỜI GIAN THỰC // HIỆU CHUẨN 5600K // TIÊU CHUẨN KIỂM ĐỊNH FIA //'
        : '// TELEMETRY LIVE SYNC // 5600K PHOTOMETRIC CALIBRATION // FIA HOMOLOGATED //';
    ctx.fillText(statusText, WIDTH / 2, 710);
    ctx.restore();
  };

  drawContent();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  texture.needsUpdate = true;

  const rawSvg = TEAM_LOGO_SVG_STRINGS[teamId];
  if (rawSvg && ctx) {
    let preparedSvg = rawSvg.trim();
    if (!preparedSvg.includes('width=')) {
      preparedSvg = preparedSvg.replace('<svg ', '<svg width="240" height="150" ');
    }

    const svgBlob = new Blob([preparedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const URLObj = window.URL || window.webkitURL;
    const blobUrl = URLObj.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      drawContent();

      ctx.save();
      const targetW = 200;
      const targetH = 120;
      const posX = WIDTH / 2 - targetW / 2;
      const posY = 780;

      ctx.drawImage(img, posX, posY, targetW, targetH);
      ctx.restore();

      texture.needsUpdate = true;
      URLObj.revokeObjectURL(blobUrl);
      if (onLoaded) onLoaded();
    };

    img.onerror = () => {
      URLObj.revokeObjectURL(blobUrl);
    };

    img.src = blobUrl;
  }

  return texture;
}

/**
 * 3. WEST WALL — DRIVERS HALL OF FAME TEXTURE
 * Displays the list of famous and current drivers synchronized with VI / EN.
 */
export function createDriversWallTexture(
  teamId: TeamId,
  lang: 'vi' | 'en' = 'vi',
  onLoaded?: () => void,
): THREE.CanvasTexture {
  const WIDTH = 2048;
  const HEIGHT = 1024;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH / 2;
  canvas.height = HEIGHT / 2;
  const ctx = canvas.getContext('2d');
  ctx?.scale(0.5, 0.5);

  const team = TEAMS_DATA[teamId] || TEAMS_DATA.ferrari;
  const history = TEAM_HISTORY_DATA[teamId] || TEAM_HISTORY_DATA.ferrari;

  let logoImage: HTMLImageElement | null = null;

  const drawDrivers = () => {
    if (!ctx) return;

    // Dark luxury titanium / obsidian background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0.0, '#191b22');
    bgGrad.addColorStop(0.4, '#12141a');
    bgGrad.addColorStop(0.8, '#0d0e13');
    bgGrad.addColorStop(1.0, '#08090d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle brushed grain
    ctx.fillStyle = 'rgba(255, 255, 255, 0.012)';
    for (let y = 0; y < HEIGHT; y += 4) {
      ctx.fillRect(0, y, WIDTH, 1);
    }

    // Radial flare behind emblem and title
    const flareGrad = ctx.createRadialGradient(WIDTH / 2, 140, 20, WIDTH / 2, 140, 440);
    const flareColor = team.accentColor || team.primaryColor || '#ffffff';
    flareGrad.addColorStop(0.0, `${flareColor}24`);
    flareGrad.addColorStop(0.5, `${flareColor}08`);
    flareGrad.addColorStop(1.0, 'transparent');
    ctx.fillStyle = flareGrad;
    ctx.fillRect(0, 0, WIDTH, 360);

    // Refined Architectural Bevel Frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, WIDTH - 72, HEIGHT - 72);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.strokeRect(48, 48, WIDTH - 96, HEIGHT - 96);

    // Optional Team Logo Emblem
    if (logoImage) {
      ctx.save();
      const targetW = 180;
      const targetH = 80;
      const posX = WIDTH / 2 - targetW / 2;
      const posY = 52;
      ctx.shadowColor = team.accentColor || '#ffffff';
      ctx.shadowBlur = 18;
      ctx.drawImage(logoImage, posX, posY, targetW, targetH);
      ctx.restore();
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Header category
    ctx.font = '800 22px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = team.accentColor || '#38bdf8';
    applyLetterSpacing(ctx, '6px');
    const topHeader =
      lang === 'vi'
        ? 'DI SẢN ĐỘI ĐUA · ĐỘI HÌNH TAY ĐUA HUYỀN THOẠI'
        : 'CONSTRUCTOR HERITAGE · HISTORIC RACING ROSTER';
    ctx.fillText(topHeader, WIDTH / 2, logoImage ? 148 : 105);

    // Headline
    ctx.font = '900 66px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 16;
    applyLetterSpacing(ctx, '8px');
    const headline =
      lang === 'vi' ? 'BẢNG DANH DỰ CÁC TAY ĐUA // HALL OF FAME' : 'HALL OF FAME // RACING DRIVERS';
    ctx.fillText(headline, WIDTH / 2, logoImage ? 210 : 175);

    // Subtitle
    ctx.font = '700 26px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#E2E8F0';
    ctx.shadowBlur = 0;
    applyLetterSpacing(ctx, '4px');
    const subTitle =
      lang === 'vi'
        ? `${team.fullName.toUpperCase()} · CÁC TAY ĐUA ĐÃ TỪNG THI ĐẤU`
        : `${team.fullName.toUpperCase()} · DRIVERS THROUGH THE AGES`;
    ctx.fillText(subTitle, WIDTH / 2, logoImage ? 262 : 235);

    // Accent Line
    applyLetterSpacing(ctx, '0px');
    ctx.fillStyle = team.primaryColor || '#dc0000';
    ctx.fillRect(WIDTH / 2 - 140, logoImage ? 288 : 265, 280, 4);

    // Grid of 8 Drivers (2 rows of 4 columns)
    const drivers = history.drivers.slice(0, 8);
    const cols = 4;
    const cardW = 435;
    const cardH = 265;
    const gapX = 32;
    const gapY = 26;
    const startX = (WIDTH - (cols * cardW + (cols - 1) * gapX)) / 2;
    const startY = logoImage ? 320 : 300;

    drivers.forEach((driver, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      // Card container
      ctx.fillStyle = driver.isChampion ? 'rgba(212, 175, 55, 0.1)' : '#141722';
      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeStyle = driver.isChampion ? 'rgba(212, 175, 55, 0.5)' : 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = driver.isChampion ? 2 : 1.2;
      ctx.strokeRect(x, y, cardW, cardH);

      // Driver Name (Large, crisp pure white)
      ctx.textAlign = 'left';
      ctx.font = '900 32px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(driver.name, x + 24, y + 54);

      // Champion Star Icon or Badge
      if (driver.isChampion) {
        ctx.fillStyle = '#FCD34D';
        ctx.font = '800 19px sans-serif';
        const champText = lang === 'vi' ? '★ NHÀ VÔ ĐỊCH THẾ GIỚI' : '★ WORLD CHAMPION';
        ctx.fillText(champText, x + 24, y + 104);
      } else {
        ctx.fillStyle = team.accentColor || '#38bdf8';
        ctx.font = '800 19px sans-serif';
        const driverText = lang === 'vi' ? 'TAY ĐUA CHÍNH THỨC' : 'RACE DRIVER';
        ctx.fillText(driverText, x + 24, y + 104);
      }

      // Role Description (High-contrast bright off-white, larger font)
      ctx.font = '700 22px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#F8FAFC';
      const roleText = formatDriverRole(driver.role, lang);
      ctx.fillText(roleText, x + 24, y + 158);

      // Years / Era (Bright silver, high legibility)
      if (driver.years) {
        ctx.font = '700 18px ui-monospace, SFMono-Regular, monospace';
        ctx.fillStyle = '#CBD5E1';
        ctx.fillText(formatDriverYears(driver.years, lang), x + 24, y + 212);
      }

      // Bottom card indicator
      ctx.fillStyle = driver.isChampion ? '#FCD34D' : team.accentColor || '#38bdf8';
      ctx.fillRect(x + 24, y + 238, 54, 3);
    });

    // Bottom Status Line
    ctx.textAlign = 'center';
    ctx.font = '700 18px ui-monospace, SFMono-Regular, monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    const statusText =
      lang === 'vi'
        ? '// LƯU TRỮ CHÍNH THỨC ĐỘI ĐUA // DANH BẠ ĐƯỢC FIA CÔNG NHẬN // TIÊU CHUẨN 2026 //'
        : '// OFFICIAL CONSTRUCTOR ARCHIVE // FIA ACCREDITED ROSTER // 2026 SPECIFICATION //';
    ctx.fillText(statusText, WIDTH / 2, 948);

    ctx.restore();
  };

  drawDrivers();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  texture.needsUpdate = true;

  const rawSvg = TEAM_LOGO_SVG_STRINGS[teamId];
  if (rawSvg && ctx) {
    let preparedSvg = rawSvg.trim();
    if (!preparedSvg.includes('width=')) {
      preparedSvg = preparedSvg.replace('<svg ', '<svg width="240" height="150" ');
    }

    const svgBlob = new Blob([preparedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const URLObj = window.URL || window.webkitURL;
    const blobUrl = URLObj.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      logoImage = img;
      drawDrivers();
      texture.needsUpdate = true;
      URLObj.revokeObjectURL(blobUrl);
      if (onLoaded) onLoaded();
    };

    img.onerror = () => {
      URLObj.revokeObjectURL(blobUrl);
    };

    img.src = blobUrl;
  }

  return texture;
}

/**
 * 4. EAST WALL — ALL-TIME ACHIEVEMENTS & RECORDS TEXTURE
 * Displays all-time constructor stats: Titles, Wins, Poles, Podiums, Fastest Laps.
 * Fully synchronized with VI / EN and crafted with high-contrast, large typography.
 */
export function createAchievementsWallTexture(
  teamId: TeamId,
  lang: 'vi' | 'en' = 'vi',
  onLoaded?: () => void,
): THREE.CanvasTexture {
  const WIDTH = 2048;
  const HEIGHT = 1024;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH / 2;
  canvas.height = HEIGHT / 2;
  const ctx = canvas.getContext('2d');
  ctx?.scale(0.5, 0.5);

  const team = TEAMS_DATA[teamId] || TEAMS_DATA.ferrari;
  const history = TEAM_HISTORY_DATA[teamId] || TEAM_HISTORY_DATA.ferrari;
  const stats = history.stats;

  let logoImage: HTMLImageElement | null = null;

  const drawAchievements = () => {
    if (!ctx) return;

    // Dark luxury titanium / obsidian background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0.0, '#191b22');
    bgGrad.addColorStop(0.4, '#12141a');
    bgGrad.addColorStop(0.8, '#0d0e13');
    bgGrad.addColorStop(1.0, '#08090d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle brushed grain
    ctx.fillStyle = 'rgba(255, 255, 255, 0.012)';
    for (let y = 0; y < HEIGHT; y += 4) {
      ctx.fillRect(0, y, WIDTH, 1);
    }

    // Radial flare behind emblem and title
    const flareGrad = ctx.createRadialGradient(WIDTH / 2, 140, 20, WIDTH / 2, 140, 440);
    const flareColor = team.accentColor || team.primaryColor || '#ffffff';
    flareGrad.addColorStop(0.0, `${flareColor}24`);
    flareGrad.addColorStop(0.5, `${flareColor}08`);
    flareGrad.addColorStop(1.0, 'transparent');
    ctx.fillStyle = flareGrad;
    ctx.fillRect(0, 0, WIDTH, 360);

    // Refined Architectural Bevel Frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, WIDTH - 72, HEIGHT - 72);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.strokeRect(48, 48, WIDTH - 96, HEIGHT - 96);

    // Optional Team Logo Emblem
    if (logoImage) {
      ctx.save();
      const targetW = 180;
      const targetH = 80;
      const posX = WIDTH / 2 - targetW / 2;
      const posY = 52;
      ctx.shadowColor = team.accentColor || '#ffffff';
      ctx.shadowBlur = 18;
      ctx.drawImage(logoImage, posX, posY, targetW, targetH);
      ctx.restore();
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Header category
    ctx.font = '800 22px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = team.accentColor || '#38bdf8';
    applyLetterSpacing(ctx, '6px');
    const topHeader =
      lang === 'vi'
        ? 'GIẢI ĐUA XE CÔNG THỨC 1 THẾ GIỚI · BẢNG VÀNG KỶ LỤC LỊCH SỬ'
        : 'FORMULA 1 WORLD CHAMPIONSHIP · OFFICIAL RECORD BOOKS';
    ctx.fillText(topHeader, WIDTH / 2, logoImage ? 148 : 105);

    // Headline
    ctx.font = '900 66px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 16;
    applyLetterSpacing(ctx, '8px');
    const headline =
      lang === 'vi' ? 'BẢNG VÀNG THÀNH TÍCH TOÀN THỜI GIAN' : 'ALL-TIME CONSTRUCTOR ACHIEVEMENTS';
    ctx.fillText(headline, WIDTH / 2, logoImage ? 210 : 175);

    // Subtitle
    ctx.font = '700 26px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#E2E8F0';
    ctx.shadowBlur = 0;
    applyLetterSpacing(ctx, '4px');
    const subTitle =
      lang === 'vi'
        ? `${team.fullName.toUpperCase()} · BẢNG VÀNG THÀNH TÍCH & DI SẢN`
        : `${team.fullName.toUpperCase()} · HISTORIC RACING LEGACY`;
    ctx.fillText(subTitle, WIDTH / 2, logoImage ? 262 : 235);

    // Accent Line
    applyLetterSpacing(ctx, '0px');
    ctx.fillStyle = team.primaryColor || '#dc0000';
    ctx.fillRect(WIDTH / 2 - 140, logoImage ? 288 : 265, 280, 4);

    // 6 Big Trophy & Record Stat Cards (2 rows of 3 columns)
    const cards =
      lang === 'vi'
        ? [
            {
              icon: '🏆',
              title: 'VÔ ĐỊCH ĐỘI ĐUA',
              sub: 'Constructors World Titles',
              val: String(stats.constructorTitles),
              highlight: stats.constructorTitles > 0,
            },
            {
              icon: '👑',
              title: 'VÔ ĐỊCH TAY ĐUA',
              sub: 'Drivers World Titles',
              val: String(stats.driverTitles),
              highlight: stats.driverTitles > 0,
            },
            {
              icon: '🥇',
              title: 'CHIẾN THẮNG CHẶNG',
              sub: 'Grand Prix Victories',
              val: String(stats.raceWins),
              highlight: stats.raceWins > 0,
            },
            {
              icon: '⏱️',
              title: 'XUẤT PHÁT ĐẦU (POLE)',
              sub: 'P1 Qualifying Starts',
              val: String(stats.polePositions),
              highlight: stats.polePositions > 0,
            },
            {
              icon: '🍾',
              title: 'BỤC NHẬN GIẢI TOP 3',
              sub: 'Podium Finishes',
              val: String(stats.podiums),
              highlight: stats.podiums > 0,
            },
            {
              icon: '⚡',
              title: 'VÒNG ĐUA NHANH NHẤT',
              sub: 'Fastest Race Laps',
              val: String(stats.fastestLaps),
              highlight: stats.fastestLaps > 0,
            },
          ]
        : [
            {
              icon: '🏆',
              title: 'CONSTRUCTORS TITLES',
              sub: 'World Championship Titles',
              val: String(stats.constructorTitles),
              highlight: stats.constructorTitles > 0,
            },
            {
              icon: '👑',
              title: 'DRIVERS TITLES',
              sub: 'World Championship Titles',
              val: String(stats.driverTitles),
              highlight: stats.driverTitles > 0,
            },
            {
              icon: '🥇',
              title: 'GRAND PRIX WINS',
              sub: 'Formula 1 Race Victories',
              val: String(stats.raceWins),
              highlight: stats.raceWins > 0,
            },
            {
              icon: '⏱️',
              title: 'POLE POSITIONS',
              sub: 'P1 Qualifying Starts',
              val: String(stats.polePositions),
              highlight: stats.polePositions > 0,
            },
            {
              icon: '🍾',
              title: 'PODIUM FINISHES',
              sub: 'Top 3 Podium Finishes',
              val: String(stats.podiums),
              highlight: stats.podiums > 0,
            },
            {
              icon: '⚡',
              title: 'FASTEST LAPS',
              sub: 'Fastest Race Laps Recorded',
              val: String(stats.fastestLaps),
              highlight: stats.fastestLaps > 0,
            },
          ];

    const cols = 3;
    const cardW = 580;
    const cardH = 210;
    const gapX = 40;
    const gapY = 26;
    const startX = (WIDTH - (cols * cardW + (cols - 1) * gapX)) / 2;
    const startY = logoImage ? 320 : 305;

    cards.forEach((card, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      // Card Background
      ctx.fillStyle = card.highlight ? 'rgba(212, 175, 55, 0.1)' : '#141724';
      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeStyle = card.highlight ? 'rgba(212, 175, 55, 0.5)' : 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = card.highlight ? 2 : 1.2;
      ctx.strokeRect(x, y, cardW, cardH);

      // Dedicated Top-Right Icon Badge Capsule (prevents ANY text-icon overlap)
      const badgeX = x + cardW - 54;
      const badgeY = y + 54;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, 28, 0, Math.PI * 2);
      ctx.fillStyle = card.highlight ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255, 255, 255, 0.06)';
      ctx.fill();
      ctx.strokeStyle = card.highlight ? 'rgba(212, 175, 55, 0.45)' : 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Centered Icon inside Badge
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '28px sans-serif';
      ctx.fillText(card.icon, badgeX, badgeY + 1);

      // Large Stat Number (Left-aligned, ample space, never collides with icon)
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = '900 82px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = card.highlight ? '#FCD34D' : '#FFFFFF';
      ctx.fillText(card.val, x + 32, y + 84);

      // Title (Primary large label in pure white)
      ctx.font = '800 25px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(card.title, x + 32, y + 130);

      // Subtitle (Secondary label in bright high-contrast silver)
      ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#CBD5E1';
      ctx.fillText(card.sub, x + 32, y + 162);

      // Bottom accent bar
      ctx.fillStyle = card.highlight ? '#FCD34D' : team.accentColor || '#38bdf8';
      ctx.fillRect(x + 32, y + 184, 56, 3);
    });

    // Bottom Heritage Citation Box
    const noteY = logoImage ? 800 : 785;
    const noteW = cols * cardW + (cols - 1) * gapX;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(startX, noteY, noteW, 145);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(startX, noteY, noteW, 145);

    ctx.textAlign = 'left';
    ctx.font = '800 22px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = team.accentColor || '#38bdf8';
    const debutHeader =
      lang === 'vi'
        ? `NĂM RA MẮT F1: ${stats.debutYear} · DI SẢN VĂN HÓA ĐUA XE`
        : `F1 DEBUT: ${stats.debutYear} · RACING HERITAGE & CULTURE`;
    ctx.fillText(debutHeader, startX + 32, noteY + 45);

    // Multi-line safe citation note with high-contrast text
    ctx.font = '600 21px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#F8FAFC';
    const noteText = lang === 'vi' ? stats.heritageNoteVi : stats.heritageNoteEn;
    drawWrappedText(ctx, noteText, startX + 32, noteY + 86, noteW - 64, 30);

    ctx.restore();
  };

  drawAchievements();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  texture.needsUpdate = true;

  const rawSvg = TEAM_LOGO_SVG_STRINGS[teamId];
  if (rawSvg && ctx) {
    let preparedSvg = rawSvg.trim();
    if (!preparedSvg.includes('width=')) {
      preparedSvg = preparedSvg.replace('<svg ', '<svg width="240" height="150" ');
    }

    const svgBlob = new Blob([preparedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const URLObj = window.URL || window.webkitURL;
    const blobUrl = URLObj.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      logoImage = img;
      drawAchievements();
      texture.needsUpdate = true;
      URLObj.revokeObjectURL(blobUrl);
      if (onLoaded) onLoaded();
    };

    img.onerror = () => {
      URLObj.revokeObjectURL(blobUrl);
    };

    img.src = blobUrl;
  }

  return texture;
}
