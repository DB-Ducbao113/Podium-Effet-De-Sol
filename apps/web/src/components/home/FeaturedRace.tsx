import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useChampionshipStore } from '../../store/useChampionshipStore';

export function FeaturedRace() {
  const lang = useNavigationStore((state) => state.lang);
  const races = useChampionshipStore((state) => state.detailedResults[2026]);
  const syncStatus = useChampionshipStore((state) => state.syncMeta.syncStatus);
  const latest = races?.filter((race) => race.status === 'completed' && !race.isSynthesized)
    .sort((a, b) => b.round - a.round)[0];

  return (
    <section className="page-container home-featured-race h1-reveal" aria-labelledby="home-featured-race-title">
      <div className="home-featured-race__intro">
        <p className="home-section-index">2026 / Championship</p>
        <h2 id="home-featured-race-title" className="home-section-title">
          {lang === 'vi' ? 'Cuộc đua đang được viết tiếp.' : 'The season in motion.'}
        </h2>
        <p className="home-section-copy">
          {lang === 'vi'
            ? 'Kết quả và bảng điểm từ dữ liệu giải đấu hiện có. Mở toàn bộ giải đấu để xem từng chặng.'
            : 'Results and standings from the available championship data. Explore each round in the full championship.'}
        </p>
        <Link className="home-text-link" to="/season/2026">
          {lang === 'vi' ? 'Xem giải đấu' : 'Explore Championship'} <ArrowUpRight aria-hidden="true" size={17} />
        </Link>
      </div>
      <div className="home-featured-race__result" aria-live="polite">
        {latest ? (
          <>
            <span className="home-featured-race__meta">{lang === 'vi' ? 'Chặng đã hoàn thành gần nhất' : 'Latest completed round'} · R{String(latest.round).padStart(2, '0')}</span>
            <h3>{latest.grandPrix}</h3>
            <p className="home-featured-race__circuit">{latest.circuit} · {latest.date}</p>
            <Link className="home-text-link" to={`/season/2026/race/${latest.round}`}>
              {lang === 'vi' ? 'Xem kết quả chặng' : 'View race result'} <ArrowUpRight aria-hidden="true" size={17} />
            </Link>
          </>
        ) : (
          <div role="status" className="home-featured-race__unavailable">
            <span className="home-featured-race__meta">{syncStatus === 'syncing' ? 'DATA / LOADING' : 'DATA / UNAVAILABLE'}</span>
            <h3>{lang === 'vi' ? 'Chưa có kết quả được xác minh.' : 'Verified results are not available yet.'}</h3>
            <p>{lang === 'vi' ? 'Bảng điểm và lịch đua vẫn có thể xem trong Giải đấu.' : 'Standings and the calendar remain available in Championship.'}</p>
          </div>
        )}
      </div>
    </section>
  );
}
