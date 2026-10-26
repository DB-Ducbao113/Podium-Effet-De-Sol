import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { ArrowUpRight, BookOpen, Box, FlagTriangleRight } from 'lucide-react';
import { ENGINEERING_ARTICLES } from '../../data/engineeringArticles';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useReveal } from '../../hooks/useReveal';

export function HomeStoryLinks() {
  const lang = useNavigationStore((state) => state.lang);
  const { ref: previewRef, isRevealed: previewRevealed } = useReveal(0.12);
  const { ref: editorialRef, isRevealed: editorialRevealed } = useReveal(0.12);

  return <>
    <section ref={previewRef} className="page-container h25-previews h25-reveal" data-revealed={previewRevealed} aria-label={lang === 'vi' ? 'Khám phá Podium EDS' : 'Explore Podium EDS'}>
      <Link to="/showroom" className="h25-preview h25-preview--racing">
        <span className="h25-icon" aria-hidden="true"><FlagTriangleRight size={28} strokeWidth={1.5} /></span>
        <span className="home-section-index">04 / {lang === 'vi' ? 'Trải nghiệm đua xe' : 'Racing experience'}</span>
        <strong>{lang === 'vi' ? 'Từng đường nét. Mọi góc nhìn.' : 'Every line. Every angle.'}</strong>
        <span>{lang === 'vi' ? 'Khám phá chiếc xe tham chiếu trong Showroom 3D tương tác.' : 'Explore the reference car in the interactive 3D Showroom.'}</span>
        <span className="h25-preview__link">Showroom 3D <ArrowUpRight size={17} aria-hidden="true" /></span>
      </Link>
      <Link to="/engineering/car-anatomy" className="h25-preview h25-preview--engineering">
        <span className="h25-icon" aria-hidden="true"><Box size={28} strokeWidth={1.5} /></span>
        <span className="home-section-index">05 / Engineering</span>
        <strong>{lang === 'vi' ? 'Giải mã tốc độ.' : 'Anatomy of speed.'}</strong>
        <span>{lang === 'vi' ? 'Sàn xe, luồng khí và những lựa chọn kỹ thuật — với chú thích giáo dục thận trọng.' : 'Floor, airflow and engineering choices — with carefully qualified educational notes.'}</span>
        <span className="h25-preview__link">{lang === 'vi' ? 'Giải phẫu xe' : 'Car anatomy'} <ArrowUpRight size={17} aria-hidden="true" /></span>
      </Link>
    </section>
    <section ref={editorialRef} className="page-container h25-editorial h25-reveal" data-revealed={editorialRevealed} aria-labelledby="h25-editorial-title">
      <div className="h25-editorial__heading">
        <p className="home-section-index"><BookOpen size={16} aria-hidden="true" /> 06 / Editorial</p>
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
