import './homeRacePulseScene.css';

/**
 * Home hero visual = the sensation of speed / race start, not a vehicle model.
 * Scalable vectors and CSS perspective work even with WebGL disabled.
 * The same racing line continues through HomeCinematicBackground below.
 */
export function HomeRacePulseScene() {
  return (
    <div className="home-pulse" aria-hidden="true" data-home-hero-visual="race-energy">
      <div className="home-pulse__horizon" />
      <div className="home-pulse__tunnel">
        <span /><span /><span /><span /><span />
      </div>
      <div className="home-pulse__ground">
        <span className="home-pulse__kerb home-pulse__kerb--left" />
        <span className="home-pulse__kerb home-pulse__kerb--right" />
        <span className="home-pulse__grid" />
      </div>
      <svg className="home-pulse__trajectory" viewBox="0 0 920 490" preserveAspectRatio="xMidYMid meet" fill="none">
        <defs>
          <linearGradient id="home-pulse-ignition" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#FF4A18" stopOpacity="0" />
            <stop offset=".3" stopColor="#FF4A18" stopOpacity=".94" />
            <stop offset=".67" stopColor="#FFC08B" stopOpacity=".86" />
            <stop offset="1" stopColor="#FF4A18" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="home-pulse__path-shadow" d="M-60 423 C160 380 211 462 382 308 S652 204 782 109 S903 91 988 36" />
        <path className="home-pulse__path-base" d="M-60 423 C160 380 211 462 382 308 S652 204 782 109 S903 91 988 36" />
        <path className="home-pulse__path-runner" d="M-60 423 C160 380 211 462 382 308 S652 204 782 109 S903 91 988 36" />
        <path className="home-pulse__path-secondary" d="M-60 448 C173 412 255 465 407 334 S665 229 798 135 S915 114 982 69" />
        <path className="home-pulse__path-crosshair" d="M490 210v-29m-15 15h30M755 107v-22m-11 11h22" />
        <circle cx="490" cy="196" r="33" className="home-pulse__orbit" />
        <circle cx="490" cy="196" r="50" className="home-pulse__orbit home-pulse__orbit--outer" />
      </svg>
      <div className="home-pulse__lights">
        {Array.from({ length: 5 }, (_, i) => <span key={i} />)}
      </div>
      <span className="home-pulse__corner home-pulse__corner--a" />
      <span className="home-pulse__corner home-pulse__corner--b" />
      <span className="home-pulse__ident home-pulse__ident--top">LAUNCH / 01</span>
      <span className="home-pulse__ident home-pulse__ident--bottom">RACE ENERGY · 2026</span>
    </div>
  );
}
