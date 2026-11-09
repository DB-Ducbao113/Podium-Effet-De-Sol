import { F1HeroStage } from './hero2d/F1HeroStage';
import './homeRacePulseScene.css';

/** One lightweight illustrated F1 key visual. No duplicate Showroom model or WebGL. */
export function HomeRacePulseScene() {
  return (
    <div className="home-pulse home-pulse--f1hero" aria-hidden="true" data-home-hero-visual="f1-2.5d">
      <F1HeroStage />
      <span className="home-pulse__corner home-pulse__corner--a" />
      <span className="home-pulse__corner home-pulse__corner--b" />
    </div>
  );
}
