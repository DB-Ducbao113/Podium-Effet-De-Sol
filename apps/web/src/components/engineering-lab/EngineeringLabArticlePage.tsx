import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Cpu,
  ExternalLink,
  Eye,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  HOTSPOT_LABELS,
  getRelatedEngineeringArticles,
} from "../../data/engineeringArticles";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useNavigationStore } from "../../store/useNavigationStore";
import {
  ARTICLE_TO_LAB_MODE,
  ENG_LAB_BASE_PATH,
  buildEngineeringLabArticleHref,
  buildEngineeringLabHref,
  resolveSandboxEngineeringArticle,
} from "./engineeringLabRoutes";
import { EngineeringLabSchematic2D } from "./EngineeringLabSchematic2D";
import { EngineeringLabShell } from "./EngineeringLabShell";

export const EngineeringLabArticlePage: React.FC = () => {
  const { slug } = useParams();
  const lang = useNavigationStore((s) => s.lang);
  const setLang = useNavigationStore((s) => s.setLang);
  const reducedMotion = useReducedMotion();
  const isVi = lang === "vi";
  const article = resolveSandboxEngineeringArticle(slug);
  const articleRef = useRef<HTMLElement>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [diagramMode, setDiagramMode] = useState<"interactive" | "authored">(
    "interactive",
  );

  useEffect(() => {
    const updateProgress = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight || 800;
      const total = Math.max(1, rect.height - viewport * 0.65);
      const ratio = Math.max(0, Math.min(1, -rect.top / total));
      setReadingProgress(ratio);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [slug]);

  if (!article) {
    return (
      <EngineeringLabShell
        title={
          isVi
            ? "404 · Không tìm thấy chuyên đề | Podium EDS"
            : "404 · Dossier Not Found | Podium EDS"
        }
        description="Requested engineering dossier was not found."
      >
        <div
          className="peds-eng-lux-container flex min-h-[calc(72svh_/_var(--peds-visual-zoom))] flex-col items-center justify-center py-32 text-center"
          data-testid="eng-lab-article-404"
        >
          <p className="peds-eng-lux-mono text-xs text-[#FF4938]">
            ERR_ARTICLE_NOT_FOUND · 404
          </p>
          <h1 className="peds-eng-lux-display-title mt-4 text-4xl sm:text-6xl">
            {isVi
              ? "Không tìm thấy chuyên đề kỹ thuật"
              : "Technical Dossier Not Found"}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-[#A7B2C2]">
            {isVi
              ? "Đường dẫn bài viết không tồn tại trong hệ thống Podium EDS Engineering Division."
              : "The requested engineering article slug does not exist in Podium EDS Engineering Division."}
          </p>
          <Link to={ENG_LAB_BASE_PATH} className="peds-eng-lux-cta-primary mt-8">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>
              {isVi
                ? "Về trang tổng Engineering"
                : "Back to Engineering Experience"}
            </span>
          </Link>
        </div>
      </EngineeringLabShell>
    );
  }

  const related = getRelatedEngineeringArticles(article);
  const mappedLabMode = ARTICLE_TO_LAB_MODE[article.slug] ?? "active-aero";

  return (
    <EngineeringLabShell
      title={`${article.title[lang]} (Sandbox) | Podium EDS`}
      description={article.description[lang]}
    >
      {/* Reading Progress Bar (REQ-19) */}
      <div
        className="peds-eng-lux-reading-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(readingProgress * 100)}
        aria-label={
          isVi
            ? "Tiến trình đọc bài kỹ thuật"
            : "Technical article reading progress"
        }
        data-testid="eng-lab-reading-progress"
      >
        <div
          className="peds-eng-lux-reading-progress__fill"
          style={{ transform: `scaleX(${readingProgress.toFixed(3)})` }}
        />
      </div>

      <article
        ref={articleRef}
        className="pt-24"
        data-testid="eng-lab-article-view"
      >
        <header className="border-b border-[#202730] bg-[#11151B] py-12 md:py-20">
          <div className="peds-eng-lux-container">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link
                to={ENG_LAB_BASE_PATH}
                className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A7B2C2] hover:text-[#00D9F5]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>
                  {isVi ? "Về Engineering Division" : "Engineering Division"}
                </span>
              </Link>

              {/* Inline Article Header VI / EN Switcher (CR-07 / 03-design.md §4.3) */}
              <div
                className="peds-eng-lux-lang-switch"
                role="group"
                aria-label={
                  isVi
                    ? "Ngôn ngữ bài viết VI / EN"
                    : "Article edition VI / EN"
                }
                data-testid="eng-lab-article-inline-lang"
              >
                <button
                  type="button"
                  onClick={() => setLang("vi")}
                  aria-pressed={lang === "vi"}
                  className={`peds-eng-lux-lang-btn${lang === "vi" ? " is-active" : ""}`}
                >
                  Tiếng Việt
                </button>
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  aria-pressed={lang === "en"}
                  className={`peds-eng-lux-lang-btn${lang === "en" ? " is-active" : ""}`}
                >
                  English
                </button>
              </div>
            </div>

            <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1.08fr_0.92fr]">
              <div>
                <p className="peds-eng-lux-mono text-xs text-[#00D9F5]">
                  {article.topic[lang]} ·{" "}
                  {isVi ? "HỒ SƠ KỸ THUẬT" : "TECHNICAL DOSSIER"}
                </p>
                <h1 className="peds-eng-lux-display-title mt-4 text-4xl sm:text-5xl lg:text-[3.5rem]">
                  {article.title[lang]}
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-[#A7B2C2] sm:text-lg">
                  {article.standfirst[lang]}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-5 text-xs text-[#A7B2C2]">
                  <span className="inline-flex items-center gap-2">
                    <Clock3
                      className="h-4 w-4 text-[#00D9F5]"
                      aria-hidden="true"
                    />
                    {article.readingMinutes} {isVi ? "phút đọc" : "min read"}
                  </span>
                  <span className="peds-eng-lux-mono text-[10px] text-[#7D899B]">
                    {article.sources.length}{" "}
                    {isVi ? "NGUỒN KỸ THUẬT" : "VERIFIED REFERENCES"}
                  </span>
                </div>
              </div>

              <figure className="peds-eng-lux-clip-reveal overflow-hidden rounded-2xl border border-[#202730] bg-[#080A0D]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#202730] px-4 py-2.5">
                  <span className="peds-eng-lux-mono text-[10px] text-[#00D9F5]">
                    {isVi ? "SƠ ĐỒ KỸ THUẬT" : "FIG. SCHEMATIC"} ·{" "}
                    {mappedLabMode.toUpperCase()}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDiagramMode("interactive")}
                      className={`min-h-11 rounded-lg px-3.5 text-xs font-semibold ${
                        diagramMode === "interactive"
                          ? "bg-[#00D9F5] text-[#080A0D]"
                          : "bg-[#11151B] text-[#A7B2C2]"
                      }`}
                    >
                      {isVi ? "Vector động" : "Live Vector"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiagramMode("authored")}
                      className={`min-h-11 rounded-lg px-3.5 text-xs font-semibold ${
                        diagramMode === "authored"
                          ? "bg-[#00D9F5] text-[#080A0D]"
                          : "bg-[#11151B] text-[#A7B2C2]"
                      }`}
                    >
                      {isVi ? "Bản vẽ gốc" : "Source Diagram"}
                    </button>
                  </div>
                </div>

                {diagramMode === "interactive" ? (
                  <div className="h-[260px] p-3">
                    <EngineeringLabSchematic2D
                      mode={mappedLabMode}
                      lang={lang}
                      reducedMotion={reducedMotion}
                    />
                  </div>
                ) : (
                  <img
                    src={article.heroImage}
                    alt={article.imageAlt[lang]}
                    className="w-full"
                  />
                )}

                <figcaption className="border-t border-[#202730] px-5 py-3 text-xs leading-5 text-[#A7B2C2]">
                  {article.imageAlt[lang]}
                </figcaption>
              </figure>
            </div>
          </div>
        </header>

        <div className="peds-eng-lux-container grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-20">
          <div className="max-w-[68ch]">
            {article.sections.map((section, idx) => (
              <section
                key={section.id}
                id={section.id}
                className="mb-16 scroll-mt-28"
              >
                <div className="mb-5 flex items-baseline gap-4">
                  <span className="peds-eng-lux-mono text-xs text-[#FF4938]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h2 className="peds-eng-lux-display-title text-2xl sm:text-3xl">
                    {section.heading[lang]}
                  </h2>
                </div>
                <div className="space-y-5 text-[17px] leading-8 text-[#E9EDF2]/90">
                  {section.paragraphs[lang].map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <section className="rounded-2xl border border-[#00D9F5]/35 bg-[#11151B] p-7">
              <p className="peds-eng-lux-mono text-[10px] text-[#00D9F5]">
                {isVi
                  ? "CẦU NỐI THỰC HÀNH MÔ PHỎNG"
                  : "HANDS-ON SIMULATION BRIDGE"}
              </p>
              <h2 className="peds-eng-lux-display-title mt-2 text-2xl">
                {isVi
                  ? "Thực hành trực tiếp trong Interactive Engineering Lab"
                  : "Simulate Principles in the Interactive Engineering Lab"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#A7B2C2]">
                {isVi
                  ? "Chuyển thẳng tới chế độ mô phỏng tương ứng trên xe 3D FP-04 RB hoặc mở điểm chạm kỹ thuật trong Garage 3D."
                  : "Jump straight into the matching simulator mode on the FP-04 RB 3D study model or inspect corresponding garage hotspots."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to={buildEngineeringLabHref({
                    lab: mappedLabMode,
                    hash: "interactive-lab",
                  })}
                  data-testid="eng-lab-article-open-simulator"
                  className="peds-eng-lux-cta-primary"
                >
                  <Cpu className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {isVi ? "Mở chế độ mô phỏng Lab" : "Open Simulator Mode"}
                  </span>
                </Link>

                <Link
                  to="/engineering/car-anatomy"
                  data-testid="eng-lab-article-open-anatomy"
                  className="peds-eng-lux-cta-secondary"
                >
                  <span>
                    {isVi
                      ? "Bóc tách 47 cụm cơ khí"
                      : "47-Part Car Anatomy"}
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                {article.hotspots.map((hotspot) => (
                  <Link
                    key={hotspot}
                    to={`/showroom?hotspot=${hotspot}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#202730] bg-[#080A0D] px-4 text-xs font-semibold text-[#E9EDF2] hover:border-[#00D9F5]"
                  >
                    <Eye
                      className="h-3.5 w-3.5 text-[#00D9F5]"
                      aria-hidden="true"
                    />
                    <span>{HOTSPOT_LABELS[hotspot]?.[lang] ?? hotspot}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-14 border-t border-[#202730] pt-10">
              <h2 className="peds-eng-lux-display-title text-2xl">
                {isVi
                  ? "Nguồn tham khảo kỹ thuật"
                  : "Verified Technical Sources"}
              </h2>
              <p className="mt-3 rounded-xl border border-[#202730] bg-[#11151B] px-4 py-3 text-xs leading-5 text-[#A7B2C2]">
                {article.editorialReview.note[lang]} ·{" "}
                {article.editorialReview.reviewedOn}
              </p>
              <ul className="mt-5 space-y-4">
                {article.sources.map((source) => (
                  <li
                    key={source.url}
                    className="rounded-xl border border-[#202730] bg-[#11151B]/60 p-4"
                  >
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-start gap-2 text-sm font-medium text-[#00D9F5] hover:underline"
                    >
                      <ExternalLink
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{source.title}</span>
                    </a>
                    <p className="mt-1.5 text-xs leading-5 text-[#A7B2C2]">
                      {source.version} · {isVi ? "Truy cập" : "Accessed"}{" "}
                      {source.accessed}. {source.verification[lang]}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <nav
              className="rounded-2xl border border-[#202730] bg-[#11151B] p-5"
              aria-label={isVi ? "Mục lục chuyên đề" : "Dossier contents"}
            >
              <p className="peds-eng-lux-mono text-[10px] text-[#00D9F5]">
                {isVi ? "MỤC LỤC BÀI VIẾT" : "IN THIS DOSSIER"}
              </p>
              <ol className="mt-4 space-y-3">
                {article.sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="flex gap-3 text-xs leading-5 text-[#A7B2C2] hover:text-[#00D9F5]"
                    >
                      <span className="peds-eng-lux-mono text-[#FF4938]">
                        0{index + 1}
                      </span>
                      <span>{section.heading[lang]}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {related.length > 0 && (
              <div className="rounded-2xl border border-[#202730] bg-[#11151B] p-5">
                <p className="peds-eng-lux-mono text-[10px] text-[#A7B2C2]">
                  {isVi ? "CHƯƠNG LIÊN QUAN" : "RELATED CHAPTERS"}
                </p>
                <div className="mt-4 space-y-2.5">
                  {related.map((item) => (
                    <Link
                      key={item.slug}
                      to={buildEngineeringLabArticleHref(item.slug)}
                      className="group flex min-h-11 items-center justify-between gap-3 rounded-xl border border-[#202730] bg-[#080A0D] p-3.5 text-xs font-semibold text-[#E9EDF2] hover:border-[#00D9F5]"
                    >
                      <span>{item.title[lang]}</span>
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-[#00D9F5] transition group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </article>
    </EngineeringLabShell>
  );
};
