import './homeRacePulseScene.css';

/** Decorative telemetry aperture, sharing the Home AEROCORE world. No road or second Canvas. */
export function HomeRacePulseScene() {
  return (
    <div className="home-pulse home-pulse--aerocore" aria-hidden="true" data-home-hero-visual="aerocore">
      <div className="home-pulse__reticle"><span /><span /><span /></div>
      <div className="home-pulse__axis" />
      <span className="home-pulse__corner home-pulse__corner--a" />
      <span className="home-pulse__corner home-pulse__corner--b" />
      <span className="home-pulse__ident home-pulse__ident--top">AEROCORE / FIELD 01</span>
      <span className="home-pulse__ident home-pulse__ident--bottom">THE INVISIBLE FORCE · PEDS</span>
    </div>
  );
}
