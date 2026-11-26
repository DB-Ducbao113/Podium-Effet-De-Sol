import {
  ArrowRight,
  Box,
  Database,
  Image as ImageIcon,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

export interface StormAboutViewProps {
  readonly lang: "vi" | "en";
}

export function StormAboutView({ lang }: StormAboutViewProps) {
  const isVi = lang === "vi";

  const pillars = [
    {
      tag: isVi ? "01 · BẢN SẮC THIẾT KẾ" : "01 · VISUAL SYSTEM",
      title: isVi
        ? "Storm Midnight Liquid Glass"
        : "Storm Midnight Liquid Glass System",
      body: isVi
        ? "Hợp nhất toàn bộ các tuyến trang công khai dưới ngôn ngữ kính mờ trong suốt #05080e, hỗ trợ phóng chữ tới 400%, điều hướng bàn phím đầy đủ, phản hồi tối ưu cho cả máy tính và di động."
        : "Unifies every canonical route under the translucent #05080e Storm Midnight Liquid Glass language with 400% text-zoom reflow, full keyboard navigation, and reduced-motion discipline.",
    },
    {
      tag: isVi ? "02 · DỮ LIỆU XÁC THỰC" : "02 · VERIFIED TELEMETRY",
      title: isVi
        ? "Jolpica, OpenF1 & Đồng Bộ Múi Giờ IP"
        : "Jolpica, OpenF1 & Edge IP Timezone",
      body: isVi
        ? "Mọi điểm số, bảng xếp hạng, lịch thi đấu và kết quả phân hạng 2024–2026 đều đối chiếu từ dữ liệu thực; đồng hồ đếm ngược tự động nhận diện múi giờ qua IP biên Cloudflare và bù sai số chuẩn UTC."
        : "All 2024–2026 standings, calendars, and classifications reconcile verified race records, while countdowns auto-detect edge IP timezone and synchronize to authoritative UTC.",
    },
    {
      tag: isVi ? "03 · MÔ PHỎNG 3D" : "03 · INTERACTIVE 3D",
      title: isVi
        ? "FP-04 RB 3D Studies & Minh Bạch Nguồn"
        : "FP-04 RB 3D Studies & Asset Provenance",
      body: isVi
        ? "Garage Pit 2 khoang 11 đội 2026 và Show bóc tách 47 cụm cơ khí dùng mô hình nghiên cứu phi thương mại FP-04 RB (PETERKISSDESIGN). Toàn bộ tệp 3D được cách ly tải theo yêu cầu và bảo vệ same-origin."
        : "The 2-bay 11-team 2026 Pit Garage and 47-assembly Disassembly Show use the non-commercial FP-04 RB study mesh (PETERKISSDESIGN), lazy-loaded on demand and protected same-origin.",
    },
  ];

  const dataSources = [
    {
      name: "Jolpica F1 API",
      role: isVi
        ? "Lịch thi đấu, kết quả chặng & bảng xếp hạng 2024–2026"
        : "Official 2024–2026 calendars, race results & WDC/WCC standings",
      detail: isVi
        ? "Nguồn kế thừa Ergast cho dữ liệu giải đua Formula 1, định tuyến qua proxy bảo mật same-origin với bộ nhớ đệm có giới hạn và kiểm tra hợp lệ nghiêm ngặt."
        : "Ergast successor for Formula 1 championship records, proxied through our same-origin edge Worker with bounded caching and strict query validation.",
    },
    {
      name: "OpenF1 API",
      role: isVi
        ? "Phiên luyện tập (FP1–FP3), Phân hạng & Sprint 2026"
        : "2026 Practice (FP1–FP3), Qualifying & Sprint session timing",
      detail: isVi
        ? "Cung cấp thời gian vòng chạy, phân đoạn Q1/Q2/Q3 và khoảng cách chi tiết theo phiên, kết hợp cùng bản lưu snapshot kiểm chứng."
        : "Supplies session lap times, Q1/Q2/Q3 splits, and classification intervals, paired with verified repository snapshots.",
    },
    {
      name: isVi
        ? "Cloudflare Edge Timezone & Đồng Hồ UTC"
        : "Cloudflare Edge Timezone & Authoritative UTC",
      role: isVi
        ? "Nhận diện múi giờ tự động theo IP & bù sai số đồng hồ"
        : "Automatic IP-first IANA timezone detection & clock-skew sync",
      detail: isVi
        ? "Đọc múi giờ IANA trực tiếp từ máy chủ biên (dự phòng trình duyệt Intl → UTC), không xin quyền GPS, không lưu cookie/IP người dùng (Cache-Control: no-store)."
        : "Resolves coarse IANA timezone at the edge (falling back to browser Intl → UTC) with zero GPS prompts and zero IP/cookie persistence (Cache-Control: no-store).",
    },
    {
      name: isVi
        ? "Hồ Sơ Thành Tích Lịch Sử (Pre-2024)"
        : "Historical Career Baseline (Pre-2024)",
      role: isVi
        ? "Thống kê chiến thắng & bục podium sự nghiệp tay đua"
        : "Driver career wins & podiums baseline prior to 2024",
      detail: isVi
        ? "Đối chiếu từ thống kê lịch sử FIA Formula One / StatsF1 trước mùa 2024 và cộng dồn tự động với kết quả chính thức 2024–2026."
        : "Reconciled from FIA Formula One / StatsF1 pre-2024 historical records and dynamically aggregated with verified 2024–2026 standings.",
    },
  ];

  const visualAnd3DSources = [
    {
      badge: "3D MESH · ACTIVE",
      title: "FP-04 RB (Peter Kiss / PETERKISSDESIGN)",
      items: isVi
        ? [
            "Showroom 2 khoang 11 đội 2026 (Desktop & Mobile LOD) và Show Kỹ thuật 47 cụm linh kiện sử dụng mô hình nghiên cứu khái niệm FP-04 RB nén Meshopt + WebP, kèm mô hình Pit Crew hoạt ảnh có khớp xương.",
            "Đây là mô hình nghiên cứu minh họa phi thương mại, không phải bản vẽ CAD chính thức của FIA hay bất kỳ đội đua nào; phân phối qua kiểm soát same-origin (CORP: same-origin, noindex).",
          ]
        : [
            "The 2-bay 11-team 2026 Showroom (Desktop & Mobile LOD) and 47-assembly Engineering Show use Meshopt + WebP compressed FP-04 RB study meshes alongside a rigged Pit Crew mesh.",
            "Provided strictly as a non-commercial illustrative engineering study (not official FIA or team CAD) and gated behind same-origin delivery (CORP: same-origin, noindex).",
          ],
    },
    {
      badge: "ILLUSTRATIVE ART",
      title: isVi
        ? "Bộ Ảnh Storm Midnight & Minh Họa Mùa Giải 2024–2026"
        : "Storm Midnight Plates & 2024–2026 Editorial Concepts",
      items: isVi
        ? [
            "Ảnh nền đêm mưa Storm (AVIF/WebP đa độ phân giải), chân dung tay đua, hình minh họa xe 2024–2026 và thẻ Mini Race đều là hình minh họa biên tập tạo bởi AI, được kiểm toàn vẹn SHA-256 qua 4 manifest xuất bản.",
            "Không phải ảnh chụp báo chí chính thức của Formula 1/FIA, không khẳng định quyền thương hiệu hay bản quyền tài trợ của các đội đua.",
          ]
        : [
            "Storm Midnight rain plates (responsive AVIF/WebP), driver portraits, 2024–2026 car illustrations, and Mini Race graphics are AI-generated illustrative editorial concepts verified byte-for-byte via 4 SHA-256 manifests.",
            "They are not official Formula 1/FIA press photographs and assert no trademark, sponsor, livery, or publicity-rights clearance.",
          ],
    },
    {
      badge: "TYPOGRAPHY & BRAND",
      title: isVi
        ? "Kiểu Chữ Mã Nguồn Mở & Biểu Trưng PODIUM EDS"
        : "Self-Hosted Fonts & PODIUM EDS Identity",
      items: isVi
        ? [
            "Toàn bộ phông chữ (Cormorant Garamond, Instrument Serif, Manrope, Nunito, DM Sans, IBM Plex Mono) được tự lưu trữ nội bộ qua Fontsource (giấy phép SIL Open Font License 1.1) với hỗ trợ dấu tiếng Việt đầy đủ — không gọi font ngoài.",
            "Biểu trưng nguyên bản PODIUM · Effet de Sol và các sơ đồ mạch kỹ thuật SVG gốc thuộc bộ tài sản biên tập của dự án.",
          ]
        : [
            "All typefaces (Cormorant Garamond, Instrument Serif, Manrope, Nunito, DM Sans, IBM Plex Mono) are self-hosted via Fontsource under SIL Open Font License 1.1 with full Vietnamese glyph support — zero external font requests.",
            "The canonical PODIUM · Effet de Sol brand mark and original technical SVG diagrams are project-authored editorial assets.",
          ],
    },
    {
      badge: "RETIRED ARCHIVE",
      title: isVi
        ? "Lịch Sử Loại Bỏ Tài Nguyên Cũ"
        : "Retired Legacy Assets Transparency",
      items: isVi
        ? [
            "Nhằm tinh gọn dung lượng và thống nhất trải nghiệm Storm Midnight, các tài nguyên cũ (video drift trang chủ, video hầm showroom và các mô hình 3D thế hệ trước, bao gồm Formula 1 2022 Car — CC BY 4.0 của Luis Adrian V.) đã được rút khỏi bản phát hành công khai.",
          ]
        : [
            "To streamline payloads and unify the Storm Midnight experience, legacy homepage drift video, showroom tunnel clips, and prior-generation 3D models (including the CC BY 4.0 2022 car study by Luis Adrian V.) have been permanently retired from public builds.",
          ],
    },
  ];

  const privacyAndTechRows = isVi
    ? [
        [
          "Quyền riêng tư & Theo dõi",
          "Không tài khoản người dùng · Không cookie quảng cáo · Không yêu cầu quyền định vị GPS / Camera / Micro",
        ],
        [
          "Bảo mật trình duyệt",
          "Content-Security-Policy chặt chẽ (connect-src 'self'), Permissions-Policy chặn geolocation/camera/microphone",
        ],
        [
          "Tối ưu hiệu năng 3D",
          "0 byte thư viện Three.js tải trên các trang dữ liệu; chỉ nạp động 3D khi mở Showroom hoặc Kỹ thuật; tối đa 1 ngữ cảnh WebGL",
        ],
        [
          "Khả năng tiếp cận",
          "Hỗ trợ điều hướng bàn phím đầy đủ (Tab/Enter/Escape), phóng chữ tới 400%, chế độ giảm chuyển động và màn hình dự phòng khi tắt WebGL",
        ],
        [
          "Tuyên bố pháp lý",
          "F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX và các tên đội/tay đua là thương hiệu thuộc chủ sở hữu tương ứng, chỉ được dùng cho mục đích biên tập phi thương mại.",
        ],
      ]
    : [
        [
          "Privacy & Telemetry",
          "Zero user accounts · Zero tracking cookies · Zero GPS / Camera / Microphone permission prompts",
        ],
        [
          "Browser Hardening",
          "Strict Content-Security-Policy (connect-src 'self') & Permissions-Policy blocking geolocation, camera, and microphone",
        ],
        [
          "3D & Bundle Discipline",
          "0 bytes of Three.js downloaded on data/editorial pages; lazy-loaded strictly on Showroom & Engineering with <= 1 active WebGL context",
        ],
        [
          "Accessibility",
          "Full keyboard navigation (Tab/Enter/Escape), 400% text-zoom reflow, prefers-reduced-motion compliance, and WebGL-disabled fallbacks",
        ],
        [
          "Legal Disclaimer",
          "F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX, and constructor/driver names belong to their respective trademark holders and are referenced strictly for non-commercial editorial purposes.",
        ],
      ];

  return (
    <div className="sp-lg-wrap sp-about-page" data-prototype-tab="about">
      <header className="sp-lg-pagehead">
        <div className="sp-lg-kick">
          {isVi
            ? "GIỚI THIỆU · TUYÊN NGÔN DỰ ÁN, NGUỒN DỮ LIỆU & BẢN QUYỀN"
            : "ABOUT · PROJECT MANIFESTO, DATA SOURCES & ASSET PROVENANCE"}
        </div>
        <h1 className="sp-lg-h1">
          PODIUM <em>Effet de Sol.</em>
        </h1>
        <p className="sp-hero-lead">
          {isVi
            ? "Chuyên trang biên tập, dữ liệu và mô phỏng kỹ thuật Formula 1 độc lập — hoàn toàn phi thương mại và không liên kết chính thức với Formula 1, FIA hay bất kỳ đội đua nào."
            : "An independent, non-commercial Formula 1 editorial, race-telemetry, and interactive 3D engineering showcase — unaffiliated with Formula 1, the FIA, or any constructor."}
        </p>
      </header>

      <section
        className="sp-about-grid"
        aria-label={
          isVi ? "Nguyên tắc kiến trúc" : "System architecture principles"
        }
      >
        {pillars.map((item) => (
          <article key={item.title} className="sp-lg-panel sp-panel">
            <span className="sp-mono-tag">{item.tag}</span>
            <h2 className="sp-panel-title">{item.title}</h2>
            <p className="sp-panel-sub">{item.body}</p>
          </article>
        ))}
      </section>

      <section
        className="sp-about-section"
        aria-labelledby="sp-about-data-heading"
      >
        <div className="sp-about-section__head">
          <span className="sp-mono-tag">
            <Database size={13} aria-hidden="true" />
            {isVi
              ? "NGUỒN DỮ LIỆU & ĐỒNG BỘ THỜI GIAN"
              : "DATA SOURCES & TIME SYNCHRONIZATION"}
          </span>
          <h2 id="sp-about-data-heading" className="sp-about-section__title">
            {isVi
              ? "Dữ liệu đường đua được đối chiếu từ đâu?"
              : "Where verified race data comes from"}
          </h2>
        </div>

        <div className="sp-about-source-grid">
          {dataSources.map((src) => (
            <article
              key={src.name}
              className="sp-lg-panel sp-about-source-card"
            >
              <div className="sp-about-source-card__top">
                <h3>{src.name}</h3>
                <span className="sp-about-badge">{src.role}</span>
              </div>
              <p>{src.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="sp-about-section"
        aria-labelledby="sp-about-assets-heading"
      >
        <div className="sp-about-section__head">
          <span className="sp-mono-tag">
            <ImageIcon size={13} aria-hidden="true" />
            {isVi
              ? "BẢN QUYỀN MÔ HÌNH 3D, HÌNH ẢNH & PHÔNG CHỮ"
              : "3D MODELS, EDITORIAL ARTWORK & TYPOGRAPHY PROVENANCE"}
          </span>
          <h2 id="sp-about-assets-heading" className="sp-about-section__title">
            {isVi
              ? "Minh bạch nguồn gốc từng lớp tài nguyên"
              : "Full provenance across every visual & 3D layer"}
          </h2>
        </div>

        <div className="sp-about-source-grid">
          {visualAnd3DSources.map((block) => (
            <article
              key={block.title}
              className="sp-lg-panel sp-about-source-card"
            >
              <span className="sp-mono-tag">{block.badge}</span>
              <h3>{block.title}</h3>
              <ul className="sp-about-bullets">
                {block.items.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section
        className="sp-about-section"
        aria-labelledby="sp-about-governance-heading"
      >
        <div className="sp-about-section__head">
          <span className="sp-mono-tag">
            <ShieldCheck size={13} aria-hidden="true" />
            {isVi
              ? "BẢO MẬT, QUYỀN RIÊNG TƯ & PHÁP LÝ"
              : "SECURITY, PRIVACY & LEGAL NOTICE"}
          </span>
          <h2
            id="sp-about-governance-heading"
            className="sp-about-section__title"
          >
            {isVi
              ? "Tiêu chuẩn kỹ thuật & tuyên bố độc lập"
              : "Engineering standards & non-affiliation notice"}
          </h2>
        </div>

        <div className="sp-lg-panel sp-panel">
          <dl className="sp-about-kv-list">
            {privacyAndTechRows.map(([term, desc]) => (
              <div key={term} className="sp-about-kv-row">
                <dt>{term}</dt>
                <dd>{desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="sp-hero-actions">
        <Link to="/showroom" className="sp-storm-btn sp-storm-btn--primary">
          <Box size={15} aria-hidden="true" />
          <span>
            {isVi ? "MỞ GARAGE 3D FP-04 RB" : "ENTER FP-04 RB GARAGE"}
          </span>
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
        <Link
          to="/engineering"
          className="sp-storm-btn sp-storm-btn--secondary"
        >
          <span>
            {isVi ? "XEM SHOW KỸ THUẬT 47 CỤM" : "EXPLORE 47-PART SHOW"}
          </span>
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
