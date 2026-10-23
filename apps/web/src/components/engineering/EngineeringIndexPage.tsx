import React from 'react';
import { ArrowRight, BookOpen, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ENGINEERING_ARTICLES } from '../../data/engineeringArticles';
import { useNavigationStore } from '../../store/useNavigationStore';

export const EngineeringIndexPage: React.FC = () => {
  const lang = useNavigationStore((state) => state.lang);

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <header className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_10%,rgba(82,229,255,0.12),transparent_35%),radial-gradient(circle_at_20%_70%,rgba(239,68,68,0.12),transparent_40%)]" />
        <div className="page-container relative py-20 md:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
            <BookOpen className="h-4 w-4" /> Podium EDS Engineering Insights
          </div>
          <h1
            className={`max-w-5xl uppercase text-4xl sm:text-6xl lg:text-7xl ${
              lang === 'vi'
                ? 'font-body font-bold leading-[1.2] tracking-normal'
                : 'font-display font-black leading-[1.08] tracking-tight'
            }`}
          >
            {lang === 'vi'
              ? 'Kỹ thuật xe đua, giải thích từ nguyên lý'
              : 'Race engineering, explained from first principles'}
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-7 text-white/65 md:text-lg">
            {lang === 'vi'
              ? 'Bốn chuyên đề song ngữ dùng nguyên mẫu EDS-G01 để nối khí động học, năng lượng và động lực học xe thành một hệ thống hoàn chỉnh. Các sơ đồ là tài sản gốc của dự án; mọi giới hạn bằng chứng được nêu rõ.'
              : 'Four bilingual features use the EDS-G01 prototype to connect aerodynamics, energy and vehicle dynamics as one system. Every diagram is project-original and the limits of available evidence are stated explicitly.'}
          </p>
        </div>
      </header>

      <main className="page-container py-14 md:py-20">
        <div className="grid gap-7 md:grid-cols-2">
          {ENGINEERING_ARTICLES.map((article, index) => (
            <article
              key={article.slug}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition hover:-translate-y-1 hover:border-cyan-300/30"
            >
              <Link to={`/engineering/${article.slug}`} className="block">
                <div className="relative aspect-[16/9] overflow-hidden border-b border-white/10 bg-black">
                  <img
                    src={article.heroImage}
                    alt={article.imageAlt[lang]}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                  />
                  <span className="absolute right-5 top-5 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-200 backdrop-blur">
                    0{index + 1} · {article.topic[lang]}
                  </span>
                </div>
                <div className="p-6 sm:p-8">
                  <div className="mb-4 flex items-center gap-2 text-xs text-white/70">
                    <Clock3 className="h-4 w-4" />
                    {article.readingMinutes} {lang === 'vi' ? 'phút đọc' : 'min read'}
                  </div>
                  <h2
                    className={`text-2xl uppercase text-white sm:text-3xl ${
                      lang === 'vi'
                        ? 'font-body font-bold leading-[1.2] tracking-normal'
                        : 'font-display font-black leading-tight'
                    }`}
                  >
                    {article.title[lang]}
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-white/70">
                    {article.description[lang]}
                  </p>
                  <span className="mt-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-200">
                    {lang === 'vi' ? 'Đọc chuyên đề' : 'Read feature'}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};
