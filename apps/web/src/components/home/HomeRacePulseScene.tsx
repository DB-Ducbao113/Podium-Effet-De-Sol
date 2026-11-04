import './homeRacePulseScene.css';

/** Quiet engineering annotations: inlet -> pressure throat -> diffuser. No track/car. */
export function HomeRacePulseScene() {
  return (
    <div className="home-pulse home-pulse--aerocore" aria-hidden="true" data-home-hero-visual="aerocore">
      <div className="home-pulse__flow-labels">
        <span><i />01 / INLET</span>
        <span><i />02 / THROAT</span>
        <span><i />03 / DIFFUSER</span>
      </div>
      <div className="home-pulse__scanline" />
      <span className="home-pulse__corner home-pulse__corner--a" />
      <span className="home-pulse__corner home-pulse__corner--b" />
      <span className="home-pulse__ident home-pulse__ident--top">GROUND EFFECT / FORM STUDY</span>
      <span className="home-pulse__ident home-pulse__ident--bottom">AEROCORE · PEDS / 08</span>
    </div>
  );
}
