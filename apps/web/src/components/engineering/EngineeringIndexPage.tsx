import React from "react";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { ENGINEERING_ARTICLES } from "../../data/engineeringArticles";
import { useNavigationStore } from "../../store/useNavigationStore";

export const EngineeringIndexPage: React.FC = () => {
  const lang = useNavigationStore((state) => state.lang);

  return (
    <div className="peds-engineering-index min-h-screen bg-[#080a0f] text-white">
      <header className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_10%,rgba(82,229,255,0.12),transparent_35%),radial-gradient(circle_at_20%_70%,rgba(239,68,68,0.12),transparent_40%)]" />
        <div className="page-container relative py-20 md:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/5 px-4 py-2 font-ui text-xs font-semibold tracking-wide text-cyan-200">
            <BookOpen className="h-4 w-4" /> Podium EDS Engineering Insights
          </div>
          <h1 className="max-w-5xl font-hand text-4xl font-bold leading-[1.15] text-white sm:text-6xl lg:text-7xl">
            {lang === "vi"
              ? "Kỹ thuật xe đua, giải thích từ nguyên lý"
              : "Race engineering, explained from first principles"}
          </h1>
          <p className="mt-6 max-w-3xl font-body text-base leading-7 text-white/75 md:text-lg">
            {lang === "vi"
              ? "Bốn chuyên đề song ngữ dùng sơ đồ khái niệm để nối khí động học, năng lượng và động lực học xe thành một hệ thống hoàn chỉnh. Các sơ đồ là tài sản gốc của dự án; mọi giới hạn bằng chứng được nêu rõ."
              : "Four bilingual features use conceptual diagrams to connect aerodynamics, energy and vehicle dynamics as one system. Every diagram is project-original and the limits of available evidence are stated explicitly."}
          </p>
        </div>
      </header>

      <div className="page-container py-14 md:py-20">
        {import.meta.env.DEV && (
          <Link
            to="/engineering/inside-the-machine"
            className="mb-4 flex min-h-20 items-center justify-between gap-5 border border-red-500/40 bg-[#12161d] px-6 py-5 text-white transition-colors hover:bg-[#1b222c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
          >
            <span>
              <strong className="block text-xl">
                Inside the Machine · Model B R5 (CAD + Blender + Anime.js)
              </strong>
              <span className="mt-1 block text-sm text-white/75">
                {lang === "vi"
                  ? "Bản dựng lắp ráp R5 tháo/lắp 75 linh kiện theo cuộn trang (chạy local qua `npm run preview:r5`)."
                  : "Exploded R5 assembly (75 semantic controls) driven by Anime.js scroll timeline (launch locally via `npm run preview:r5`)."}
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
          </Link>
        )}
        <Link
          to="/engineering/car-anatomy"
          className="mb-10 flex min-h-20 items-center justify-between gap-5 bg-[#171b21] px-6 py-5 text-white transition-colors hover:bg-[#252c34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
        >
          <span>
            <strong className="block text-xl">
              {lang === "vi"
                ? "Giải phẫu xe đua tương tác"
                : "Interactive race car anatomy"}
            </strong>
            <span className="mt-1 block text-sm text-white/75">
              {lang === "vi"
                ? "Bảy chương kỹ thuật, sơ đồ và góc nhìn Model B trong bản review local."
                : "Seven engineering chapters, diagrams and local-review Model B views."}
            </span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
        </Link>
        <div className="grid gap-7 md:grid-cols-2">
          {ENGINEERING_ARTICLES.map((article, index) => (
            <article
              key={article.slug}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition hover:-translate-y-1 hover:border-cyan-300/30"
            >
              <Link to={`/engineering/${article.slug}`} className="block">
                <div className="aspect-[16/9] overflow-hidden border-b border-white/10 bg-black">
                  <img
                    src={article.heroImage}
                    alt={article.imageAlt[lang]}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-white/70">
                    <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 font-ui text-[11px] font-semibold tracking-wide text-cyan-200">
                      0{index + 1} · {article.topic[lang]}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-white/65">
                      <Clock3 className="h-3.5 w-3.5" />
                      {article.readingMinutes}{" "}
                      {lang === "vi" ? "phút đọc" : "min read"}
                    </span>
                  </div>
                  <h2 className="font-editorial text-2xl font-semibold leading-snug text-white sm:text-[1.8rem]">
                    {article.title[lang]}
                  </h2>
                  <p className="mt-3.5 font-body text-sm leading-6 text-white/75">
                    {article.description[lang]}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 font-ui text-xs font-semibold tracking-wide text-cyan-200">
                    {lang === "vi" ? "Đọc chuyên đề" : "Read feature"}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
