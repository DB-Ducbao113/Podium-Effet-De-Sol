import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Activity, CircuitBoard, Gauge } from 'lucide-react';

type Mode = 'aero' | 'chassis' | 'power';

const modes = [
  { id: 'aero', en: 'AERO', vi: 'KHÍ ĐỘNG', Icon: Activity },
  { id: 'chassis', en: 'CHASSIS', vi: 'KHUNG XE', Icon: CircuitBoard },
  { id: 'power', en: 'POWER', vi: 'ĐỘNG LỰC', Icon: Gauge },
] as const;

export function HomeHudScene({ lang }: { lang: 'vi' | 'en' }) {
  const [mode, setMode] = useState<Mode>('aero');
  return (
    <div className="launch-hud" data-mode={mode}>
      <div className="launch-hud__topline" aria-hidden="true">
        <span className="launch-hud__signal"><i /> EDS / SYSTEM ONLINE</span>
        <span>LC — 01 / 2026</span>
      </div>
      <div className="launch-hud__viewport">
        <div className="launch-hud__orbital" aria-hidden="true" />
        <div className="launch-hud__scan" aria-hidden="true" />
        <svg
          className="launch-hud__vehicle"
          viewBox="0 0 1000 570"
          role="img"
          aria-label={lang === 'vi' ? 'Minh họa xe đua nhìn từ trên xuống với các nhóm cấu trúc được tô sáng tùy chế độ' : 'Original top-view concept race car highlighting selectable technical systems'}
        >
          <defs>
            <pattern id="hud-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="#A0C1CF" strokeOpacity=".07" strokeWidth="1" />
            </pattern>
            <linearGradient id="hud-carbon" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#172839" />
              <stop offset=".48" stopColor="#070E18" />
              <stop offset="1" stopColor="#284259" />
            </linearGradient>
            <linearGradient id="hud-orange" x1="0" x2="1" y1="0" y2=".3">
              <stop offset="0" stopColor="#FC3519" />
              <stop offset=".56" stopColor="#FF8754" />
              <stop offset="1" stopColor="#FF3418" />
            </linearGradient>
            <linearGradient id="hud-ice" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#B4ECFF" />
              <stop offset="1" stopColor="#39758F" />
            </linearGradient>
          </defs>

          <rect width="1000" height="570" fill="url(#hud-grid)" />
          <g className="launch-hud__rings" fill="none" stroke="#7396AE">
            <circle cx="503" cy="285" r="237" strokeOpacity=".17" />
            <circle cx="503" cy="285" r="189" strokeOpacity=".19" strokeDasharray="2 11" />
            <circle cx="503" cy="285" r="130" strokeOpacity=".13" />
            <path d="M500 15V555M32 285H965" strokeOpacity=".15" strokeDasharray="5 18" />
            <path d="M735 78h82v38M735 495h82v-38M270 78h-82v38M270 495h-82v-38" strokeOpacity=".35" />
          </g>

          {/* Abstract technical illustration; not a real-car scan or physical specification. */}
          <g className="launch-hud__car" transform="translate(0 2)">
            <g className="launch-hud__wheels">
              <rect x="274" y="108" width="110" height="118" rx="20" />
              <rect x="274" y="344" width="110" height="118" rx="20" />
              <rect x="737" y="114" width="126" height="112" rx="19" />
              <rect x="737" y="344" width="126" height="112" rx="19" />
              <g className="launch-hud__wheel-detail" fill="none">
                <path d="M290 135h80m-80 14h80m-80 14h80m-80 14h80m-80 14h80m-80 14h80M753 140h92m-92 17h92m-92 17h92m-92 17h92m-92 17h92" />
                <path d="M290 372h80m-80 14h80m-80 14h80m-80 14h80m-80 14h80m-80 14h80M753 370h92m-92 17h92m-92 17h92m-92 17h92m-92 17h92" />
              </g>
            </g>

            <g className="launch-hud__chassis">
              <path className="launch-hud__core" d="M118 285L183 273l80-14 103-20 79 6 58-42 95 15 55 25 98 6 38 36-38 36-98 6-55 25-95 15-58-42-79 6-103-20-80-14Z" />
              <path d="M216 259L335 229 457 237M216 311l119 30 122-8M450 245l50-42 98 15 53 25M450 325l50 42 98-15 53-25" fill="none" />
              <path d="M257 255L257 315M389 236L389 334M660 244L660 326" fill="none" strokeDasharray="5 8" />
              <path d="M470 272l36-25h93l22 38-22 38h-93l-36-25Z" className="launch-hud__cockpit" />
              <path d="M505 250q-32 33 0 70M583 250q32 33 0 70" className="launch-hud__halo" fill="none" />
              <path d="M620 258L712 262l36 23-36 23-92 4Z" className="launch-hud__engine" />
              <path d="M627 285h102M651 273l57 12-57 12M670 262v46" className="launch-hud__power-lines" fill="none" />
            </g>

            <g className="launch-hud__aero">
              <path d="M127 190H313l21 34-53 21H127Z M127 380H313l21-34-53-21H127Z" />
              <path d="M131 218h150l35 21M131 353h150l35-21" fill="none" />
              <path d="M826 201H915v168h-89l-22-34V235Z" />
              <path d="M849 217v136M879 216v137M909 209v151" fill="none" />
              <path d="M341 228l74-30 50 43M341 342l74 30 50-43M628 239l91-34 33 26M628 331l91 34 33-26" fill="none" />
              <path d="M226 223l36-26M226 347l36 26M735 238l24-19M735 332l24 19" fill="none" strokeDasharray="3 6" />
            </g>

            <g className="launch-hud__aero-streams" fill="none">
              <path d="M40 177C230 128 410 130 555 158S818 156 974 100" />
              <path d="M22 218C209 190 402 196 562 218S829 205 980 154" />
              <path d="M25 348C225 387 405 380 558 353S820 372 977 422" />
              <path d="M40 394C240 453 416 436 550 411S827 444 974 486" />
            </g>

            <g className="launch-hud__annotations" fill="none">
              <path d="M294 129L225 73H135M555 197l57-92h109M758 339l78 80h105" />
              <circle cx="294" cy="129" r="4" />
              <circle cx="555" cy="197" r="4" />
              <circle cx="758" cy="339" r="4" />
            </g>
          </g>
          <text x="120" y="65" className="launch-hud__svg-label">FRONT AERO</text>
          <text x="610" y="90" className="launch-hud__svg-label">CORE SYSTEM</text>
          <text x="833" y="440" className="launch-hud__svg-label">REAR ASSEMBLY</text>
          <text x="48" y="535" className="launch-hud__svg-index">EDS / TECHNICAL CONCEPT — NOT TO SCALE</text>
        </svg>
        <span className="launch-hud__reticle launch-hud__reticle--tl" aria-hidden="true" />
        <span className="launch-hud__reticle launch-hud__reticle--br" aria-hidden="true" />
      </div>
      <div className="launch-hud__controls" aria-label={lang === 'vi' ? 'Chọn lớp minh họa kỹ thuật' : 'Choose technical concept layer'}>
        <span className="launch-hud__control-caption">{lang === 'vi' ? 'LỚP HIỂN THỊ' : 'DISPLAY LAYER'}</span>
        <div className="launch-hud__mode-list" role="group" aria-label={lang === 'vi' ? 'Chọn hệ thống xe' : 'Vehicle system'}>
          {modes.map(({ id, en, vi, Icon }, i) => (
            <button
              key={id}
              type="button"
              className="launch-hud__mode"
              data-active={id === mode}
              aria-pressed={id === mode}
              onClick={() => setMode(id)}
              style={{ '--hud-order': i } as CSSProperties}
            >
              <Icon size={15} aria-hidden="true" />
              {lang === 'vi' ? vi : en}
            </button>
          ))}
        </div>
        <span className="launch-hud__current" aria-live="polite">{mode.toUpperCase()} / 0{modes.findIndex((entry) => entry.id === mode) + 1}</span>
      </div>
    </div>
  );
}
