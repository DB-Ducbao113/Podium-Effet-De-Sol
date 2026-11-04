import { F1HeroStage } from './hero2d/F1HeroStage';
import './homeRacePulseScene.css';

/** Visual-only F1 illustration; the real 3D model stays in Showroom. */
export function HomeRacePulseScene() {
  return (
    <div className="home-pulse home-pulse--f1hero" aria-hidden="true" data-home-hero-visual="f1-2.5d">
      <F1HeroStage />
      <div className="home-pulse__corner home-pulse__corner--a" />
      <div className="home-pulse__corner home-pulse__corner--b" />
    </div>
  );
}
