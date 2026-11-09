import './homeCinematicBackground.css';

export type AeroController = { phase: number; pointerX: number; pointerY: number };

/** V8.2: static low-cost atmosphere behind all Home sections. No WebGL on Home. */
export function HomeCinematicBackground() {
  return (
    <div className="home-cinematic home-aerocore" aria-hidden="true" data-home-environment="full-page" data-aerocore-mode="fallback">
      <div className="home-aerocore__aura" />
      <svg className="home-aerocore__carbon-fallback" viewBox="0 0 1000 800" fill="none" role="presentation">
        <defs>
          <linearGradient id="aero-fallback-shell" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#536e82" />
            <stop offset=".28" stopColor="#172937" />
            <stop offset=".67" stopColor="#0d1624" />
            <stop offset="1" stopColor="#3b5368" />
          </linearGradient>
          <linearGradient id="aero-fallback-flow" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#47a8d2" stopOpacity="0" />
            <stop offset=".27" stopColor="#6fdbff" stopOpacity=".85" />
            <stop offset=".52" stopColor="#ff7642" stopOpacity=".96" />
            <stop offset=".85" stopColor="#8fcde8" stopOpacity=".55" />
            <stop offset="1" stopColor="#82cde7" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="aero-fallback-aura">
            <stop stopColor="#fa6235" stopOpacity=".25" />
            <stop offset="1" stopColor="#fa6235" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="580" cy="360" rx="310" ry="295" fill="url(#aero-fallback-aura)" />
        <path d="M65 265 C220 153 379 164 502 284 C629 356 771 201 944 150 L956 238 C775 321 658 426 516 356 C376 259 211 256 78 355 Z" fill="url(#aero-fallback-shell)" stroke="#7baac2" strokeOpacity=".56" strokeWidth="2" />
        <path d="M67 544 C246 627 372 549 509 425 C644 327 774 479 955 590 L933 667 C740 572 623 462 500 517 C345 623 244 684 75 625 Z" fill="url(#aero-fallback-shell)" stroke="#6e91a9" strokeOpacity=".42" strokeWidth="2" />
        <path d="M92 355 C250 256 388 275 509 355 C669 425 774 318 947 235" stroke="#91d8f2" strokeOpacity=".50" strokeWidth="3" />
        <path d="M75 543 C257 629 375 563 509 431 C645 334 756 483 934 590" stroke="#ff8750" strokeOpacity=".53" strokeWidth="3" />
        <g stroke="url(#aero-fallback-flow)" strokeLinecap="round">
          <path d="M-45 364 C202 332 354 401 508 388 S754 356 1040 376" strokeWidth="4" />
          <path d="M-50 393 C194 385 365 405 510 398 S744 406 1040 443" strokeWidth="2" />
          <path d="M-50 427 C200 459 364 431 510 410 S746 461 1030 506" strokeWidth="3" />
          <path d="M-30 337 C210 304 340 388 505 379 S749 307 1025 324" strokeWidth="1.5" />
          <path d="M-30 466 C220 498 350 465 512 422 S756 503 1015 548" strokeWidth="1.5" />
        </g>
      </svg>
      <div className="home-aerocore__vignette" />
    </div>
  );
}
