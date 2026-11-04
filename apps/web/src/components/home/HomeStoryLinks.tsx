import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { ArrowUpRight, BookOpen, Box, Compass, FlagTriangleRight, Move3d, Shield, Trophy, Users } from 'lucide-react';
import { ENGINEERING_ARTICLES } from '../../data/engineeringArticles';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useReveal } from '../../hooks/useReveal';

export function HomeStoryLinks() {
  const lang = useNavigationStore((state) => state.lang);
  const insideMachineTrialEnabled = import.meta.env.DEV;
  const { ref: exploreRef, isRevealed: exploreRevealed } = useReveal(0.12);
  const { ref: editorialRef, isRevealed: editorialRevealed } = useReveal(0.12);

  const cards = [
    {
      to: '/season/2026?tab=results',
      Icon: FlagTriangleRight,
      tone: 'racing',
      type: lang === 'vi' ? 'Kết quả' : 'Results',
      title: lang === 'vi' ? 'Mọi kết quả. Đã xác minh.' : 'Every result. Verified.',
      copy: lang === 'vi' ? 'Phân loại chặng đua từ dữ liệu giải đấu đã xác minh.' : 'Race classifications from verified championship data.',
      cta: lang === 'vi' ? 'Xem kết quả' : 'Open results',
    },
    {
      to: '/season/2026?tab=standings',
      Icon: Trophy,
      tone: 'racing',
      type: lang === 'vi' ? 'Bảng xếp hạng' : 'Standings',
      title: lang === 'vi' ? 'Cuộc đua danh hiệu.' : 'The title fight.',
      copy: lang === 'vi' ? 'Tay đua và đội đua từ cùng nguồn bảng xếp hạng đã xác minh.' : 'Drivers and constructors from the same verified standings.',
      cta: lang === 'vi' ? 'Xem bảng xếp hạng' : 'View standings',
    },
    {
      to: '/drivers',
      Icon: Users,
      tone: 'slate',
      type: lang === 'vi' ? 'Tay đua' : 'Drivers',
      title: lang === 'vi' ? 'Gặp gỡ các tay đua.' : 'Meet the grid.',
      copy: lang === 'vi' ? 'Hồ sơ và thông số mùa giải của từng tay đua.' : 'Profiles and season numbers for every driver.',
      cta: lang === 'vi' ? 'Khám phá tay đua' : 'Browse drivers',
    },
    {
      to: '/teams',
      Icon: Shield,
      tone: 'slate',
      type: lang === 'vi' ? 'Đội đua' : 'Teams',
      title: lang === 'vi' ? 'Các đội đua.' : 'The constructors.',
      copy: lang === 'vi' ? 'Những đội đua và câu chuyện kỹ thuật phía sau màn trình diễn.' : 'The teams and engineering stories behind the performance.',
      cta: lang === 'vi' ? 'Khám phá đội đua' : 'Browse teams',
    },
    {
      to: '/showroom',
      Icon: Move3d,
      tone: 'showroom',
      type: 'Showroom 3D',
      title: lang === 'vi' ? 'Từng đường nét. Mọi góc nhìn.' : 'Every line. Every angle.',
      copy: lang === 'vi' ? 'Khám phá chiếc xe tham chiếu trong Showroom 3D tương tác.' : 'Explore the reference car in the interactive 3D Showroom.',
      cta: lang === 'vi' ? 'Khám phá 3D' : 'Explore in 3D',
    },
    {
      to: insideMachineTrialEnabled ? '/engineering' : '/engineering/car-anatomy',
      Icon: Box,
      tone: 'engineering',
      type: lang === 'vi' ? 'Kỹ thuật' : 'Engineering',
      title: lang === 'vi' ? 'Giải mã tốc độ.' : 'Anatomy of speed.',
      copy: insideMachineTrialEnabled
        ? lang === 'vi'
          ? 'Đi vào bên trong chiếc xe tham chiếu: hình học, chuyển động và lời giải thích kỹ thuật có kiểm chứng nguồn.'
          : 'Step inside the reference car — geometry, motion and source-checked engineering explanations.'
        : lang === 'vi'
          ? 'Sàn xe, luồng khí và những lựa chọn kỹ thuật — với chú thích giáo dục thận trọng.'
          : 'Floor, airflow and engineering choices — with carefully qualified educational notes.',
      cta: insideMachineTrialEnabled ? 'Inside the Machine' : lang === 'vi' ? 'Giải phẫu xe' : 'Car anatomy',
    },
  ];

  return <>
    <section ref={exploreRef} className="page-container h25-explore h25-reveal" data-revealed={exploreRevealed} aria-labelledby="h25-explore-title">
      <div className="h25-explore__heading">
        <p className="home-section-index"><Compass size={16} aria-hidden="true" /> 04 / {lang === 'vi' ? 'Khám phá' : 'Explore'}</p>
        <h2 id="h25-explore-title" className="home-section-title">{lang === 'vi' ? 'Chọn chặng đường tiếp theo.' : 'Choose your next lap.'}</h2>
        <p className="home-section-copy">{lang === 'vi' ? 'Sáu lối vào giải đấu, showroom 3D và kho kỹ thuật.' : 'Six ways into the championship, the 3D showroom and the engineering archive.'}</p>
      </div>
      <div className="h25-explore__grid">
        {cards.map(({ to, Icon, tone, type, title, copy, cta }) => (
          <Link key={to} to={to} className={`h25-card h25-card--${tone}`}>
            <span className="h25-icon" aria-hidden="true"><Icon size={26} strokeWidth={1.5} /></span>
            <span className="h25-card__body">
              <span className="h25-card__type">{type}</span>
              <strong>{title}</strong>
            </span>
            <span className="h25-card__copy">{copy}</span>
            <span className="h25-card__link">{cta} <ArrowUpRight size={16} aria-hidden="true" /></span>
          </Link>
        ))}
      </div>
    </section>
    <section ref={editorialRef} className="page-container h25-editorial h25-reveal" data-revealed={editorialRevealed} aria-labelledby="h25-editorial-title">
      <div className="h25-editorial__heading">
        <p className="home-section-index"><BookOpen size={16} aria-hidden="true" /> 05 / Editorial</p>
        <h2 id="h25-editorial-title" className="home-section-title">{lang === 'vi' ? 'Đọc sâu hơn.' : 'Go deeper.'}</h2>
        <p className="home-section-copy">{lang === 'vi' ? 'Bài phân tích kỹ thuật đã kiểm tra nguồn; tiếp tục cần biên tập viên duyệt nội dung.' : 'Source-checked technical explainers; editorial human review is still required.'}</p>
      </div>
      <div className="h25-editorial__grid">
        {ENGINEERING_ARTICLES.slice(0, 3).map((article, index) => <Link key={article.slug} to={`/engineering/${article.slug}`} className="h25-editorial__card" style={{ '--h25-stagger': `${index * 90}ms` } as CSSProperties}>
          <span>{String(index + 1).padStart(2, '0')} / {article.topic[lang]}</span>
          <strong>{article.title[lang]}</strong>
          <small>{article.readingMinutes} {lang === 'vi' ? 'phút đọc' : 'min read'} <ArrowUpRight size={15} aria-hidden="true" /></small>
        </Link>)}
      </div>
    </section>
  </>;
}
