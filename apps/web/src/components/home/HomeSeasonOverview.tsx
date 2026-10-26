import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Trophy, Users } from 'lucide-react';
import { getStandings } from '../../data/championship';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useReveal } from '../../hooks/useReveal';

export function HomeSeasonOverview() {
  const lang = useNavigationStore((state) => state.lang);
  const calculated = useChampionshipStore((state) => state.calculatedStandings[2026]);
  const standings = getStandings(2026);
  const driver = (calculated?.drivers ?? standings.drivers)[0];
  const constructor = (calculated?.constructors ?? standings.constructors)[0];
  const { ref, isRevealed } = useReveal(0.2);
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isRevealed || reducedMotion) return;
    let frame = 0;
    let start = 0;
    const step = (time: number) => {
      if (!start) start = time;
      const t = Math.min(1, (time - start) / 850);
      setProgress(1 - (1 - t) ** 3);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [isRevealed, reducedMotion]);

  const shownPoints = (points: number) => reducedMotion || !isRevealed || progress >= 1 ? points : Math.round(points * progress);

  return <section id="championship-overview" ref={ref} className="page-container h25-overview h25-reveal scroll-mt-20" data-revealed={isRevealed} aria-labelledby="h25-overview-title">
    <div className="h25-overview__heading">
      <p className="home-section-index">03 / {lang === 'vi' ? 'Toàn cảnh mùa giải' : 'Season overview'}</p>
      <h2 id="h25-overview-title" className="home-section-title">{lang === 'vi' ? 'Bức tranh 2026.' : 'The 2026 picture.'}</h2>
      <p className="home-section-copy">{lang === 'vi' ? 'Bảng điểm hiện có; dữ liệu đồng bộ mới chỉ xuất hiện sau khi được xác thực.' : 'Available standings; new synchronized results appear only after validation.'}</p>
    </div>
    <div className="h25-overview__leaders">
      <Link to="/season/2026?tab=standings&category=drivers" className="h25-leader">
        <span className="h25-icon" aria-hidden="true"><Trophy size={25} strokeWidth={1.7} /></span>
        <span className="h25-leader__type">{lang === 'vi' ? 'Dẫn đầu tay đua' : 'Driver leader'}</span>
        <strong>{driver?.driverName ?? '—'}</strong>
        <span className="h25-leader__points"><span className="sr-only">{driver ? `${driver.points} ${lang === 'vi' ? 'điểm' : 'points'}` : lang === 'vi' ? 'Chưa có dữ liệu' : 'No data'}</span><span aria-hidden="true">{driver ? shownPoints(driver.points).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB') : '—'} <small>{lang === 'vi' ? 'điểm' : 'pts'}</small></span></span>
        <span className="h25-leader__link">{lang === 'vi' ? 'Bảng tay đua' : 'Driver standings'} <ArrowUpRight size={16} aria-hidden="true" /></span>
      </Link>
      <Link to="/season/2026?tab=standings&category=constructors" className="h25-leader">
        <span className="h25-icon" aria-hidden="true"><Users size={25} strokeWidth={1.7} /></span>
        <span className="h25-leader__type">{lang === 'vi' ? 'Dẫn đầu đội đua' : 'Constructor leader'}</span>
        <strong>{constructor?.teamName ?? '—'}</strong>
        <span className="h25-leader__points"><span className="sr-only">{constructor ? `${constructor.points} ${lang === 'vi' ? 'điểm' : 'points'}` : lang === 'vi' ? 'Chưa có dữ liệu' : 'No data'}</span><span aria-hidden="true">{constructor ? shownPoints(constructor.points).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB') : '—'} <small>{lang === 'vi' ? 'điểm' : 'pts'}</small></span></span>
        <span className="h25-leader__link">{lang === 'vi' ? 'Bảng đội đua' : 'Constructor standings'} <ArrowUpRight size={16} aria-hidden="true" /></span>
      </Link>
    </div>
  </section>;
}
