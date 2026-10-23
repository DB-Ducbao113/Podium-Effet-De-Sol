import React from 'react';
import { ArrowLeft, ArrowRight, Clock3, ExternalLink, Eye } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import {
  getEngineeringArticle,
  getRelatedEngineeringArticles,
  HOTSPOT_LABELS,
} from '../../data/engineeringArticles';
import { useNavigationStore } from '../../store/useNavigationStore';

export const EngineeringArticlePage: React.FC = () => {
  const { slug } = useParams();
  const lang = useNavigationStore((state) => state.lang);
  const article = getEngineeringArticle(slug);

  if (!article) {
    return (
      <div className="page-container min-h-[65vh] py-24 text-center">
        <p className="font-display text-6xl font-black text-f1red">404</p>
        <h1 className="mt-4 text-2xl font-bold">
          {lang === 'vi' ? 'Không tìm thấy bài viết' : 'Article not found'}
        </h1>
        <Link to="/engineering" className="mt-7 inline-block font-bold text-f1red">
          {lang === 'vi' ? 'Về Engineering Insights' : 'Back to Engineering Insights'}
        </Link>
      </div>
    );
  }

  const related = getRelatedEngineeringArticles(article);

  return (
    <article className="min-h-screen bg-[#090b10] text-white">
      <header className="border-b border-white/10">
        <div className="page-container py-10 md:py-16">
          <Link
            to="/engineering"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" /> Engineering Insights
          </Link>
          <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
                {article.topic[lang]}
              </p>
              <h1
                className={`mt-4 text-balance text-4xl uppercase sm:text-6xl ${
                  lang === 'vi'
                    ? 'font-body font-bold leading-[1.2] tracking-normal'
                    : 'font-display font-black leading-[1.08]'
                }`}
              >
                {article.title[lang]}
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-white/70">
                {article.standfirst[lang]}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-white/70">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4" /> {article.readingMinutes}{' '}
                  {lang === 'vi' ? 'phút đọc' : 'min read'}
                </span>
                <span>Podium EDS Editorial · VI / EN</span>
              </div>
            </div>
            <figure className="overflow-hidden rounded-3xl border border-white/10 bg-black">
              <img src={article.heroImage} alt={article.imageAlt[lang]} className="w-full" />
              <figcaption className="border-t border-white/10 px-5 py-3 text-xs leading-5 text-white/70">
                {article.imageAlt[lang]}
              </figcaption>
            </figure>
          </div>
        </div>
      </header>

      <div className="page-container grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_280px] lg:py-20">
        <div className="max-w-3xl">
          {article.sections.map((section, index) => (
            <section key={section.id} id={section.id} className="mb-16 scroll-mt-24">
              <div className="mb-5 flex items-baseline gap-4">
                <span className="font-mono text-xs text-red-300">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h2
                  className={`text-2xl uppercase sm:text-3xl ${
                    lang === 'vi'
                      ? 'font-body font-bold leading-[1.2] tracking-normal'
                      : 'font-display font-black leading-tight'
                  }`}
                >
                  {section.heading[lang]}
                </h2>
              </div>
              <div className="space-y-5 text-[17px] leading-8 text-white/72">
                {section.paragraphs[lang].map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.045] p-6 sm:p-8">
            <h2 className="font-display text-xl font-black uppercase">
              {lang === 'vi' ? 'Khám phá trên EDS-G01' : 'Explore on EDS-G01'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              {lang === 'vi'
                ? 'Mở trực tiếp hotspot tương ứng trong Showroom. Các mô tả trình bày nguyên lý và ý đồ hình học, không phải dữ liệu thử nghiệm.'
                : 'Open the corresponding hotspot in the Showroom. Descriptions explain principles and geometric intent, not test data.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {article.hotspots.map((hotspot) => (
                <Link
                  key={hotspot}
                  to={`/showroom?hotspot=${hotspot}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-cyan-300/25 bg-black/20 px-4 text-xs font-bold text-cyan-100 hover:bg-cyan-300/10"
                >
                  <Eye className="h-4 w-4" /> {HOTSPOT_LABELS[hotspot]?.[lang] ?? hotspot}
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-12 border-t border-white/10 pt-10">
            <h2 className="font-display text-xl font-black uppercase">
              {lang === 'vi' ? 'Nguồn kỹ thuật' : 'Technical sources'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {lang === 'vi'
                ? 'Nguồn được dùng để kiểm chứng nguyên lý và bối cảnh quy định. Nội dung và sơ đồ của bài viết được biên soạn mới, không sao chép hình minh họa nguồn.'
                : 'Sources support underlying principles and regulatory context. Article text and diagrams were newly authored and do not reproduce source illustrations.'}
            </p>
            <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] px-4 py-3 text-xs leading-5 text-amber-100/75">
              {article.editorialReview.note[lang]} · {article.editorialReview.reviewedOn}
            </p>
            <ul className="mt-5 space-y-3">
              {article.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-start gap-2 text-sm text-cyan-200 hover:underline"
                  >
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" /> {source.title}
                  </a>
                  <p className="ml-6 mt-1 text-xs leading-5 text-white/65">
                    {source.version} · {lang === 'vi' ? 'Truy cập' : 'Accessed'} {source.accessed}.{' '}
                    {source.verification[lang]}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <nav
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
            aria-label={lang === 'vi' ? 'Mục lục bài viết' : 'Article contents'}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/65">
              {lang === 'vi' ? 'Trong bài' : 'In this article'}
            </p>
            <ol className="mt-4 space-y-3">
              {article.sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex gap-3 text-xs leading-5 text-white/75 hover:text-cyan-200"
                  >
                    <span className="font-mono text-red-300">0{index + 1}</span>
                    {section.heading[lang]}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/65">
              {lang === 'vi' ? 'Bài liên quan' : 'Related engineering'}
            </p>
            <div className="mt-4 space-y-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to={`/engineering/${item.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 p-4 text-sm font-bold hover:border-cyan-300/30"
                >
                  {item.title[lang]}
                  <ArrowRight className="h-4 w-4 shrink-0 text-cyan-200 transition group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
};
