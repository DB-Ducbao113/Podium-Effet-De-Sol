# PODIUM EFFET DE SOL — IGNITION MASTER REDESIGN PLAN

> **Historical execution record (updated 04/11/2026).** Earlier sections describe the repository as it existed at their dated gates. On 04/11/2026, the owner approved permanent deletion of the exact `scratch/` cleanup manifest and removal of the EDS-G01 model. Paths under `scratch/`, old quarantine counts, and older production model statements below are historical evidence, not current instructions. Current asset provenance is in `docs/asset-licenses.md` and `docs/asset-manifests/`.

**Status:** `P1 APPROVED / CLEANUP_VERIFIED / GATE 1 GO; P2 APPROVED / CLEANUP_VERIFIED / GATE 2 GO; P3 APPROVED / CLEANUP_VERIFIED / GATE 3 GO; P4 DESIGN APPROVED — IMAGE POLISH DEFERRED / CLEANUP_VERIFIED / GATE 4 PENDING; P5 OPEN (VISUAL DESIGN IN PROGRESS)` — đây là plan triển khai theo cổng duyệt, không phải quyền tự sửa code.  
**Prepared / revised:** 02/11/2026 (P4 CLOSEOUT — owner `P4 DESIGN APPROVED — IMAGE POLISH DEFERRED`; 860 file / 186.935.795 B quarantine có manifest + hash; re-QA 446 test, build 11,07 s, 27/27 browser smoke; P5 OPEN) — Revision 1.6.1  
**Target:** `DB-Ducbao113/Podium-Effet-De-Sol`, `migration/clean-architecture`  
**GitHub baseline inspected:** `d4838ad5be4c809dc020c52fe84ae47edcdb67c3`; working tree tại Gate 0: **không có tracked modification**, chỉ có owner docs, mockup/Spec, gói V2 và `source-assets/` untracked.  
**Goal:** Portfolio cá nhân, phi thương mại; tái thiết kế **bố cục + UI + hình ảnh + motion + luồng sử dụng**, bảo tồn dữ liệu và thành quả tối ưu 3D hiện có.  
**Permissions:** Không tự stage/commit/push/merge/deploy hoặc xóa dữ liệu quan trọng; owner duyệt từng phase. D7 cho phép **local build/preview**, **cấm deploy**.

> **Gate 0 reconciliation đã chạy xong:** 7/7 mockup IGNITION + `IGNITION_Design_Spec.md` đã được đọc, hash và đối chiếu với P0 screenshot baseline theo từng route; owner decisions **D1–D8 đã được ghi nhận**; `VISUAL_GAP_MATRIX` được viết lại theo từng trang 01–07; P1 scope + QA matrix được chốt trong plan này. **Không có source file nào bị sửa, không cài package/CSS V2, không xóa file, không commit/push/deploy.** Gate 0 vẫn `HOLD` cho đến khi owner xác nhận rõ `GATE 0 APPROVED`; P1 chưa bắt đầu. Mockup là **concept review sheet**, không phải screenshot app và không phải pixel contract.

## 0. SOURCE OF TRUTH & THỨ TỰ ƯU TIÊN

### 0.1 Đã đọc/đối chiếu (P0 local, 30/10/2026)

**Ba tài liệu owner (3/3) — DOC_REGISTER:**

| # | Path | Bytes | SHA-256 (trước revision 1.2) | Vai trò |
|---|---|---|---:|---|
| 1 | `docs/IGNITION_MASTER_PLAN.md` | 46.752 | `96cae9e0e2ee005297f0c88194790d04b2a88d821f5012adcc650a01f67b47b0` | Plan/cổng duyệt; file này được cập nhật in-place |
| 2 | `docs/PODIUM_EDS_IGNITION_V2_Review_Patch/PODIUM_EDS_IGNITION_V2/README.md` | 3.419 | `f926f9a57ca5a6a043c0be1b70a8e40cee4e8a7d3d7e45dae893e55c5631bd5d` | Phạm vi patch V2; xác nhận **chưa áp dụng**, preview chỉ minh họa |
| 3 | `docs/PODIUM_EDS_IGNITION_V2_Review_Patch/PODIUM_EDS_IGNITION_V2/QA_REPORT.md` | 2.241 | `8bb6f511969347d9703f3d03eef56ef6eff6afe6ab06716f6eec56fa980ac833` | QA tĩnh: CSS parse PASS, installer synthetic PASS, preview responsive PASS; **full app build/browser QA NOT RUN** |

**Visual target register — 7 mockup + Design Spec (D1, verified Gate 0 30/10/2026):**

| # | Path | Kích thước | Bytes | SHA-256 | Ghi chú |
|---|---|---|---:|---|---|
| M1 | `references/ignition/PODIUM_EDS_IGNITION_All_Page_Mockups/PODIUM_EDS_IGNITION_Review/01_Homepage.png` | 1536×1024 | 2.363.586 | `7f1fdb7d69cfa7276d04e514f4f58166f5f88442f09689bdd5bc0371782130b6` | Desktop + mobile frame; hero/latest GP/category cards |
| M2 | `.../02_Race_Center.png` | 1672×941 | 2.181.548 | `c47ade837eb2ed294efd898c8d3451800ff29052f39e00d0a42b5e679eb88c78` | Race Center + qualifying/fast-lap states |
| M3 | `.../03_Standings_Driver.png` | 1536×1024 | 2.114.175 | `bf7f485d1825ef5e1bfe621ac6d68f7e72504d2dd56395c8506c3c3b0439150c` | Standings + driver profile |
| M4 | `.../04_Constructors_Team.png` | 1672×941 | 2.149.912 | `6854a1af1e9c3e70d38c787daeb8afc2f0847ca755c272bfc7639ab0c29c1f57` | Constructors + team profile |
| M5 | `.../05_Engineering.png` | 2062×763 | 2.323.058 | `48b8067ddab16ede7b283fd7f090e32426541d4700362511a232d3f56856ca51` | 3-up: ITM / Car Anatomy / Insights |
| M6 | `.../06_Showroom_3D.png` | 1672×941 | 2.188.094 | `6333370be2df9f03a649dce369ad471dd2c8578f5feef756f9e40a066a9202c7` | Desktop + mobile showroom |
| M7 | `.../07_Calendar_Circuits.png` | 1672×941 | 2.465.035 | `38d6f41d67de377a1b9cab66921c48571d5093e024f911220fa9ca379e1cc68a` | 2-up: Race Calendar / Circuit Explorer |
| S1 | `docs/IGNITION_Design_Spec.md` — bản sao trong mockup folder **giống hệt** (`0ecf4d82…f4f54e15059f4fc`, 6.875 B) | — | 6.875 | `0ecf4d82f20c6e970511ed4c6ff7595ac72ce860bb0519b1046f54e15059f4fc` | Page templates 01–07, tokens, motion, QA, guardrails |

**File hỗ trợ của cùng gói patch (đã đọc/đối chiếu, không phải 3 docs gốc):**

| Path | Bytes | SHA-256 | Ghi chú |
|---|---:|---|---|
| `.../files/apps/web/src/styles/ignitionV2.css` | 20.861 | `a5c7e04d8ca7f056f2bc7b69d2bc310c64c2d42f0aedc4fd4f3f2e9cbfce7abf` | 490 dòng; payload CSS thực tế, **chưa import** |
| `.../install.py` | 6.227 | `4f7a7d01d7838e22ff704dcf5b3c1c1920b5fbfae2728c332b02c6fc95fce2f9` | Anchor chèn import + eyebrow/HUD/grid; tạo backup local |
| `.../preview.html` | 10.027 | `885c01cd007110fb4acd7d0dd6b8605b726087cd75958e6492081a42eb932192` | Static concept preview, không phải app |
| `.../preview-desktop.png` / `preview-mobile.png` | 737.181 / 380.845 | `03f5d866...eb53` / `22e1da10...ac3c7d` | Ảnh minh họa tĩnh, không phải screenshot runtime |

**Tài liệu dự án đã đọc:** `README.md`, `PRODUCT.md`, `DESIGN.md`, `AGENTS.md`, `docs/PODIUM_EDS_MASTER_SUMMARY.md`, `docs/architecture.md`, `docs/migration.md`, `docs/asset-licenses.md`, `docs/security.md`, `docs/qa/inside-machine-engineering-dev-integration.md`, `docs/qa/results-engine-r2-owner-review.md`.

**Code/package đã kiểm tra:** `package.json`, `apps/web/package.json`, `App.tsx`, `Navbar.tsx`, `PodiumBrandHero.tsx`, `HomeView.tsx`, intro/timing state, `homepageH1.css`, `ShowroomView.tsx`, `CommercialBReviewShowroom.tsx`, ITM trial app, `index.css`, Tailwind config, route/query behavior, `source-assets/` inventory (chỉ liệt kê).

**Tham chiếu ngoài:** Design DNA, Impeccable, Anime.js v4 Scope, Playwright snapshots/axe, R3F performance, WCAG 2.2, Core Web Vitals.

### 0.2 Chưa có / không được coi là đã đọc

- **Đã có trong local (Gate 0, D1):** `IGNITION_Design_Spec.md` + **7 mockup toàn trang** tại `references/ignition/PODIUM_EDS_IGNITION_All_Page_Mockups/PODIUM_EDS_IGNITION_Review/`; bản Spec trong `docs/` và trong mockup folder giống hệt hash. Revision 1.2 chỉ đối chiếu gói V2; **revision 1.3 đã đọc và đối chiếu 7/7 mockup + Spec** — xem §13.4 và §13.13. Vẫn **không có**: `Frontend-References.txt`, `PODIUM_EDS_PreDesign_Research.md`, file thiết kế nguồn (Figma/PSD/AI), spec breakpoint chi tiết ngoài danh sách QA trong Design Spec.
- **Mockup là ảnh concept tổng hợp**, không phải screenshot app; tên tay đua/đội, điểm, thời gian và kết quả là hư cấu. Chỉ dùng bố cục, hierarchy và ngôn ngữ thị giác; **không copy dữ liệu, logo, ảnh tay đua hoặc track map** (D5; §13.13).
- Media/model trong `.local-assets/`, `source-assets/` (59 MB, untracked và **chưa được ignore**) chỉ được inventory; không sao chép, không stage, không xóa.
- Screenshot production build: **NOT RUN**. D7 cho phép build/preview local từ P1, nhưng Gate 0 chưa chạy build; deploy bị **cấm**. Toàn bộ ảnh P0 là **DEV server** (`import.meta.env.DEV`): home dùng Tokyo Drift video, showroom dùng Model B. Production dùng EDS-G01/hero 3D và Showroom mặc định — baseline production sẽ chụp ở phase được duyệt.
- Đo FPS trên GPU thật: **NOT RUN**. Model B/ITM chỉ đo trong Chromium headless + SwiftShader; số liệu không đại diện thiết bị thật.
- Lighthouse/Web Vitals field data, axe scan đầy đủ, screenreader manual: **NOT RUN** trong P0.

### 0.3 Precedence khi mâu thuẫn

1. Quyết định owner mới nhất và quyền phạm vi/giấy phép.
2. Code + tests + thư mục local hiện thời (đã xác minh), chưa sửa ngoài scope.
3. `PRODUCT.md` / `DESIGN.md` + các **3 tài liệu mới** sau khi đọc; nếu xung đột phải đưa vào bảng quyết định owner, không tự hòa giải.
4. QA contracts hiện có, `docs/asset-licenses.md`, ranh giới DEV/public/release.
5. 7 IGNITION mockups + Design Spec là **visual target chính** (D1), chỉ ở mức cảm quan/bố cục; V2 chỉ là reference phụ. Không dùng dữ liệu F1 hư cấu hoặc kỹ thuật 3D trong mockup làm nguồn thật.
6. Website reference/skill là nguồn học phương pháp; không sao chép nhận diện, code, ảnh hoặc logo thiếu quyền.

### 0.4 Bất biến kỹ thuật

- Monorepo `apps/web`, `apps/api`, `apps/jobs`, `packages/*`, Cloudflare Workers và Web Fetch API; giữ API contracts.
- React 18, TypeScript, Vite 6, Tailwind 4, Zustand, Three.js, React Three Fiber, Drei, Anime.js `^4.5.0`, Meshoptimizer, Vitest, Playwright-core đã có. **Không tự thay stack**.
- Results Engine: chỉ hiển thị kết quả khi có classification đã xác minh; hỗ trợ FP1/FP2/FP3, Qualifying, Sprint Qualifying, Sprint, Race khi có; không fake dữ liệu hoặc phát sinh auto-sync không duyệt.
- Intro hiện có 1× ≈6,2s, 2× ≈4,25s, 3× ≈3,35s; 3× mặc định, Skip/ESC, session state, reduced-motion. Không lùi về 5–7 giây.
- Model B optimized/Inside the Machine và related assets đang **DEV/local only**. Production sử dụng EDS-G01 và Engineering legacy. Không đưa asset local vào public, không bỏ hàng rào `import.meta.env.DEV` khi chưa có Gate riêng.
- Model B Showroom là 1-mesh/7 hotspot gần đúng; Inside the Machine REV4.2 là runtime nhiều phần với 10 assemblies/65 components/75 transforms. **Không đồng nhất hai bộ model**; không mô tả mô hình 2022 là xe 2026 đã xác minh.
- Inside the Machine: 6 chapters, native scroll-scrub, choreography, wheel-first 7 waves, exact opening/final parity, Quality Lock, Retry và context recovery được bảo tồn.
- Không mặc định công bố/nhập logo, sponsor, ảnh tay đua, video hoặc dữ liệu không rõ quyền dù là portfolio phi thương mại.

## 1. GATE 0 — DOC-FIRST, REPO BASELINE & SKILL DISCOVERY (BẮT BUỘC)

**Trạng thái:** `P0 + GATE 0 RECONCILIATION EXECUTED — OWNER APPROVAL PENDING`; 3/3 tài liệu + **7/7 mockup + Design Spec** đã đọc, baseline/routes/motion đã kiểm tra, **D1–D8 đã được ghi nhận**, P1 scope/QA đã chuẩn bị. Không mở P1 khi chưa có `GATE 0 APPROVED`.

### Workflow bắt buộc của AI

1. `pwd`, `git status --short --branch`, `git rev-parse HEAD`, `git remote -v` chỉ để **đọc**. Không `git pull`, `reset`, `stash`, `checkout` làm thay đổi working tree nếu chưa được owner đồng ý.
2. Liệt kê `docs/` (và `docs/design/` nếu có), xác định **3 tài liệu mới**. Đọc toàn bộ, ghi tên/path, version, nơi được dùng; nếu là ảnh/ZIP mở nội dung theo định dạng phù hợp; trích chính xác các quyết định do owner nêu.
3. Đọc `README.md`, `PRODUCT.md`, `DESIGN.md`, `AGENTS.md` (nếu có), `docs/PODIUM_EDS_MASTER_SUMMARY.md`, QA report, asset licenses, các route và code có liên quan. Đừng mặc định tài liệu `docs/migration.md` là trạng thái mới nhất nếu nó mô tả migration cũ.
4. Tạo bảng `DOC_REQUIREMENTS_MATRIX`: `source | requirement | affected route/component | priority | conflict | decision needed | acceptance test`.
5. So sánh `git status` với HEAD `d4838ad`: tài sản nào đang thay, animation nào chưa commit, asset nào local. Phải tránh đè mất công đang làm.
6. Liệt kê `skills` đã **thật sự cài** cho Codex/Antigravity và repo (có `SKILL.md` sử dụng được), `package.json`, `package-lock.json`. Đề xuất skill/library mới kèm mục đích, khả năng thay thế bằng công cụ hiện có, license và chi phí bundle. Không tự cài.
7. Chạy/tạo baseline chỉ khi owner cho phép test (đọc và chạy local không được push): screenshot trang thực tế, console/network, layout, animation timeline, bundle, FPS, input states. Không ghi PASS khi không chạy.
8. Xuất `BASELINE + RISKS + CONFLICTS + SKILL MATRIX` và bản plan cập nhật; **owner xác nhận Gate 0 rồi mới Phase 1**.

**Gate 0 acceptance:** 3/3 tài liệu + 7 mockup/Design Spec đọc và ghi nguồn; routes/assets map xong; **D1–D8 được ghi nhận**; mọi xung đột còn lại được gán phase (C1 intro → P2) và không nằm trong P1; owner duyệt phạm vi P1; working tree được bảo vệ. Phase 0/Gate 0 không dọn file hoặc sửa code.  
**Trạng thái 30/10/2026:** 3/3 docs ✅; 7/7 mockup + Design Spec ✅; routes/assets mapped ✅; D1–D8 recorded ✅; P1 scope/QA prepared ✅; working tree protected ✅; **owner approval chưa có** ❌ → **Gate 0 HOLD**.

### P0 WORK PACKAGES — THỨ TỰ CHẠY NGAY TRÊN MÁY LOCAL

| Substage | Công việc chính | Đầu ra / cách xác nhận | Điều kiện HOLD |
|---|---|---|---|
| **P0-A — Intake** | Liệt kê, mở, đọc **đúng 3 tài liệu mới** trong `docs/`, gồm hình ảnh/tệp đính kèm nếu có; ghi path và hash; đọc `AGENTS.md` nếu tồn tại | `DOC_REGISTER`: path, title, SHA-256, phạm vi, yêu cầu trích dẫn từ tài liệu | Không tìm đủ 3, không mở được, hoặc không rõ file nào do owner thêm |
| **P0-B — Code / asset audit** | `git status`, HEAD, route map, dependencies/skills hiện dùng, assets trong `.local-assets` và `source-assets` **chỉ liệt kê, không sao chép**; so sánh docs và code | `BASELINE_MATRIX`: route → component → CSS → motion → model → QA → boundary DEV/prod | Working tree thay đổi chưa rõ; rủi ro ghi đè công việc local |
| **P0-C — Reference / design audit** | Đối chiếu từng mockup/ảnh reference với screenshot UI thật, khảo sát viewport VI/EN, hierarchy, font, tương phản, trạng thái; review Design DNA/Impeccable chỉ khi skill thực sự khả dụng | `VISUAL_GAP_MATRIX`: trang/section, bố cục hiện tại, bố cục đích, visual evidence, mức ưu tiên | Không có baseline thật, không xem được ảnh hoặc visual chưa được owner cho phép sử dụng |
| **P0-D — Motion / 3D baseline** | Đo intro 1×/2×/3×, skip/reduced; inventory timeline Anime.js; xem Hero video fallback; đọc cấu trúc Model B, Inside the Machine, profiles và performance contracts | `MOTION_3D_MATRIX`: time, FPS/1% low/P95 (nếu đo thật), presets, GLB/model integrity, reduced/fallback, NOT RUN ghi rõ | Không phân biệt DEV/production, hoặc suy đoán FPS từ code |
| **P0-E — Reconcile / Gate 0** | Hợp nhất yêu cầu từ 3 docs + code + mockups; ghi conflict/decisions, cập nhật master plan **in-place**, chốt scope P1 và danh sách giữ/không đụng | Một `P0_OWNER_REVIEW` ngắn trong `scratch/ignition/p0-baseline/` và revision entry trong plan | Xung đột có ảnh hưởng chưa được owner quyết, không có evidence hoặc scope chưa được duyệt |

**P0 giới hạn:** được đọc và chạy lệnh kiểm tra an toàn, tạo ảnh/log trong `scratch/ignition/p0-baseline/`; không sửa source, không commit, không cài skill/package, không xóa dữ liệu. Nếu QA chạy tạo build output, chỉ tạo trong nơi đã ignored; không xóa output khi owner chưa duyệt.

**P0 đầu ra tối thiểu để trình owner:** (1) 3-doc register; (2) source-of-truth/conflict table; (3) page/route inventory; (4) screenshot before + visual gap; (5) motion/3D/asset/skills matrix; (6) proposal điều chỉnh P1–P8, thay đổi ưu tiên; (7) danh sách điều **không** được sửa và các blocker. Không ghi “Đã đọc 3 tài liệu” nếu mới nhìn filenames.

### P0 EXECUTION STATUS (30/10/2026)

| Substage | Kết quả | Evidence | Trạng thái |
|---|---|---|---|
| **P0-A — Intake** | Đọc đủ 3/3 docs + toàn bộ gói patch; ghi path/bytes/hash | §0.1; `docs/PODIUM_EDS_IGNITION_V2_Review_Patch/...` | **DONE** |
| **P0-B — Code/asset audit** | Route → component → CSS → motion → model → DEV/prod map; 16 routes × 2 ngôn ngữ; skills/deps thật | §13.2, §13.6 | **DONE** |
| **P0-C — Reference/design audit** | 129 ảnh thật; visual gap matrix; xác định V2 chưa áp dụng; **Gate 0 đã bổ sung và đối chiếu 7/7 mockup + Spec** | §13.3, §13.4, §13.13; `scratch/ignition/p0-baseline/shots/` | **DONE** — full IGNITION target reconciled |
| **P0-D — Motion/3D baseline** | Đo intro thật; inventory Anime.js; Model B/ITM structure; FPS thật **NOT RUN** | §13.5; `logs/intro-report.json`, `logs/extra-report.json` | **DONE WITH LIMIT** — headless only |
| **P0-E — Reconcile/Gate 0** | Cập nhật plan in-place; conflict D1–D8; revised P1–P8; acceptance criteria; Gate 0 decisions recorded | File này, revision 1.3 | **OWNER APPROVAL PENDING** |

**Giới hạn evidence:** 84 row = 1024/1440 × 16 routes × VI/EN (64) + 390/768 × 5 route chính × VI/EN (20); thêm 375/1920 × 6 route chính × VI/EN (24 ảnh); ảnh intro/ITM states. **Chưa chụp** 375/1920 cho 10 route phụ và 11 route phụ ở 390/768 — ghi `NOT RUN`, sẽ hoàn tất trong visual QA từng phase. Không có horizontal document overflow ở 84/84 row; 0 `pageerror`; 100 console error thuộc **cùng một loại** cảnh báo duplicate React key với 2 nhãn VI (xem D-P0-03), không phải lỗi runtime.

## 2. SKILLS / THƯ VIỆN / REFERENCES — DÙNG ĐÚNG VIỆC

### 2.1 Skill roles (có thể là installed skill hoặc quy trình thủ công tương đương)

| Vai trò | Skill / nguồn đề xuất | Sử dụng | Bằng chứng bắt buộc |
|---|---|---|---|
| Design Direction | `frontend-design` | Xây layout/typography có bản sắc, tránh template AI | Design rationale + before/after |
| Design DNA | `zanwei/design-dna` | Đo màu/tỷ lệ/font/rhythm từ 7 ảnh IGNITION và references, xuất JSON/token map | Trích xuất palette và so sánh screenshot, không chép nguyên mẫu |
| Design Critic | Impeccable (`critique`, `layout`, `audit`, `polish`) nếu cài | Kiểm tra hierarchy, density, clipping, states, consistency | Report phân loại P0–P3; ảnh thật |
| React Performance | `vercel-react-best-practices` nếu cài; React DevTools/profiling | Render, code split, effect lifecycle, hooks | Bundle delta, profiler, no regression |
| Motion Engineering | Anime.js 4 docs, existing motion utilities | Timeline, scope cleanup, motion acceptance | Timing sheet, video/frames, reduced motion |
| Three.js Performance | R3F performance practices + repo adaptive/profiling | DPR, frame budget, mesh/material, GPU fallback | FPS/1%-low/P95/draw calls trên thiết bị đại diện |
| Visual/E2E QA | Existing `playwright-core`; cân nhắc `@playwright/test` sau review | Screenshot state, routes, keyboard, interaction, visual diff | Screenshot matched set + trace khi lỗi |
| Accessibility | WCAG 2.2 AA + `@axe-core/playwright` nếu được phép cài | Keyboard, labels, focus, contrast, motion | axe scan + manual checklist |
| Licensing/Provenance | `docs/asset-licenses.md` + license inventory | Kiểm soát ảnh, model, fonts, icons, brand | Asset manifest + attribution |

**Cài đặt:** `docs/` hoặc `.impeccable/` có file cấu hình **không chứng minh skill đã được cài** cho agent. Mọi CLI skill/install phải xác minh nguồn/phiên bản, owner cho phép và tránh lồng nhiều agent frameworks.

### 2.2 Mapping reference theo mục đích

- `animejs.com`: authored timeline, typography reveal, state transitions. Reuse Anime.js sẵn có; cleanup scope khi unmount.
- `threejs.org`: camera, material, lighting, renderer; giữ R3F và adaptive quality đã có.
- `github.com/zanwei/design-dna`: biến concept screenshot thành token/định lượng; không sử dụng làm bản thiết kế hoàn chỉnh tự động.
- `microkit.co`, `kinetics.colorion.co`: CTA, hover, easing, microinteraction, tập trung hiệu ứng ngắn.
- `uiverse.io/elements`, `liquidglassdesign.com`: tham khảo pattern có chọn lọc; không lạm dụng glass/blur làm chậm GPU.
- `getdesign.md/mobbin/design-md`: hierarchy/flow, không copy giao diện nguyên bản.
- `3dicons.co`, `kitbitz.art`: tham khảo biểu tượng; ưu tiên Lucide hiện có và kiểm giấy phép trước khi nhập 3D icon.
- `gsap.com`: phương án tham khảo/thay thế có lý do; **không cài thêm GSAP nếu Anime.js đủ**.
- `mapen`: chưa xác minh URL/dự án/thư viện; **không dùng làm dependency** trước khi xác nhận.

### 2.3 Decision rule cho package mới

Chỉ bổ sung khi giải quyết thiếu hụt cụ thể, không tăng quá mức bundle/runtime; có license phù hợp, hoạt động trong Cloudflare/Vite/Tailwind 4, kiểm thử và fallback. Ưu tiên CSS/React primitives và libs sẵn có. Không tải remote assets vào production trong quá trình nghiên cứu.

## 3. VISUAL SYSTEM CONTRACT — PHẢI THỐNG NHẤT TRƯỚC KHI ĐỔI PAGE

**Direction mong muốn:** IGNITION / AERO-RACING EDITORIAL: carbon sâu, racing crimson + ignition orange, typography condensed, telemetry mono, cinematic nhưng dữ liệu vẫn dễ đọc. Đây là gợi ý để owner duyệt, **chưa thay thế `DESIGN.md`**.

- Brand tone: đỏ/cam có kiểm soát theo cấp hierarchy, không phải toàn màn hình neon; nền tối chính; ivory dành cho tương phản.
- Tạo **một nguồn design tokens canonical** (CSS custom props/Tailwind mapping). Tránh thêm `ignitionV3.css`, `ignitionV4.css` để đè nhau.
- Font conflict: **D2 đã chốt** — giữ 4 font roles đang dùng trong code (Barlow Condensed display, Space Grotesk UI, Manrope body, IBM Plex Mono data); `DESIGN.md` được đồng bộ ở P1; không đổi font, không thêm Bebas Neue.
- Component primitives: header, page title, tabs, filters, status chips, leaderboard, team identity surface, card, data table, drawer, modal, loading/empty/error, tooltip; không nhân đôi component riêng cho từng tab nếu có thể tái sử dụng.
- Bố cục phải sửa **DOM/component hierarchy và route flow** khi cần, không chỉ CSS override.
- Đội/tay đua: phần nền có team tint/gradient đủ nhận diện, đồng thời có chữ/ký hiệu, kiểm tra contrast; không dựa vào màu đơn độc.
- Ảnh: ảnh mockup mang tính concept; dùng asset trong dự án/ảnh có nguồn rõ ràng, có kích thước mục tiêu, WebP/AVIF khi phù hợp, poster và fallback; không tạo hàng trăm file tạm.
- Mobile là thiết kế riêng có trọng tâm, không đơn thuần co tỷ lệ desktop.

### 3.1 BRAND IDENTITY LOCK (owner override, 31/10/2026)

- Original PODIUM EDS logo is canonical.
- IGNITION mockups are layout and visual references, not brand identity replacements.
- No agent may modify or replace the official logo without explicit owner approval.

The official raster logo and its original assets (`apps/web/public/logo/logo.png`, `logo-compact.png`, icons, apple-touch-icon, favicon, og-preview) must not be redrawn, retyped, recolored, recreated, cropped, distorted or deleted. Navigation work may adjust only display size, padding and container so the logo fits desktop/mobile; the intrinsic aspect ratio must be preserved and the artwork must render at native quality without upscaling. Brand checks require VI/EN evidence at 375/390/768/1024/1440/1920. Any future logo change requires explicit owner approval and a new plan revision.

### 3.2 VISUAL DESIGN ACCEPTANCE CONTRACT — P4–P8 (owner direction, 01/11/2026)

Owner yêu cầu chất lượng IGNITION tiệm cận **7 mockup** ở art direction/color, hierarchy/typography/composition, imagery có mục đích, motion/cinematic transition, mobile-specific design, performance, accessibility và data integrity. Hợp đồng này thay thế mọi cách hiểu "QA xong = duyệt phase".

**Bốn gate bắt buộc cho mỗi phase P4–P8.** Một phase chỉ được đề xuất `APPROVED` khi **cả 4 gate** đã được tick bằng bằng chứng và mọi blocker trong gate đó đã đóng hoặc được owner chấp nhận rủi ro bằng văn bản.

| Gate | Câu hỏi phải trả lời | Bằng chứng tối thiểu |
|---|---|---|
| **G-1 Layout/UX** | Hierarchy, composition, thứ tự đọc, CTA, trạng thái, mobile có được thiết kế riêng? | ảnh runtime 375/390/768/1024/1440/1920 × VI/EN; state gallery; keyboard/focus; không overflow/clip ngoài chủ đích |
| **G-2 Visual/Imagery** | Palette carbon/ignition/racing-red/ivory có kiểm soát; typography VI/EN; ảnh/artwork có mục đích và **có provenance**? | contrast đo được; asset inventory + nguồn/quyền; ảnh before/after cùng state |
| **G-3 Motion/Performance** | Motion có chủ đích, không perpetual nặng; reduced motion; không làm chậm/regress 3D? | motion map; timing đo được; `prefers-reduced-motion` PASS; bundle/build size; không thêm frame loop vô ích |
| **G-4 Engineering QA** | Data/URL/session availability/hydration trung thực; test/lint/typecheck/build/security/browser QA? | focused + full tests; lint/typecheck/build/security; browser QA trên local production preview; defect log |

**Luật chống ngụy tạo (áp dụng cho P4–P8):**

1. **Không bịa track map/bản đồ đường đua** rồi trình bày như dữ liệu thật. Artwork minh họa phải ghi rõ “illustrative”/“not an official FIA map” ngay trên UI bằng cả VI và EN.
2. **Không tự tải ảnh tay đua, logo đội, sponsor hoặc track map không rõ quyền.** Ưu tiên asset có sẵn trong repo, SVG/CSS do dự án vẽ, hoặc nguồn có license ghi lại trong `docs/asset-licenses.md`.
3. **Không dùng ảnh mockup làm ảnh website production**, không dùng mockup làm bằng chứng runtime.
4. **Không dùng hình tĩnh giả thay cho bảng dữ liệu tương tác**; bảng/rail/tab phải là DOM thật, có dữ liệu thật.
5. **Không che lỗi bằng `overflow:hidden`.** Overflow chỉ được xử lý bằng layout đúng, wrap, container query hoặc scroll container có chủ đích và có affordance.
6. **Logo PODIUM EDS chính thức là bất biến** theo §3.1; không thay bằng wordmark mockup.
7. **Giữ nguyên dữ liệu Results Engine, URL/query params, session availability và state hydration trung thực.** Không hardcode round giới hạn, không tạo kết quả giả.
8. **Không thêm route `/circuits`/Circuit Explorer** khi chưa có owner phê duyệt riêng.
9. **Không sửa Model B, Inside the Machine hoặc API/data ingestion** ngoài phạm vi phase đang mở.
10. **Không commit/push/merge/deploy/cleanup** trong lúc phase còn `OWNER_REVIEW`.

**Trạng thái gate:** mỗi gate ghi `PASS`, `PARTIAL`, `FAIL` hoặc `NOT RUN`. `NOT RUN` không bao giờ được coi là PASS; `PARTIAL` chặn `APPROVED` trừ khi owner chấp nhận rủi ro có ghi trong plan.

## 4. PHASE MAP — ONE-PHASE-AT-A-TIME

Mỗi phase có 4 tầng nghiệm thu: **Layout/UX** (đúng thứ bậc và luồng sử dụng), **Visual/Image** (ảnh trước/sau đúng baseline), **Motion/Performance** (không làm chậm hoặc phá chất lượng 3D), **Engineering QA** (logic, data, accessibility, test và security). Không coi "thay màu cho đẹp" là một phase hoàn chỉnh.

| Phase | Kết quả để owner review | Điểm dễ regression phải bảo toàn | Sau approval mới cleanup |
|---|---|---|---|
| **P0 · Intake/Discovery** | Danh bạ 3 docs, bản đồ routes/assets/skills, ảnh và motion baseline, xung đột/plan cập nhật | Không thay đổi working tree, không truy cập nhầm F1-Overview | Không xóa file ở P0; chỉ lập inventory |
| **P1 · Design system** | Tokens, font VI/EN, grid responsive và shared UI mẫu trên browser | `DESIGN.md`, Tailwind CSS 4, legibility, team identity | Gỡ tokens/CSS thử trùng sau khi owner duyệt |
| **P2 · Global shell/intro** | Navbar mới desktop/mobile, truy cập tab, route transitions và intro đúng nhịp | URLs/deep-links, localStorage/sessionStorage, 3× 3350ms, skip/reduced | Gỡ logic/menu/overlays cũ không dùng |
| **P3 · Homepage** | Hero có hierarchy mạnh, Model/Video có fallback, Race Intelligence và nội dung editorial sắp lại | Race schedule thật, 3D runtime, low-end mode, no duplicate canvas | Gỡ section/card/hero bản thay thế và CSS thừa |
| **P4 · Competition** | Results/session UI sticky, classification readable; Calendar/Circuits dễ khám phá | Results availability, timezone, season/round/query, sessions FP/Sprint/Q/Race | Gỡ duplicated controls, obsolete layout CSS |
| **P5 · Standings & Profiles** | Podium top 3, team-tinted cards, drivers/teams directory và profile có hierarchy | Verified rankings, identity contrast, links, i18n, asset rights | Gỡ profile components/styles cũ sau ref check |
| **P6 · Showroom 3D** | Model B viewer ưu tiên diện tích xe, compact control dock, Advanced drawer | Meshopt, adaptive modes, disposal, WebGL fallback, DEV boundary | Gỡ UI pane dư/legacy chỉ khi chắc chắn không còn phụ thuộc |
| **P7 · Engineering** | Inside the Machine/Car Anatomy/Insights đồng bộ visual/UX | 6 chapters, 75 transforms, 7 waves, native scrub, DEV boundary | Gỡ styles/duplicated UI, **không xóa assembly/source model** |
| **P8 · Integration/Portfolio** | Tổng thể nhất quán, accessibility, perf, About/Credits/portfolio case study, release report | SEO, security, data, performance, license, production exclusion | Consolidate evidence/docs; dọn preview/QA rác đã phê duyệt |

**Lộ trình phụ thuộc:** `P0 → owner Gate 0 → P1 → owner Gate 1 + cleanup verified → P2 → … → P8`. Trong P4/P5/P7, agent có thể chia work package nhỏ và xin mini-review, nhưng **không chuyển sang phase kế** cho đến khi owner duyệt phase hiện tại.

**Thứ tự sửa thực tế:** (a) component/layout hierarchy → (b) visual style/asset → (c) interaction/motion → (d) performance/accessibility → (e) screenshot/QA → (f) owner review → (g) cleanup + re-QA. Tránh "CSS patch first" gây override chồng chéo.

### P1 — Design foundation & component tokens

**Scope (revision 1.3):** lập mapping từ **7 mockup + Design Spec** → existing components; chốt token map carbon/ignition/ivory/signal, spacing/radius/border/focus/typographic scale trong **một token source canonical**; giữ đúng **4 font roles** theo D2 (Barlow Condensed display, Space Grotesk UI, Manrope body, IBM Plex Mono data) và đồng bộ `DESIGN.md`; chuẩn hóa shared primitives (button, tab/chip, panel, display heading/eyebrow, table header, focus ring); xác nhận grid responsive. **Không import `ignitionV2.css`** (D3). **Không redesign Navbar/home/showroom trong P1.**

**Hotfix bắt buộc:** (1) **D-P0-01** About H1 contrast ≥4.5:1; (2) **D-P0-02** countdown reduced-motion hiển thị đúng chữ số. Hai fix không được đổi layout/data/route.

**Motion:** chỉ tokens/easing, focus/hover sample; không tạo global WebGL hoặc page-wide continuous animation; không đổi intro default.

**Deliverables:** token map + `DESIGN.md` diff, 2–3 component samples trên route thật, scope diff, before/after screenshots, hotfix regression evidence, QA evidence. **Acceptance:** theo §13.10 Gate 1.

### P2 — Header/navigation, routing + intro

**Scope:** **D4 — redesign Navbar desktop/mobile** theo mockup wordmark/link/CTA; map nhãn mockup (`Overview`, `Races`, `Standings`, `Drivers`, `Teams`, `Engineering`, `3D Showroom`) vào route hiện có, **không thêm route**; giữ active state, deep link, query params, VI/EN, keyboard/Escape/focus restoration; fix D-P0-03. Quyết định bỏ bottom tab bar hay chuyển thành drawer chỉ sau khi kiểm chứng safe-area 375/390/768. Dropdown/mega-menu chỉ giữ nếu thật sự cần.

**Motion:** review intro 1×/2×/3× hiện có (3× = ~3.35s), **không tự đổi**. Design Spec ghi mục tiêu 0.8–1.2s — đây là **xung đột chưa có quyết định owner**; giữ default hiện tại và chỉ lập A/B sau khi owner duyệt. Đo real duration, visible content timing, skip/ESC, reload/first-visit, reduced motion; transitions ngắn và không che nội dung.

**Acceptance:** truy cập keyboard, Escape, focus restoration, VI/EN, no scroll jump, intro không kẹt khi mất video/WebGL, mobile menu không overflow; 0 duplicate-key warning; video quay mở/đóng/skip.

### P3 — Homepage cinematic

**Scope (D5, mockup 01):** tái cấu trúc section homepage theo **01_Homepage** — hero editorial “RACE BEYOND LIMITS.” với eyebrow/side meta/circuit HUD, **Latest Grand Prix** dùng kết quả thật, card dẫn Race Center/Showroom và card category trỏ route thật; giữ countdown/season overview/featured race/story data. Không dùng tên/điểm/kết quả hư cấu trong mockup. Full-bleed hero có mô hình/film nhưng content/CTA đọc được; loại card trùng ý, không đè CSS tạo 2 hero. Giữ đúng upcoming/current race từ nguồn; fix D-P0-04.

**Motion:** Anime.js scoped reveal có cleanup, camera/video có pause ở ngoài viewport, reveal không chặn nội dung, static mode cho yếu/reduced-motion. Hero ưu tiên reuse EDS-G01/Model B DEV theo boundary, không tạo renderer thứ hai. Không thêm perpetual flames/particles GPU-heavy.

**Acceptance:** 1st viewport/CTA rõ ở 375–1920, hai ngôn ngữ, no CLS/jank, screenshot + video, poster fallback đúng, CPU/GPU không tăng vô lý.

### P4 — Race Center, Results, Calendar/Circuits

**Scope (mockup 02 + 07):** tổ chức Championship thành hierarchy dễ hiểu; sticky season/round/session controls và các vùng scroll riêng hợp lý; Results chỉ hiện round có dữ liệu xác minh, session columns đúng loại; các trạng thái Scheduled/Unverified/Empty không nhầm với 0. Calendar vẫn hiển thị schedule, timezone đúng, thêm filter All/Completed/Upcoming và Next Race thật. Circuit Map chỉ dùng dữ liệu hình/track khi có nguồn rõ; **không tạo `/circuits`** hoặc Circuit Explorer mới nếu không có owner duyệt riêng (mockup 07 có màn hình này nhưng repo chưa có route).

**Motion:** tabs/subtle row updates và indicators 140–420ms; không animate dày bảng hay gây khó đọc; disable khi reduced-motion. Support keyboard role/tab focus, screenreader live region hợp lý.

**Acceptance:** FP1 FP2 FP3 Qualifying (Q1/Q2/Q3), Sprint Qualifying, Sprint, Race theo data availability; R18 và các round tương lai được hiển thị theo dữ liệu thực tại thời điểm test; không hardcode R18 như giới hạn mãi mãi. Back/forward, query params, sticky không che bảng, high-density data usable mobile. Screenshot các tab và empty states.

### P5 — Driver Standings, Constructor Standings, Drivers & Teams

**Scope:** top-3 podium presentation và compact standings table, season/filter/search, team background identity tint thay vì stripe nhỏ; team and driver directory/profile hero, liên kết cross-profile, stats phân tầng. Dữ liệu/phân hạng sử dụng state hiện tại và nguồn xác minh. Không dùng logo/ảnh thật nếu rights chưa duyệt.

**Motion:** podium/list stagger nhẹ, hover/focus, bảng số tabular; tránh perpetual counting hoặc gây hiểu nhầm số liệu chính thức.

**Acceptance:** contrast nền theo từng team, mobile cards/table, không giả career data, tất cả CTA và deep link hoạt động, responsive và VI/EN.

### P6 — Showroom 3D / Model B experience

**Scope:** xe chiếm không gian chính; compact dock cho camera/preset, paint dễ thấy, Advanced drawer có thể cuộn và không bị clip theo chiều cao. Không tái tạo panel trái hoặc fallback car trùng lặp. **D6:** layout/shell/controls dùng chung cho **Model B DEV** và **EDS-G01 production**, nhưng hai model tách biệt qua adapter và không publish Model B. Reuse loader/quality profile, livery storage, preset cameras và hotspot semantics. Ranh giới DEV/production giữ nguyên; production parity phải được kiểm bằng local build/preview (D7).

**Motion:** camera dolly/ease có chủ đích, material transition an toàn; GPU-friendly; `frameloop`/DPR/adaptive controller/visibility/Retry không bị phá. Check WebGL context loss và 3 quality tiers; không ép 3D trên máy không hỗ trợ.

**Acceptance:** paint/camera/lighting/advanced đầy đủ ở 375×812 và 768×1024, không mất control, model load/abort/dispose không leak, GPU/frame metrics recorded, no second canvas, ảnh poster fallback đủ rõ.

### P7 — Engineering: Inside the Machine + Car Anatomy + Insights

**Scope (mockup 05):** giữ REV4.2 tại `/engineering` trong DEV, masthead gọn và navigation chapter, sidebar/inspector, chapter typography, focus explanation, no overlay che model; Insights index và article deep links, Car Anatomy. **Không đổi tên/ghép chapter ITM theo mockup** (mockup dùng Aerodynamics/Power Unit/Chassis/Suspension/Tyres/Safety; ITM hiện có 6 chapter riêng), không tự viết lại 75 transforms, không dùng one-mesh Showroom model để giả exploded assembly, **không áp V2 CSS lên ITM**.

**Motion:** scrub chapters, 7 waves wheel-first, reverse, inspector pause/resume và camera parity; video capture các mốc trạng thái. Đánh giá low-end reduced-motion và pause khi page hidden.

**Acceptance:** tất cả 6 chapters, assembly/component counts, 75 transform final parity, locked quality, Retry/WebGL, VI/EN, mobile, accessibility labels; DEV/prod exclusion vẫn PASS.

### P8 — Full polish + portfolio readiness

**Scope:** nhất quán mọi routes và states, dark/light intentional sections, typography, images, hover/tap, motion hierarchy, SEO/credits/attribution, about/portfolio project story, performance budgets, security/data and production boundary. Phân loại blocker riêng `DESIGN_ACCEPTANCE` và `RELEASE_APPROVAL`.

**Motion:** motion inventory toàn app, không duplicate timelines, reduced-motion toàn trang, no background running scene ngoài viewport; video poster/fallback khi API/model lỗi.

**Acceptance:** toàn bộ E2E regression, visual review, 200%/400% zoom, real-device FPS, Web Vitals measurement. Release vẫn HOLD nếu chưa đủ rights/perf/owner signoff.

## 5. MANDATORY VISUAL QA — KHÔNG CHỈ TEST BUILD

Mỗi phase phải tạo bằng chứng **trên web app thật chạy local**, không dùng PNG mockup dựng hoặc preview.html thay thế:

1. **Before & after:** cùng URL, viewport, language, state, dữ liệu/fixture, browser. Chụp hình trước khi sửa và sau khi sửa.
2. **Viewport matrix:** desktop `1920×1080`, `1440×900`; tablet `1024×768`, `768×1024`; mobile `390×844`, `375×812`. Lặp cho VI + EN khi trang có copy.
3. **Visual critique checklist:** (a) hierarchy/CTA (b) proportions/whitespace (c) typography VN/EN (d) palette/team color (e) contrast/legibility (f) icon/image crop/provenance (g) sticky overlap (h) mobile overflow (i) consistent states (j) match design intent. Đánh dấu PASS/FAIL từng mục, không chỉ "đẹp hơn".
4. **Image QA:** thực tế tải 200/404, file sizes, natural dimensions, `alt`, responsive `srcset` nếu có; poster/model fallback; crop/object-fit; artwork rights. Mockup race data luôn ghi illustrative.
5. **Playwright:** screenshot snapshots và trace, console/pageerror/network checks; có thể thêm `@playwright/test` & `@axe-core/playwright` nếu đã duyệt. So sánh pixel chỉ với baseline cùng OS/browser/scale; với concept không pixel-match 1:1 mà so hierarchy.
6. **Accessibility:** keyboard-only, focus visible/restore, semantic tabs/landmarks, screenreader manual subset, contrast, `prefers-reduced-motion`, 200%/400% browser zoom; target WCAG 2.2 AA.
7. **Approval evidence:** contact sheet hoặc một gallery duy nhất per phase, không hàng trăm ảnh rải trong `docs`; nêu phần khác concept và lý do.

**Minimum visual acceptance:** không horizontal overflow không chủ đích; không text clip/overlap; tất cả CTA/tabs/drawers có affordance; color contrast đủ; 0 uncaught runtime errors; before/after rõ ràng và owner chọn `APPROVED`.

## 6. ANIMATION / MOTION QA CONTRACT

| Tình huống | Phải kiểm tra | Cấm |
|---|---|---|
| Intro | elapsed time thực, 1x/2x/3x, skip, session/refresh, reduced | đổi mặc định khi chưa owner đồng ý; intro chặn trang khi resource hỏng |
| Page transition | input/route phản hồi, focus/back, event cleanup | giữ overlay quá lâu, blocking navigation |
| Scroll/reveal | IntersectionObserver/Anime.js scope teardown, offscreen pause | listener leak, unnecessary frame loops, animate layout continuously |
| Tab/dropdown | keyboard states, selected indicator, mobile gesture | hover-only UI, scroll jump, blurred text |
| Hero video | autoplay fallback, poster, end/error, intersection, mobile low-end | video tải bắt buộc cho mọi user |
| Model B/ITM | FPS, P95, 1% low, GPU timer support, quality lock, context restore | duplicate WebGL, asset publish ngoài review, sửa scene choreography vô căn cứ |
| Reduced motion | no forced movement, access to all content | ẩn content hoặc tính năng vì disabled animation |

**Candidate animation budgets (phải đo/chốt ở P0/P2):** microinteraction 140–240ms, page navigation 250–450ms, reveal 400–650ms; không lấy con số concept làm bằng chứng runtime. Các hiệu ứng cần lý do UX và motion map: `trigger → sequence → duration → easing → fallback → cleanup`.

## 7. PERFORMANCE & SECURITY QUALITY GATES

**Baseline first:** ghi Chromium/browser, OS, GPU/device, DPR, thermal/power status, cache state và phiên bản assets. Không báo FPS 60 nếu chưa đo trên máy mục tiêu.

- **Core Web Vitals (mục tiêu thực địa nếu có data):** LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 tại p75; lab scores chỉ là chỉ báo, không thay field data.
- **3D:** so FPS/1%-low/P95 frame time và memory trước/sau trên desktop trung bình và integrated GPU; AUTO phải downgrade/upshift an toàn, không dao động; HIGH/BALANCED/PERFORMANCE modes phải đúng.
- **Assets:** GLB integrity/hash và Meshopt decode, GPU textures/material disposal, lazy load, poster fallback, no duplicate request on React StrictMode.
- **Network:** verify data calls, API errors/timeouts/stale; không thêm third-party remote analytics hoặc API ngoài trust boundary.
- **Security scripts:** `npm run security:secrets`, `npm run security:assets`, `npm audit --audit-level=high`, `npm run build`; verify public build **không chứa** Model B/ITM asset local.
- **Compile & regression:** `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run cloudflare:dry-run -- --env=""` khi phù hợp; phải chạy từ root và ghi exit codes. QA phù hợp phase và toàn app; CI/preview chỉ sau owner cho phép.

## 8. PHASE GATE & CLEANUP PROTOCOL — QUY TẮC BẮT BUỘC

### 8.1 Status transition

`NOT_STARTED → IN_PROGRESS → QA_READY → OWNER_REVIEW → APPROVED → CLEANUP_VERIFIED → NEXT_PHASE`

- Không chuyển phase vì script PASS một mình. Owner phải phản hồi phê duyệt rõ `APPROVED Pn` (hoặc câu tương đương); nếu `CHANGES_REQUESTED`, tiếp tục phase hiện tại. Nếu QA FAIL/P0-P2 → `HOLD`.
- Sau approved, **chỉ xóa các artifact cũ/thừa theo manifest đã xác minh**. Cleanup là một subgate, không phải dọn mọi thứ mang tên "old".
- Mọi phase phải giữ rollback path cho tới khi cleanup verification xong. Không tự push/commit/merge/deploy trong quy trình này.

### 8.2 File lifecycle & chống rác (áp dụng từng phase)

1. **Inventory trước sửa:** liệt kê target files/asset refs/route imports, baseline git status, các file user chưa commit. Không sửa `docs` mới của owner ngoài scope.
2. **Một canonical implementation:** nếu tạo file mới thay file cũ, đánh dấu `REPLACED`, không giữ cả `new`, `final`, `final2`, `v3` trong source; refactor imports/tests/path trước khi xóa.
3. **Working artifacts vào ignored scratch:** dùng `scratch/ignition/<phase-id>/` cho ảnh/video/trace/lighthouse/log; không commit bulk screenshots, mp4, node_modules, dist, temporary GLB. Nếu chưa ignored, thêm ignore sau approval cần thiết.
4. **Sau QA và owner APPROVED:** sinh `CLEANUP_MANIFEST` (`path | reason | ref search | backup location | decision | result`). Xác nhận import/route/assets refs bằng `rg`, `git grep`, test/build, và `git ls-files` / ignore status.
5. **Xóa mục được phép:** temporary CSS overrides bị thay, unused React components/styles, duplicate test artifacts/screenshot runs, generated previews không dùng; **sử dụng `git rm`/editor delete có chủ đích**, không `rm -rf` toàn bộ vùng rộng.
6. **Bảo tồn:** `.local-assets`, `source-assets`, license/attribution, original asset + fallback đang được dùng, test baselines quan trọng, 3 docs owner, last-known-good evidence cần rollback, README/QA cốt lõi. Không xóa video source/model source của owner.
7. **Rollback:** đảm bảo có phương án khôi phục từ Git hoặc backup **ngoài source tree/ignored**, kiểm thử rollback được thực hiện nếu có thay đổi destructive cao; không xóa backup trước owner closeout.
8. **Re-QA sau cleanup:** chạy `git diff --check`, typecheck/lint/tests/build/asset scan; chạy browser smoke targeted và kiểm tra các route ảnh hưởng. Nếu FAIL → phục hồi, phase chuyển HOLD.
9. **Artifact retention:** chỉ giữ **một master plan**, **một consolidated review log** và **một final release QA** trong docs; mỗi phase tối đa một chọn lọc before/after/contact sheet và motion sample cần thiết khi owner muốn giữ. Phần còn lại scratch ignored, sau cleanup xóa only approved obsolete temporary runs.
10. **End state:** `git status` chứa **chỉ file có chủ đích**; danh sách orphan files = 0 theo phạm vi scan, no obsolete CSS imports/assets, no duplicate renderer/timers. Các file quan trọng ngoại lệ ghi lý do rõ.

### 8.3 Hard-no-delete list

Không chạy các lệnh destructive hàng loạt như `git clean -fdx`, `git reset --hard`, `git push --force`, rewrite history, xóa toàn bộ `docs/`, `source-assets/`, `.local-assets/`, `scratch/` không kiểm kê, hoặc xóa files còn references. Không tự xóa *bản cũ đang được production sử dụng* chỉ vì DEV có bản mới; cần full release gate và owner.

### 8.4 Pn Closeout report (mẫu bắt buộc)

- `Phase ID / base HEAD / local status / scope + diff`
- `Docs read (3/3) / skills used + version/installation verified`
- `Layout before/after + final browser screenshots VI/EN, 375/768/1440 + remaining viewport matrix`
- `Motion evidence (timings, state transitions, reduced motion) / 3D FPS if relevant`
- `QA commands + numeric results / browser & accessibility findings / unverified items`
- `Asset & license manifest / production boundary PASS?`
- `Cleanup candidates list (NOT executed before approval) / retained file list / rollback`
- `Owner decision: APPROVED / CHANGES_REQUESTED / HOLD`
- **After approval:** `Cleanup executed paths / search dependency proof / post-clean QA / CLEANUP_VERIFIED`.

## 9. REPO FILE POLICY — MINIMAL DOCS

**File policy từ lúc P0:** tối đa một master plan chuẩn và một thư mục scratch ignored; chỉ tạo file report khác khi thật sự cần nghiệm thu. Không nhân bản plan theo version.

```text
docs/
  IGNITION_MASTER_PLAN.md          # ONE authoritative plan + changelog + owner decisions
  qa/
    ignition-final-qa.md           # CHỈ tạo khi P8 thực sự cần bản final QA độc lập

scratch/ignition/                  # ignored theo .gitignore đã xác minh, không push
  p0-baseline/
  p1-design/
  p2-shell/
  p3-home/
  p4-race/
  p5-profiles/
  p6-showroom/
  p7-engineering/
  p8-final/
```

Nếu owner đã có tài liệu làm nhiệm vụ tương đương, **update existing**, không tạo file trùng. Phase status và owner decisions ghi ngay trong master plan, không tự tạo `PLAN_FINAL_v2.md`, `QA_REPORT_2.md` hay nhiều nhật ký song song. Không copy 7 mockup/ZIP lớn vào Git trừ khi explicitly owner quyết định giữ và kiểm tra license/size. Dùng liên kết/path ngoài source tree với version hoặc checksum khi cần truy xuất.

## 10. OWNER DECISION CHECKPOINTS

Các quyết định **D1–D8 đã được owner cung cấp ngày 30/10/2026** và được ghi nhận chi tiết ở §13.8. Đây là **cam kết phạm vi**, không phải bằng chứng đã triển khai. Gate 0 chỉ APPROVED khi owner xác nhận rõ `GATE 0 APPROVED` cho revision 1.3.

1. **D1 — RECORDED:** 7 mockup + Design Spec là visual target chính; V2 chỉ reference phụ.
2. **D2 — RECORDED:** giữ 4 font roles trong code; đồng bộ `DESIGN.md` ở P1.
3. **D3 — RECORDED:** không cài/áp V2 patch CSS toàn cục.
4. **D4 — RECORDED:** redesign Navbar + mobile navigation, giữ accessibility/routes.
5. **D5 — RECORDED:** giữ dữ liệu thật, tái cấu trúc homepage theo mockup.
6. **D6 — RECORDED:** showroom layout dùng chung, Model B DEV/EDS-G01 production tách biệt.
7. **D7 — RECORDED:** cho phép local build/preview; **cấm deploy**.
8. **D8 — RECORDED:** bảo vệ source assets; cleanup chỉ sau manifest + xác minh an toàn.
9. [SEPARATE GATE] Commit/push/merge/deploy và quyền phát hành model/dữ liệu: **vẫn độc lập**; D7 không cấp quyền deploy, Gate 0 không cấp quyền commit/push.

## 11. HANDOFF PROMPT CHO CODEX / ANTIGRAVITY (DÁN VÀO KHI GIAO VIỆC)

> Bạn đang làm việc trong repository `Podium-Effet-De-Sol`, nhánh `migration/clean-architecture`. Chỉ làm một phase tại một thời điểm và **đọc đủ tài liệu trước khi code**. Đầu tiên liệt kê và đọc ba tài liệu owner mới thêm vào `docs/`, cùng `README.md`, `PRODUCT.md`, `DESIGN.md`, `docs/PODIUM_EDS_MASTER_SUMMARY.md`, asset licenses, QA reports, `AGENTS.md` nếu tồn tại, và master plan này. Báo rõ file đã/không đọc; đối chiếu Git working tree và HEAD; lập requirement/conflict matrix, phân biệt nguồn concept với code thật. Nếu chưa đọc đủ 3 tài liệu hoặc owner chưa duyệt Gate 0: **STOP — không triển khai.**
>
> Với mỗi phase đã được duyệt: xác minh skills thực sự có (frontend design, design DNA, React best practices, Impeccable, motion, Three.js, Playwright, accessibility); không cài thêm dependency khi chưa chứng minh cần. Thiết kế lại bố cục + UX + visual, không chỉ override CSS. Trước khi thay đổi chụp screenshot browser thực tế; sau đó kiểm tra VI/EN, 375/390/768/1024/1440/1920, keyboard, zoom, reduced motion, loading/error/empty states, route/query, console. Đo animation bằng timing/video và 3D bằng FPS/P95/quality/fallback khi liên quan. Bảo toàn Results Engine, Model B/Inside the Machine DEV boundary, assets/licensing, API/security tests.
>
> Trước owner gate: báo cáo ảnh before/after, motion, QA, files changed, cleanup candidates, risks. Không chuyển phase nếu chưa có owner approval. **Sau khi owner APPROVED**, dọn file trùng/rác theo CLEANUP_MANIFEST có kiểm tra references/backup và chạy lại QA; chỉ khi CLEANUP_VERIFIED mới được mở phase tiếp theo. Tuyệt đối không tự stage/commit/push/merge/deploy hoặc xóa source/user documents/asset chưa được owner duyệt. Dừng tại OWNER REVIEW.

## 12. EXTERNAL SOURCES (KIỂM TRA 30/10/2026)

- Design DNA: https://github.com/zanwei/design-dna — Agent Skill phân tích screenshot thành design token/style/visual effects, MIT.
- Impeccable critique/audit/polish: https://impeccable.style/docs/critique/ ; https://impeccable.style/docs/audit/ ; https://impeccable.style/docs/polish/ .
- Anime.js v4 Scope: https://animejs.com/documentation/scope/ — component/root/media-query scopes & revert.
- Playwright screenshot comparisons: https://playwright.dev/docs/test-snapshots .
- Playwright accessibility with axe-core: https://playwright.dev/docs/accessibility-testing .
- R3F scaling/on-demand rendering: https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/scaling-performance.mdx .
- WCAG 2.2: https://www.w3.org/TR/wcag/ .
- Core Web Vitals thresholds: https://web.dev/articles/defining-core-web-vitals-thresholds .

## 13. P0 EVIDENCE — REMOTE SNAPSHOT + LOCAL EXECUTION (30/10/2026)

Bảng **13.0** là kiểm tra đọc từ GitHub lúc preflight; các bảng **13.1–13.13** là kết quả chạy local trên ổ `E:` sau đó. Không trộn hai mức evidence.

### 13.0 Remote preflight snapshot (historical)

| Hạng mục | Evidence | Trạng thái |
|---|---|---|
| Repository | `DB-Ducbao113/Podium-Effet-De-Sol`, nhánh `migration/clean-architecture`, HEAD `d4838ad5be4c809dc020c52fe84ae47edcdb67c3` lúc 17:54 VN | Verified remote |
| Local docs | Remote `docs/` không có 3 docs mới; local P0 sau đó đã đọc **3/3** — xem §0.1 | **SUPERSEDED BY LOCAL P0** |
| Repo layout | npm workspaces: `apps/web`, `apps/api`, `apps/jobs`, `packages` | Verified remote |
| Dependencies | React/R3F/Three.js/Zustand, Vite, Tailwind CSS 4, Anime.js v4.5, Meshoptimizer, Playwright-core, Vitest | Verified package files |
| Intro | Config 1×=6200ms, 2×=4250ms, 3×=3350ms mặc định, có reduced/skip/session | Verified source; **local P0 measured** |
| Model B quality | HIGH=1.0, BALANCED=.75, PERFORMANCE=.67 scale; AUTO/adaptive controller & metrics | Verified source; **local headless only** |
| `Inside the Machine` | `/engineering` là DEV experience; production legacy; route `/engineering/insights`, `/engineering/car-anatomy` | Verified source/docs; **local structure verified, FPS NOT RUN** |
| Git ignore | `scratch/`, `.local-assets/`, `references/`, `archives/`, `*.mp4`, `*.webm`, builds; **`source-assets/` chưa ignore** | Verified `.gitignore` |
| License | Model B CC BY 4.0 + attribution; trademark/trade dress/owner approval vẫn cần xem xét | Verified docs, rights not cleared |

**Xung đột font cũ:** `DESIGN.md` quy định Space Grotesk body/UI và 3 font tokens, nhưng code hiện dùng Manrope body, Space Grotesk UI cùng 4 tokens. → **Đã chốt D2 (revision 1.3):** giữ **4 font roles đang dùng trong code** (Barlow Condensed display, Space Grotesk UI, Manrope body, IBM Plex Mono data); `DESIGN.md` được đồng bộ ở P1; **không đổi font, không thêm Bebas Neue**. Với mục tiêu phi thương mại, điều chỉnh các điều khoản release phù hợp portfolio nhưng không tự mở DEV/public asset boundary.

### 13.1 DOC_REQUIREMENTS_MATRIX — yêu cầu chính từ 3 docs + Design Spec + 7 mockup

| Nguồn | Yêu cầu đã trích | Ảnh hưởng | Xung đột/decision |
|---|---|---|---|
| `IGNITION_MASTER_PLAN.md` §15 | Chỉ P0; đọc 3 docs; screenshot 375–1920 EN/VI; inventory intro/Anime/Model B/ITM; cập nhật plan in-place; dừng chờ Gate 0 | Toàn bộ P0 | Không có; đã tuân thủ |
| `README.md` patch V2 | Patch **review-only, chưa áp dụng**; chỉ đổi CSS + import + 3 phần tử hero; không đổi API/data/route/model/motion/intro | P1–P3, P6–P7 | D3: dùng làm reference hay áp dụng |
| `QA_REPORT.md` patch V2 | Chỉ static CSS/installer/preview PASS; full app build/browser QA **chưa chạy**; **REVIEW READY, NOT RELEASE APPROVED** | P1/P3 | Không được coi preview là runtime evidence |
| `DESIGN.md` | 3 font tokens; Space Grotesk body/UI | P1 token system | **D2 đã chốt:** giữ 4 roles trong code; đồng bộ DESIGN.md ở P1 |
| `IGNITION_Design_Spec.md` | Page templates 01–07; carbon/ignition/red/ivory/signal palette; display typography; intro 0.8–1.2s; page transition 250–450ms; content reveal 400–650ms; QA 375–1920; reduced-motion bắt buộc; dữ liệu minh họa, không fake kết quả | P1–P8 | D1 target chính; xung đột intro/token ghi ở §13.13 |
| 7 mockup IGNITION | Bố cục từng trang, top-3 podium, latest GP, showroom panel, calendar/circuit explorer; có mobile frame; dữ liệu hư cấu | P2–P7 | D1/D5: chỉ layout; **không copy data/logo/ảnh/track map**; route Circuit Explorer chưa có |
| `PRODUCT.md` + `AGENTS.md` | Bảo toàn dữ liệu/results, không fake, QA evidence, không tự release | Mọi phase | Không có |
| V2 `ignitionV2.css` | Palette mới `#07090d/#ff4a18/#e51b37/#ff721b/#ffc16d`; display headings; hero eyebrow/HUD/grid; nav/cards/tables/showroom/anatomy skin; ITM **không** bị skin | P1–P8 | **D3: không import toàn cục**; chỉ reference |

### 13.2 BASELINE_MATRIX — route → component → visual → motion → model → boundary

| Route | Component chính | CSS/visual | Motion/3D | DEV vs production | Ghi chú P0 |
|---|---|---|---|---|---|
| `/` | `HomeView` → `PodiumBrandHero`, ticker, countdown, season overview, featured race, story links | `index.css`, `homepageH1.css`; R1 dark | Anime.js scoped reveal; DEV Tokyo Drift video; prod EDS-G01 static/3D | DEV hero video ≠ production | Hero không eyebrow/HUD/grid; 375/390 telemetry bị tab bar che |
| `/season/:year` (`tab=standings/calendar/results/teams/drivers`) | Championship hub + f4/c1/c11 components | `f4-*`, `c1-*`, `c11-*` | tab state, query params; không WebGL | Giống nhau; ≤860 dùng mobile hub | 768 tab strip cắt “RACE RESULTS”; title nhỏ hơn target |
| `/showroom` | `ShowroomView`: DEV → `CommercialBReviewShowroom`; prod → `DefaultShowroomView`/EDS-G01 | `peds-compact-studio` | Model B 1 canvas; adaptive AUTO/HIGH/BALANCED/PERFORMANCE | **DEV Model B ≠ prod EDS-G01** | Mobile header cắt “EDS Grap…”, dock/controls bị che |
| `/engineering` | DEV → `InsideMachineTrialPage`; prod → `EngineeringIndexPage` | ITM own cinematic shell; V2 CSS không áp dụng ITM | 6 chapters/46 beats/75 transforms, 1 canvas | **ITM DEV-only** | FPS runtime **NOT RUN**; final parity đúng cấu trúc |
| `/engineering/insights` | Insights index | shared editorial | none | Có ở cả hai | Trong menu DEV |
| `/engineering/car-anatomy` | `EngineeringAnatomyPage` | `anatomy-*` | 1 canvas | Có ở production | V2 CSS có skin anatomy |
| `/engineering/:slug` | `EngineeringArticlePage` | article styles | none | Có | Không đổi dữ liệu |
| `/teams`, `/drivers` | Directory | `r11-shell`, f4 directory | hover/focus | Có | V2 CSS đổi card hover/typography |
| `/teams/:id`, `/drivers/:id`, `/cars/:id` | Profile/detail | `r11-shell.peds-editorial-light`, `profileF4.css` | none | Có | Shell tối đã có từ R1.1; V2 chỉ đổi field gradient |
| `/about` | `AboutPage` | Tailwind `text-studio-*` | none | Có | **H1 contrast 1.01 — gần như vô hình** |
| Global | `Navbar` + mobile hub bottom bar | `h1-nav`; V2 có skin | dropdown/menu, Escape, focus | Có | VI duplicate keys “Đội đua”/“Tay đua” |

### 13.3 Screenshot coverage — ảnh thật, không dùng mockup thay thế

| Matrix | Kích thước | Routes | Ngôn ngữ | Kết quả |
|---|---|---:|---|---|
| Capture chính | 390×844, 768×1024, 1024×768, 1440×900 | 16 ở 1024/1440; 5 primary ở 390/768 | VI + EN | 84 row = 64 (1024/1440 × 16 × 2) + 20 (390/768 × 5 × 2); **0 horizontal overflow**, 0 `pageerror`, 100 console warning (cùng loại duplicate key, 2 nhãn) |
| Capture bổ sung | 375×812, 1920×1080 | 6 route chính (home, standings, showroom, ITM, about, anatomy) | VI + EN | 24 ảnh; phát hiện occlusion 375 |
| Intro states | 1×/2×/3× + mobile + ITM chapter 4/final | — | EN/VI | 5 ảnh intro + 2 ảnh trạng thái ITM (chapter 4/final) |
| Tổng | — | — | — | **129 ảnh** trong `scratch/ignition/p0-baseline/shots/` |

**Giới hạn:** đây là **DEV baseline**; chưa chụp 375/1920 cho 10 route phụ; chưa chụp production build. Ảnh chụp headless có thể lệch frame so với thời điểm đo (SwiftShader chậm) — không dùng ảnh để suy ra timing chính xác; timing lấy từ `intro-report.json`.

### 13.4 VISUAL_GAP_MATRIX — hiện tại vs 7 mockup + Design Spec (revision 1.3)

**Nguồn đích (D1):** **7 mockup toàn trang + `IGNITION_Design_Spec.md`** là visual target chính; V2 CSS/preview chỉ reference phụ. Mockup là **concept review sheet** (ảnh tổng hợp desktop + mobile frame), không phải screenshot app và không phải pixel contract. Dữ liệu trong mockup là hư cấu — chỉ dùng bố cục/thứ bậc/ngôn ngữ thị giác (D5). Ảnh “hiện tại” lấy từ P0 baseline DEV (§13.3); production khác ở hero và showroom (§13.2).

| # | Mockup / route thật | Hiện tại (P0 baseline) | Đích IGNITION (mockup + spec) | Khoảng cách phải xử lý | Phase |
|---|---|---|---|---|---|
| **G1 — Global shell & nav** | 7/7 mockup dùng chung header | Logo badge ảnh + icon/chevron + dropdown; VI/EN pill; menu Home / Championship / Showroom 3D / Inside the Machine / About; mobile bottom tab bar 3 mục | Wordmark phẳng `PODIUM / EDS`; 5–6 link text (Overview, Races, Standings, Drivers, Teams, 3D Showroom; **Engineering** xuất hiện trên mockup 05/06); active underline cam; search icon; globe + EN; CTA cam “EXPLORE 3D”; mobile hamburger, không bottom bar | **D4: redesign Navbar + mobile nav**, giữ route/deep-link/active state/VI-EN/keyboard/Escape/focus. Map nhãn mockup vào route hiện có (`Races` → results/calendar, `Engineering` → `/engineering`, `3D Showroom` → `/showroom`); **không thêm route**. Fix D-P0-03. Bottom bar: chỉ bỏ/chuyển drawer sau khi kiểm chứng safe-area | P2 |
| **G2 — Mobile shell** | 01/06/07 có mobile frame | Bottom tab bar fixed (Home / Championship / Showroom) che telemetry/dock ở 375/390; logo nhỏ; menu overlay | Mobile dùng hamburger + hero stack; showroom dùng panel cuộn/bottom sheet; mockup không có tab bar | Thiết kế lại mobile nav ở P2; P3/P6 chừa safe-area; test 375/390/768; giữ deep link | P2/P3/P6 |
| **01 — Homepage** | `/` — `HomeView` | Hero “ENGINEER SPEED.” + dot đỏ; body copy + 2 CTA; visual video bên phải; telemetry strip; ticker; countdown 4 ô; “The 2026 picture.”; “The season in motion.”; 2 card Showroom/ITM; “Go deeper.” 3 story card; footer | Hero editorial “RACE BEYOND LIMITS.” (dòng 2 cam), eyebrow “THE RACING EXPERIENCE REIMAGINED”, side meta + circuit outline + HUD/grid; 2 CTA; “LATEST GRAND PRIX” panel với round/session tabs + top classification; card Race Center + Showroom; 4 card Drivers/Teams/Standings/Technology | **D5: giữ dữ liệu thật, tái cấu trúc section theo mockup.** P3 dựng lại DOM hero (eyebrow/HUD/circuit/side meta), thêm “Latest Grand Prix” từ race result thật, giữ countdown/season overview/featured race; card category trỏ route thật; **không dùng tên/điểm/số hư cấu**; giữ video/3D fallback + DEV/prod boundary; fix D-P0-04; test 375–1920 | P3 |
| **02 — Race Center** | `/season/:year?tab=results` | “CHAMPIONSHIP HUB” ~35px; hàng tab pill đỏ; panel race “UNITED STATES GRAND PRIX”; round dropdown + arrows; session tabs Race / Qualifying / FP3 / FP2 / FP1; bảng classification | “RACE CENTER” display hero; season chip 2026/2025/2024; legend Completed/Current/Upcoming; round panel có circuit map + length/turns/distance/lap record; session tabs FP1–Race; secondary Results / Lap Chart / Stints / Tyre Strategy; bảng có tyre/points; Q3 + fast-lap panel | P4: display heading + tab skin + sticky session nav; round card/breadcrumb; **chỉ hiển thị circuit facts/lap chart/stints/tyre khi có dữ liệu + quyền**; giữ session availability/query/back-forward; fix D-P0-05; không fake session/kết quả | P4 |
| **03 — Standings & Driver profile** | `/season/:year?tab=standings`, `/drivers`, `/drivers/:id` | Hub title; top-3 card nền team gradient, rank lớn, điểm; bảng dày; profile “Max Verstappen” với stats + constructor card | “STANDINGS” display hero; tab Drivers/Constructors; top-3 podium card có portrait + rank rất lớn; points progression chart; bảng R1–R23; profile “LEO VARESI” với tab Overview/Results/Season/Career/Stats, bio/quote, season stats, recent results, highlights | P5: nâng hierarchy top-3 + display hero; thêm points chart từ dữ liệu thật; **portrait/ảnh tay đua chỉ khi có quyền**, nếu không dùng monogram/team color; profile tab chỉ render tab có dữ liệu thật; mobile top-3 card + bảng compact; giữ standings/identity/contrast | P5 |
| **04 — Constructors & Team profile** | `/season/:year?tab=standings&category=constructors`, `/season/:year?tab=teams`, `/teams`, `/teams/:id` | “Teams” panel + card team; team profile “Scuderia Ferrari HP” với hero + 3 stats + driver card + link | “CONSTRUCTORS’ CHAMPIONSHIP” hero; top-3 team card Nova/Orion/Zenith; bảng constructors, points trend, round breakdown, key stats; profile “NOVA RACING” với Follow Team, View Car in 3D, tab Overview/Drivers/Car/Season/History, driver card, car specification | P5: display hero + top-3 team card + trend/round breakdown từ dữ liệu thật; tab profile map vào dữ liệu hiện có; “View Car in 3D” trỏ `/showroom` (không nhúng canvas mới); **không logo/ảnh xe/team nếu chưa rõ quyền**; không fake history/spec | P5 |
| **05 — Engineering (ITM, Anatomy, Insights)** | `/engineering` (DEV ITM), `/engineering/car-anatomy`, `/engineering/insights` | ITM full-screen: top bar rút gọn, Pause/progress trái, chapter rail phải, 6 chương, 1 canvas; Anatomy: “Inside the speed.” + 7 zone; Insights: hero + 4 feature list | 3-up: (a) ITM landing “INSIDE THE MACHINE” với chapter list 01–06 + copy + stats + 3 số liệu; (b) “CAR ANATOMY” với callout/hotspot + part panel Overview/Technical Data; (c) “ENGINEERING INSIGHTS” với filter category + 2 featured card + grid article | P7: **giữ nguyên ITM REV4.2** (6 chapters/46 beats/75 transforms); không đổi tên/ghép chapter theo mockup; chỉ đồng bộ shell/typography/empty-state có kiểm soát; Anatomy/Insights áp token + card; 3D chỉ khi cần, có static fallback; **không áp V2 CSS lên ITM**; đo runtime thật | P7 |
| **06 — Showroom 3D** | `/showroom` (DEV Model B; prod EDS-G01) | “Engineering studio” header nhỏ; badge “DEV · MODEL B”; Paint/Advanced; xe giữa khung nhiều khoảng trống; dock dưới nhiều nút; mobile badge cắt “EDS Grap…”, dock bị che | “3D SHOWROOM / EXPLORE THE MACHINE”; xe chiếm diện tích chính trên turntable; camera mode dưới canvas; panel phải Paint/Camera/Lighting; team livery swatch (không logo); Glossy/Matte/Satin/Carbon; Advanced accordion Auto/Balanced/Eco + slider + toggle + Reset; mobile bottom sheet/scroll | **D6: layout dùng chung, Model B DEV và EDS-G01 production tách biệt.** P6 sửa layout/component, không chỉ skin: bỏ panel trái trùng, ưu tiên diện tích xe, dock compact, Advanced không clip ở 768/900; giữ loader/quality/livery/preset/disposal; không publish Model B; production parity; fix D-P0-06; real GPU FPS | P6 |
| **07 — Calendar & Circuits** | `/season/:year?tab=calendar`; **không có route circuits** | “Race weekends” panel, timezone select, danh sách round + trạng thái Elapsed, expandable | “RACE CALENDAR” hero + season tab 2026/2025/2024; filter All/Completed/Upcoming; round list trạng thái/ngày; Next Race card + countdown + circuit; weekend schedule + thời tiết; circuit map; previous/upcoming; “Circuit Explorer” Marina Bay với Overview/Track Map/Race History, sector/D Lap/elevation/speed/gear/tyre | P4: calendar hero + filter + next race thật; circuit card chỉ dùng track data/ảnh có nguồn; **không tạo `/circuits` mới** trong P4; “Circuit Explorer” chỉ triển khai nếu owner duyệt route + dữ liệu; không fake lap record/thời tiết/tyre | P4 (calendar) / owner gate (circuit explorer) |
| **G3 — About** | `/about` — không có mockup | H1 `text-studio-950` trên nền tối = 1.01:1; creator card + 2 feature card trắng | Design Spec yêu cầu editorial display H1 + eyebrow + card creator; không có mockup riêng | P1 hotfix contrast bằng token hiện có, không redesign; P8 redesign About theo editorial system | **P1/P8** |
| **G4 — Directory/Profile/Car detail/Article/404** | `/teams`, `/drivers`, `/cars/:id`, `/engineering/:slug`, 404 | `r11-shell` card sáng trên field tối; chữ nhỏ; profile heading lớn | Mockup chỉ bao 03/04/05; các route còn lại áp token/typography chung, không bịa layout | P5/P7/P8: áp token, kiểm contrast, hover/focus, VI/EN; không thay data/identity | P5/P8 |

**Tổng hợp ưu tiên:** G1/G2 → **P2**; 01 → **P3**; 02 + 07 (calendar) → **P4**; 03/04 → **P5**; 06 → **P6**; 05 → **P7**; G3 → **P1 hotfix + P8**; G4 → **P5/P7/P8** (chỉ áp token). **Circuit Explorer (07) chưa map vào route nào — cần owner gate riêng trước khi tạo route.**

### 13.5 MOTION_3D_MATRIX — đo thật và giới hạn

| Hạng mục | Evidence đo được | Trạng thái | Ràng buộc |
|---|---|---|---|
| Intro 1× | visible 361ms → removed 6568ms; **6207ms** | PASS (dev, headless) | Không đổi default nếu owner chưa duyệt |
| Intro 2× | **4247ms** | PASS | — |
| Intro 3× (default) | **3380ms** | PASS | Mục tiêu plan ~3350ms; sai số +30ms |
| Design Spec intro target | Spec ghi **0.8–1.2s** kèm skip/ESC | **CONFLICT — SPEC ONLY** | Trái với default hiện tại 3380ms; **không đổi** khi chưa owner duyệt; P2 chỉ đo và đề xuất A/B |
| Design Spec motion targets | Page transition 250–450ms; content reveal 400–650ms; reduced-motion giữ đủ nội dung | **SPEC ONLY — chưa đo app** | Dùng làm acceptance P2/P3; không thay Anime.js hero hiện có nếu chưa đo |
| Intro skip/ESC | skip → removed **1294ms** | PASS | Giữ skip/ESC |
| Intro reduced-motion | Không xuất hiện | PASS | Không chặn nội dung |
| Intro reload sau seen | `podium-start-lights-seen=1`; không xuất hiện | PASS | Session storage giữ nguyên |
| Anime.js hero | reveal 760ms, stagger 85ms, translateY 18→0, blur 7→0; rail 1100ms; `scope.revert()` | VERIFIED SOURCE | Không thêm timeline toàn trang |
| Model B geometry | 79.929 triangles, 15 draw calls, 2 textures, 15 geometries; GLB **2.120.816 B** | VERIFIED | 1 mesh/7 hotspot như tài liệu |
| Model B load | fetch ~107ms, decode ~24ms, first render **1173–1444ms** | VERIFIED (headless) | Không suy ra thiết bị thật |
| Model B FPS | 5.00 (18 frame), 5.16 (19), 8.73 (2), 11.54 (4) — SwiftShader, 1024×636, DPR 1 | **NOT RUN on GPU** | Không được báo 60 FPS |
| Model B profile | AUTO → HIGH, continuous, không context loss | VERIFIED (headless) | Cần test 3 tier + context loss thật |
| ITM structure | 6 chapters, 46 beats, **75 transforms**, 1 canvas; final chapter 6/beat 36 | VERIFIED | Không sửa choreography |
| ITM metrics | collector trả 0 sample ở initial/chapter 4/final; quality PERFORMANCE locked | **NOT RUN** | Cần đo runtime thật ở P7 |
| Countdown reduced motion | aria đúng “0 Days, 4 Hours…”, nhưng visual hiển thị dãy 0–9 do CSS strip `transform:none!important` | **FAIL** | D-P0-02; **fix bắt buộc ở P1**, không chỉ P3 |
| Production assets | Model B 2.12MB; ITM GLB 8.46/7.67/6.78MB (local); EDS-G01 ~645–660KB | VERIFIED inventory | Không đưa asset local vào public |

### 13.6 SKILLS / DEPENDENCY MATRIX — chỉ ghi thứ thật sự có

| Skill/tool | Có trên máy? | Evidence | Dùng cho |
|---|---|---|---|
| `impeccable` | **Có** (user scope) | `C:\Users\Admin\.qoder\skills\impeccable\SKILL.md` | P1/P8 critique, audit, polish |
| `design-taste-frontend` | **Có** (user scope) | `...\.qoder\skills\design-taste-frontend\SKILL.md` | Tham chiếu art direction |
| `find-skills` | **Có** (user scope) | `...\.qoder\skills\find-skills\SKILL.md` | Chỉ discovery |
| `frontend-design` | **KHÔNG** | Không có SKILL.md | Không được claim đã dùng |
| `zanwei/design-dna` | **KHÔNG** | Không có trong repo/user skills | Cần owner duyệt nếu muốn cài |
| `vercel-react-best-practices` | **KHÔNG** | Không có | Không claim |
| `@playwright/test`, `@axe-core/playwright` | **KHÔNG** | Chỉ có `playwright-core` | P0 dùng script custom; thêm dependency phải được duyệt |
| Anime.js | **Có** | `animejs ^4.5.0` | Hero reveal hiện tại |
| R3F/Three/Meshopt | **Có** | `three 0.165`, `@react-three/fiber`, `meshoptimizer 0.18.1` | Showroom/ITM |
| Vitest/ESLint/TS | **Có** | root/web package scripts | QA phase sau |

**Quyết định P0:** không cài gì. Các skill runtime khác (design, design-system, ui-styling, ui-ux-pro-max…) không được xác minh là repo-pinned; chỉ dùng khi owner cho phép và ghi rõ nguồn.

### 13.7 DEFECTS phát hiện trong P0

| ID | Severity | Component | Reproduction | Expected | Actual | Evidence | Root cause nghi ngờ | Status |
|---|---|---|---|---|---|---|---|---|
| **D-P0-01** | P2 | `/about` H1 | Mở `/about` EN/VI, desktop/mobile | H1 đọc được, contrast ≥4.5:1 | H1 gần như vô hình; **1.01:1** (`rgb(9,9,11)` trên `rgb(5,7,11)`) | `logs/extra-report.json`; `shots/en-mobile-about.png`, `en-1920x1080-about.png` | `AboutPage.tsx:46` dùng `text-studio-950` nhưng không nằm trong `.r1-primary`/dark token mapping | OPEN — **P1 hotfix (Gate 1)** |
| **D-P0-02** | P2 | Countdown reduced-motion | Bật `prefers-reduced-motion: reduce`, mở home | Hiện đúng số đếm; aria khớp visual | Visual hiện dãy 0–9; aria vẫn đúng “0 Days, 4 Hours…” | `logs/extra-report.json` (`countdownReduced`); `homepageH1.css:121` | Rule `transform:none!important` trên `.h25-odometer__strip` phá cơ chế dịch strip | OPEN — **P1 hotfix (Gate 1)** |
| **D-P0-03** | P3 | Navbar VI | Mở bất kỳ route VI | Không warning key; menu không trùng nhãn | React warning “two children with same key” cho “Đội đua”/“Tay đua”; 100 warning/84 row | `logs/capture-report.json`; `Navbar.tsx:30-35` | Hai subitem dùng cùng `child.label` làm key và cùng nhãn VI | OPEN — **P2 (D4)** |
| **D-P0-04** | P3 | Mobile home telemetry | 375×812, home | Telemetry/CTA đọc được, không bị che | Bottom tab bar fixed che telemetry “01 ORIGINAL 3D”/“Continue” | `shots/en-375x812-home.png` | Hero + telemetry không chừa safe-area cho bottom bar | OPEN — **P2/P3** |
| **D-P0-05** | P3 | Championship tabs 768 | 768×1024, `/season/2026?tab=standings` | Tất cả tab đọc được | “RACE RESULTS” bị cắt ở mép phải | `shots/en-tablet-season-standings.png` | Tab strip overflow-x thiếu affordance/scroll padding | OPEN — **P4** |
| **D-P0-06** | P3 | Showroom mobile | 390×844 `/showroom` (DEV) | Badge/label đầy đủ; dock dùng được | Badge “EDS Grap…” bị cắt; dock dưới bị tab bar che | `shots/en-mobile-showroom.png` | Compact studio header/dock không responsive theo safe-area | OPEN — **P6 (D6)** |
| **D-P0-07** | P3 | Git hygiene | `git status` | Không warning | `apps/web/NUL/` rỗng gây cảnh báo “could not open directory”; `source-assets/` 59MB untracked **chưa ignore** | `git status --short` | Thư mục NUL sót lại; source-assets chưa vào .gitignore | OPEN — **D8 cleanup gate (manifest required)** |

**Không có P0/P1 defect nào được xác nhận trong P0.** Không được hạ severity để mở release.

### 13.8 OWNER DECISIONS — D1–D8 ĐÃ GHI NHẬN (Gate 0, 30/10/2026)

**Trạng thái:** owner đã cung cấp quyết định; plan 1.3 ghi nhận và điều chỉnh scope. **Gate 0 vẫn HOLD** cho đến khi owner xác nhận `GATE 0 APPROVED`. Không có quyết định nào được diễn giải rộng hơn câu chữ dưới đây.

| ID | Quyết định owner | Phạm vi P1–P8 | Ràng buộc bắt buộc | Phase |
|---|---|---|---|---|
| **D1** | 7 mockup IGNITION + Design Spec là visual target chính; IGNITION V2 chỉ reference phụ | Mockup dùng cho layout/hierarchy/visual language; Spec dùng cho page template/motion/QA | Không pixel-match; mockup là concept sheet; dữ liệu hư cấu; V2 không được cài; so sánh page-by-page §13.4 | P1–P8 |
| **D2** | Giữ bốn font roles đang dùng trong code; đồng bộ `DESIGN.md` | Barlow Condensed display; Space Grotesk UI; Manrope body; IBM Plex Mono data | Không thêm Bebas Neue/không đổi font; cập nhật `DESIGN.md` trong P1 theo token map được duyệt; test dấu tiếng Việt | P1 |
| **D3** | Không cài/áp V2 patch CSS toàn cục | V2 chỉ đọc tham khảo; implement lại bằng token/component canonical | Không import `ignitionV2.css`; không chạy installer; nếu sau này muốn áp phải có gate riêng + full build/browser QA | P1–P8 |
| **D4** | Redesign Navbar và mobile navigation, giữ accessibility và các routes | Desktop/mobile IA theo mockup; wordmark/link/CTA; language switch | Giữ route/deep-link/query/active state; keyboard/Escape/focus; không thêm route; fix D-P0-03; test safe-area 375/390/768 | P2 |
| **D5** | Giữ dữ liệu thật, tái cấu trúc các section homepage theo mockup | Hero/latest GP/category cards theo 01; giữ countdown/season/featured race | Không dùng tên/đội/điểm/kết quả hư cấu; “Latest Grand Prix” lấy result thật; không thay data bằng card concept; giữ DEV/prod hero boundary | P3 |
| **D6** | Dùng chung showroom layout nhưng tách biệt Model B DEV và EDS-G01 production | Một shell/controls; adapter model theo môi trường | Không publish Model B; không second canvas; giữ loader/quality/livery/preset/disposal; test DEV + local production preview (D7); real GPU FPS | P6 |
| **D7** | Cho phép local build/preview; cấm deploy | P1 có baseline production local; P6/P8 dùng preview local | Chỉ build vào output ignored; không deploy/CI trigger/publish; `wrangler deploy` thật bị cấm; `--dry-run` không phải deploy nhưng không dùng để claim production | P1/P6/P8 |
| **D8** | Bảo vệ source assets; chỉ cleanup sau manifest và xác minh an toàn | `source-assets/`, `.local-assets/`, GLB/Blend/WebP | Không sửa/xóa/stage asset; manifest path/size/hash/reference; owner duyệt trước khi move/delete; `apps/web/NUL` chỉ xử lý sau manifest | P1/P8 cleanup gate |

**Hệ quả cho Gate 0:** các blocker D1/D2/D3/D6/D7 đã có quyết định; D4/D5/D8 cũng đã có quyết định. Không còn “owner chưa chọn” — nhưng **chưa có approval gate**. Nếu owner thay đổi bất kỳ quyết định nào, phải tạo revision 1.4 trước khi P1 bắt đầu.

### 13.9 ROADMAP AMENDMENTS — P1–P8 (revision 1.3)

| Phase | Giữ nguyên | Điều chỉnh bắt buộc từ Gate 0 | Acceptance bổ sung |
|---|---|---|---|
| **P1** | Token/typography/shared primitives; không page rebuild | **D2** token map + đồng bộ `DESIGN.md`; **D3** không V2 CSS; **2 hotfix P2** (About H1, countdown reduced-motion); **D7** local build/preview | Token map + `DESIGN.md` diff được duyệt; About H1 ≥4.5:1; countdown đúng số; 6 viewport × EN/VI; lint/typecheck/test/build PASS; no new package/route/data change |
| **P2** | Shell/nav/intro | **D4 redesign Navbar + mobile nav**; map mockup labels → existing routes; fix D-P0-03; ghi nhận intro conflict, giữ 3350ms | 0 duplicate-key; keyboard/Escape/focus; mobile menu không che content; route/query/deep-link PASS; intro timing ±5%; safe-area 375/390/768 |
| **P3** | Homepage cinematic | **D5 tái cấu trúc section theo 01_Homepage**, dữ liệu thật; Latest GP dùng result thật; fix D-P0-04; production EDS-G01 local preview | 375/390/768/1024/1440/1920 EN/VI; không occlusion; hero eyebrow/HUD/circuit DOM; video/3D fallback; no CLS/jank; no fake data |
| **P4** | Race Center/Results/Calendar | Mockup 02 + 07; fix D-P0-05; display/tab skin; calendar filter + next race thật | Tất cả tab đọc được 768/1024/1440; keyboard tab; empty state; screenshot từng tab; **no `/circuits` route** |
| **P5** | Standings/Profiles/Directories | Mockup 03 + 04; top-3/profile hierarchy; points chart dữ liệu thật; portrait/logo chỉ khi có quyền | Contrast team backgrounds; mobile cards/table; deep link; VI/EN; no fake career/history |
| **P6** | Showroom 3D | **D6 shared layout, Model B DEV/EDS-G01 prod**; fix D-P0-06; không chỉ skin CSS; production parity | Real GPU FPS/p50/p95/1% low; 3 quality tiers; context loss; no duplicate canvas; mobile dock usable; local production preview |
| **P7** | ITM/Anatomy/Insights | Mockup 05; **không áp V2 CSS lên ITM**; giữ 6/46/75; không đổi chapter names; đo runtime thật | 6 chapters/46 beats/75 transforms; final parity; Retry/WebGL; VI/EN; metrics thật; Anatomy static fallback |
| **P8** | Polish/release | About redesign + credits; full visual matrix; **local production build/preview** (D7, no deploy); security/data/license gates; D8 cleanup sau manifest | Full E2E, 200%/400% zoom, Web Vitals, production screenshots local, no Model B/ITM in public build; owner signoff |

**Thứ tự không đổi:** `P0 → Gate 0 APPROVED → P1 → … → P8`; không nhảy phase.

### 13.9.1 P1 SCOPE — CHI TIẾT ĐỂ OWNER DUYỆT

**P1-A — Token foundation (canonical).** Một nguồn token duy nhất cho:
- Palette: carbon/field `#0A0C10`, ignition `#FF4A18`, racing red `#E51B37`, ivory `#F4F0E8`, signal `#B7FF37` dùng tiết chế cho data/live state; giữ nền tối hiện có và kiểm contrast từng cặp.
- Typography: **4 roles cố định theo D2** — Barlow Condensed display, Space Grotesk UI, Manrope body, IBM Plex Mono data; display scale `clamp()`; eyebrow; table numerals; test dấu tiếng Việt ở cả 4 role.
- Spacing/grid/radius/border/focus/reduced-motion tokens. Không copy nguyên `:root` của V2; map có chủ đích và ghi nguồn.

**P1-B — Shared primitives.** Button (primary/outline/ghost), tab/chip, panel/card rule, display heading/eyebrow, table header/row, focus ring; 2–3 mẫu trên route thật (không tạo route styleguide mới).

**P1-C — `DESIGN.md` sync (D2).** Cập nhật tài liệu typography/palette/token theo code canonical; không thêm font file, không đổi font. Owner review diff.

**P1-D — Hotfix D-P0-01 (About H1).** Sửa `AboutPage.tsx:46`/token mapping để H1 đạt **≥4.5:1** trên nền thật ở EN/VI, desktop/mobile; không redesign About.

**P1-E — Hotfix D-P0-02 (countdown reduced-motion).** Sửa rule `homepageH1.css:121` để `.h25-odometer__strip` không bị `transform:none!important` phá cơ chế; ưu tiên render số tĩnh đúng giá trị khi reduced-motion. Acceptance: **visual digits = aria values**; không tắt reduced-motion; có regression evidence (DOM text + ảnh).

**P1 OUT OF SCOPE:** Navbar/mobile nav, homepage restructure, showroom layout, page rebuilds, route/data/API changes, new packages, V2 CSS import, intro timing change, deploy/commit/push.

**P1 QA MATRIX (mandatory):**

| Hạng mục | Yêu cầu | Evidence |
|---|---|---|
| Before/after screenshots | Route bị ảnh hưởng: `/`, `/about`, `/season/2026?tab=standings`, `/season/2026?tab=results`, `/season/2026?tab=calendar`, `/engineering/car-anatomy`, `/showroom` (DEV), `/engineering` (ITM shell) × **375/390/768/1024/1440/1920** × **EN/VI** | Playwright-core custom script (không cài dependency); lưu `scratch/ignition/p1-baseline/`; so sánh trước/sau |
| Animation/reduced motion | Intro 1×/2×/3× không đổi ±5% (6207/4247/3380ms); reduced-motion intro không xuất hiện; countdown reduced-motion đúng số; không thêm page-wide animation | timing JSON + screenshot + DOM text vs aria |
| Accessibility | About H1 ≥4.5:1; focus ring; keyboard tab/ESC; heading order; reduced-motion; VI/EN | computed style/DOM report + keyboard smoke; axe **NOT RUN** nếu chưa có dependency |
| Static gates | `npm run lint`; `npm run typecheck`; `npm test`; `npm run build` | exit code + log |
| Security/boundary | Không secret/dependency mới; `npm run security:secrets`; `npm run security:assets` nếu chạy được | log; ghi NOT RUN nếu không chạy |
| Local production build/preview | `npm run build` + `npm run preview --workspace=@peds/web` (local only); screenshot production home/about/showroom EDS-G01 | local URL + screenshots; **no deploy** |
| Repo hygiene | Không commit/push; không chạm `source-assets/`; không import V2 CSS; không route/data/API mới | `git status --short`; diff stat |

### 13.10 GATE 0 / GATE 1 ACCEPTANCE — tiêu chí nghiệm thu rõ

**Gate 0 chỉ được APPROVED khi:**
1. Owner xác nhận rõ **`GATE 0 APPROVED`** cho revision 1.3 và decisions D1–D8 tại §13.8.
2. Owner xác nhận P1 scope **P1-A…P1-E** và QA matrix §13.9.1.
3. Working tree không có tracked modification; mockup/Spec/V2 docs không bị stage; `source-assets/` không bị stage.
4. Không có P0/P1 defect mới; **D-P0-01/02 (P2) đã được gán hotfix P1**; các defect P3 đã vào phase tương ứng.
5. Nếu owner sửa bất kỳ decision/scope nào, revision 1.4 phải được tạo và duyệt lại trước P1.

**Gate 1 (P1) PASS khi:**
1. Token map + 4 font roles + `DESIGN.md` sync được owner duyệt; **không** đổi font/không thêm Bebas Neue.
2. About H1 computed contrast **≥4.5:1** ở EN/VI, 375/390/768/1024/1440/1920.
3. Countdown reduced-motion **visual digits = aria values**; có ảnh + DOM evidence.
4. Before/after đủ 8 route × 6 viewport × EN/VI (hoặc ghi rõ route không bị ảnh hưởng và lý do).
5. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` đều PASS với exit code thật; có screenshot local production preview; **deploy NOT RUN**.
6. Intro 1×/2×/3× không đổi ±5%; skip/ESC/reduced-motion vẫn PASS.
7. Không import `ignitionV2.css`; không package/route/data/API mới; không commit/push.
8. 0 duplicate-key warning: **NOT RUN ở P1** (thuộc P2) — không được claim PASS.
9. Owner `APPROVED P1`.

### 13.11 NO-TOUCH LIST — P0 và các phase kế tiếp

- Không sửa/xóa `source-assets/`, `.local-assets/`, model GLB/Blend/WebP gốc; cleanup chỉ sau manifest + owner duyệt (D8).
- Không sửa choreography ITM 75 transforms / 46 beats / 6 chapters; không đổi tên/ghép chapter theo mockup; không thay Model B bằng ITM hoặc ngược lại.
- Không đổi API/Results Engine/data ingestion/route URLs/query semantics; **không thêm `/circuits`, `/stories`, `/races`** hoặc route mới khi chưa duyệt.
- Không đổi intro default 3×/3350ms, skip/ESC, session key; Design Spec 0.8–1.2s chỉ là **xung đột mở**, chưa có quyết định đổi.
- Không bỏ `import.meta.env.DEV` boundary; không publish Model B/ITM assets.
- **Không import/apply `ignitionV2.css`** hoặc chạy installer V2 (D3).
- **Không dùng dữ liệu, logo, ảnh tay đua, track map hoặc thời tiết hư cấu từ mockup** (D5).
- **Không đổi 4 font roles/không thêm Bebas Neue**; `DESIGN.md` chỉ sync trong P1 (D2).
- Không deploy/CI trigger/publish (D7); chỉ local build/preview. Gate 0 hiện tại cũng **không cấp quyền commit/push**.
- Không sửa `docs/` owner ngoài file plan này; không tạo plan version khác.
- Không cài package/skill mới; mọi dependency mới cần owner duyệt.

### 13.12 UNVERIFIED & RESIDUAL RISKS

| Hạng mục | Trạng thái | Ảnh hưởng |
|---|---|---|
| Production build visual | **NOT RUN** — D7 cho phép local build/preview từ P1 | Không được coi DEV screenshot là production acceptance |
| Real-device/GPU FPS | **NOT RUN** | Không thể PASS performance gate cho Model B/ITM |
| Lighthouse/Web Vitals/INP | **NOT RUN** | Chưa có baseline; không claim đạt |
| Axe/screenreader đầy đủ | **NOT RUN** | Chỉ có contrast manual + keyboard spot check |
| 375/1920 cho 10 route phụ | **NOT RUN** | Sẽ hoàn tất ở visual QA từng phase |
| 7 mockup IGNITION | **ĐÃ ĐỦ 7/7 + Spec (Gate 0)** | Mockup là concept sheet; dữ liệu hư cấu; vẫn phải visual review khi implement |
| Mockup → route mapping | **CÓ KHOẢNG TRỐNG** | Circuit Explorer/Stories/Races không có route; không thêm khi chưa duyệt |
| Intro spec vs current | **XUNG ĐỘT MỞ** | Spec 0.8–1.2s vs current 3380ms; giữ current, P2 chỉ đo/đề xuất |
| Mockup asset rights | **CHƯA XÁC MINH** | Ảnh tay đua/logo/track map/thời tiết trong mockup không được dùng làm asset |
| `source-assets/` 59MB untracked | **RỦI RO** | Có thể bị stage nhầm; manifest + owner duyệt trước cleanup (D8) |
| V2 patch full app QA | **NOT RUN** | Chỉ static QA; không được coi là release-ready; D3 cấm áp dụng |
| ITM runtime metrics | **NOT RUN** | Cần P7 đo lại |
| Production data pipelines | **NOT RUN trong P0** | Thuộc release gate, không phải P0 |

### 13.13 GATE 0 RECONCILIATION EVIDENCE — 7/7 mockup + Design Spec (30/10/2026)

**Phạm vi:** owner yêu cầu kiểm tra đủ 7 ảnh trong `references/ignition/` và Design Spec trong `docs/`, đối chiếu với P0 screenshot baseline, cập nhật `VISUAL_GAP_MATRIX` theo từng trang. Kết quả:

| Kiểm tra | Kết quả | Evidence |
|---|---|---|
| 7 mockup hiện diện | **7/7 PASS** | Visual target register §0.1 (dimensions/bytes/SHA-256) |
| Design Spec `docs/` vs bản trong mockup folder | **PASS — identical SHA-256** | `0ecf4d82f20c6e970511ed4c6ff7595ac72ce860bb0519b1046f54e15059f4fc` |
| Đọc toàn bộ ảnh | **7/7 đã mở/đọc** | 01 Homepage; 02 Race Center; 03 Standings/Driver; 04 Constructors/Team; 05 Engineering (3-up); 06 Showroom 3D; 07 Calendar/Circuits (2-up) |
| Đối chiếu baseline | **7/7 có ảnh P0 tương ứng** | bảng mapping bên dưới |
| Pixel diff | **NOT RUN** | Mockup là concept sheet, không phải screenshot cùng viewport; không có pixel contract |
| Mockup data accuracy | **KHÔNG DÙNG** | Tên/đội/điểm/kết quả/thời gian hư cấu; D5 yêu cầu dữ liệu thật |

**Phương pháp:** mở từng ảnh bằng Read (multimodal), ghi nhận bố cục/thứ bậc/typography/palette/control; so với screenshot P0 cùng route ở desktop và mobile; đối chiếu yêu cầu page template trong Design Spec; ghi khoảng cách vào §13.4. Không chạy OCR/pixel-diff; không suy ra số đo spacing chính xác từ ảnh tổng hợp.

**Mockup → route thật → phase:**

| Mockup | Nội dung | Route hiện có | Phase | Route mới? |
|---|---|---|---|---|
| 01 | Homepage | `/` | P3 | Không |
| 02 | Race Center | `/season/:year?tab=results` | P4 | Không |
| 03 | Standings + Driver profile | `/season/:year?tab=standings`, `/drivers`, `/drivers/:id` | P5 | Không |
| 04 | Constructors + Team profile | `/season/:year?tab=standings&category=constructors`, `/season/:year?tab=teams`, `/teams`, `/teams/:id` | P5 | Không |
| 05 | ITM / Anatomy / Insights | `/engineering` (DEV), `/engineering/car-anatomy`, `/engineering/insights`, `/engineering/:slug` | P7 | Không |
| 06 | Showroom 3D | `/showroom` | P6 | Không |
| 07 | Calendar + Circuit Explorer | `/season/:year?tab=calendar`; Circuit Explorer **chưa có route** | P4 (calendar) / owner gate (circuit explorer) | **Có — cần duyệt riêng** |

**Phát hiện chính (tóm tắt; chi tiết ở §13.4):**
1. **Shell:** mockup dùng wordmark phẳng + 5–6 link text (Engineering chỉ có trên mockup 05/06) + CTA cam; hiện tại logo badge + dropdown + bottom tab bar. D4 cho phép redesign; đây là thay đổi IA, không chỉ skin.
2. **Page hierarchy:** mockup dùng display hero rất lớn cho từng trang, panel tối, accent cam; hiện tại heading nhỏ hơn, accent đỏ, nhiều panel sáng.
3. **Dữ liệu:** mockup chứa tay đua/đội/điểm/kết quả hư cấu; D5 yêu cầu giữ dữ liệu thật → chỉ lấy layout.
4. **Route gap:** mockup có Circuit Explorer/Stories/Races; repo chỉ có calendar/results; không tự tạo route.
5. **3D:** mockup Showroom/ITM/Anatomy dùng hình xe và callout rất giàu; repo chỉ có Model B/ITM giới hạn; không được fake exploded view hoặc thêm asset không có quyền.
6. **Typography:** mockup trông như Bebas Neue/condensed; D2 giữ Barlow Condensed; không đổi font.
7. **Motion:** Spec ghi intro 0.8–1.2s; app đang 3380ms default — xung đột mở.
8. **Assets:** ảnh tay đua/logo/track map/thời tiết trong mockup chưa có quyền; không dùng.

**Xung đột mở (không được tự hòa giải):**

| ID | Xung đột | Quyết định hiện tại | Hành động |
|---|---|---|---|
| C1 | Spec intro 0.8–1.2s vs app 3380ms default | **Chưa có quyết định đổi** | Giữ nguyên; P2 đo/đề xuất A/B; owner duyệt trước khi đổi |
| C2 | Mockup display font (~Bebas Neue) vs code Barlow Condensed | D2 giữ 4 roles | Không đổi font; `DESIGN.md` sync P1 |
| C3 | Mockup palette cam/đỏ + signal green vs code tokens/V2 palette | D1/D3: token map P1 | Map có chủ đích; không import V2 CSS |
| C4 | Mockup data hư cấu vs D5 real data | D5 real data | Không copy data; chỉ layout |
| C5 | Mockup routes (Circuits/Stories/Races) vs repo routes | Route preservation | Không thêm route; Circuit Explorer cần gate riêng |
| C6 | Mockup showroom dùng xe kiểu Model B vs production EDS-G01 | D6 shared shell | Adapter model theo môi trường; không publish Model B |
| C7 | Mockup ITM chapter names/layout vs ITM REV4.2 structure | P7 preserve | Không đổi chapter/choreography; chỉ shell/typography |
| C8 | Mockup imagery rights (drivers/logos/tracks/weather) | Chưa xác minh | Dùng asset có nguồn hoặc placeholder; không copy |

**Giới hạn evidence:**
- Mockup là ảnh tổng hợp 1536×1024 / 1672×941 / 2062×763, không phải frame 1440/1920; không thể suy ra spacing/pixel chính xác.
- Chỉ 01/06/07 có mobile frame; 02–05 không có mobile state đầy đủ.
- Mockup không có hover/focus/empty/error/loading states; các state này lấy từ Design Spec + QA hiện có.
- Không có file thiết kế nguồn/Figma/PSD; màu sắc chỉ đọc bằng mắt, không sample pixel.
- Chưa có ảnh production build; D7 cho phép chụp ở P1.

### 13.14 P1 EXECUTION RECORD — DESIGN FOUNDATION (30/10/2026)

**Status:** `P1 COMPLETE / QA_READY / OWNER REVIEW / GATE 1 HOLD`. P1-A…P1-E đã triển khai; không commit/push/merge/deploy; không cleanup. Điều kiện còn lại của Gate 1 là owner xác nhận **`APPROVED P1`**.

**Source changes:** 13 file modified + 1 test mới; `141 insertions(+), 53 deletions(-)`; HEAD `d4838ad5be4c809dc020c52fe84ae47edcdb67c3`.

| File | P1 change |
|---|---|
| `apps/web/src/index.css` | Canonical palette carbon/ignition/racing-red/ivory/signal; surface/text aliases; grid/hairline/focus/motion tokens; `.peds-display-page`, `.peds-eyebrow`; reduced-motion motion vars. Legacy `--peds-color-accent` giữ `#ff2a2a` để text đỏ nhỏ vẫn đạt contrast. |
| `apps/web/tailwind.config.js` | Thêm `carbon`, `ivory`, `racing-red`, `signal`, `shadow-peds-ignition`. |
| `apps/web/src/components/ui/buttonStyles.ts` | Primary: ignition + carbon text; danger: racing red + white. |
| `apps/web/src/components/ui/Tabs.tsx` | Selected: ignition + carbon text. |
| `apps/web/src/components/ui/SectionHeading.tsx` | Eyebrow dùng `.peds-eyebrow`; title dùng display role. |
| `apps/web/src/components/pages/AboutPage.tsx` | H1 dùng `.peds-display-page`; subtitle dùng `text-peds-text-muted` (D-P0-01). |
| `apps/web/src/components/pages/AboutPage.test.tsx` | **Mới:** 5 regression tests cho token contract + About H1. |
| `apps/web/src/components/home/RollingDigits.tsx` | Reduced-motion render số tĩnh (D-P0-02). |
| `apps/web/src/components/home/RollingDigits.test.tsx` | 3 regression tests, gồm strip absence + visual digits. |
| `apps/web/src/components/home/homepageH1.css` | `.h25-odometer__value`; bỏ strip khỏi rule `transform:none!important`. |
| `apps/web/src/components/championship/championshipC11.css` | Token hóa table header/row; mono lining tabular; sửa hierarchy driver/team/position/points. |
| `apps/web/src/components/championship/championshipF4.css` | Token hóa `.f4-table` (component hiện orphaned; không có ảnh hưởng render). |
| `apps/web/src/components/home/podiumHeroR1.css` | Aero field/CTA glow sang ignition; carbon text. |
| `DESIGN.md` | P1-C sync palette/token/typography/primitives (26 dòng diff). |

**Hotfix evidence:**

| Defect | Before | After | Evidence |
|---|---|---|---|
| D-P0-01 About H1 | `1.01:1` (#09090b trên #05070b) | **17.74:1** ở 12/12 dòng EN/VI × 6 viewport; Barlow Condensed 800; overflow 0 | `verify.json` + `shots/{before,after}/…-about.png` |
| D-P0-02 Countdown reduced-motion | Strip bị `transform:none!important`, hiển thị sai số | Visual = aria tại 1440 `[0,2,7,10]` và 1024 `[0,2,7,4]`; `strips=0`, `staticValues=8`; ảnh chụp | `verify.json` + `shots/after/*-home.png` |

**QA matrix (§13.9.1):**

| Hạng mục | Kết quả | Evidence |
|---|---|---|
| Before/after screenshots | **PASS** — 96 before + 96 after; 8 route × 6 viewport × EN/VI; 0 capture error; 0 overflow | `scratch/ignition/p1-baseline/shots/{before,after}/`, `logs/capture-before/after.json` |
| Intro timing ±5% | **PASS** — 6201/4251/3415 ms so với baseline 6207/4247/3380 (−0.10%/+0.09%/+1.04%); skip 1018 ms | `logs/verify.json` |
| Reduced-motion intro | **PASS** — không xuất hiện tại 1600 ms và 4100 ms | `logs/verify.json` |
| Keyboard/focus | **PASS** — Tabs ArrowRight/Home đổi tab đúng; mobile ESC đóng menu và trả focus; focus ring 2px/offset 3px | `logs/verify.json` |
| Typography/font roles | **PASS** — display/UI/body/mono đúng computed family; VI coverage 4/4 true | `logs/verify.json` |
| Table primitive | **PASS** — header UI 600 ivory; driver/team/position/points ivory; mono `lining-nums tabular-nums` | `logs/verify.json`, `shots/after/detail-c11-table-1440.png` |
| Static gates | **PASS** — lint exit 0 (0 errors, 15 pre-existing warnings); typecheck exit 0; tests 363+16+2 = 381 PASS; build exit 0 | `logs/gates/*.log` + `.exit` |
| Security/boundary | **PASS** — `security:secrets` PASS; `security:assets` PASS | `logs/gates/{secrets,assets}.log` |
| Local production preview | **PASS có caveat** — 6 route/viewport, 0 overflow, EDS-G01 xuất hiện, không có Model B; 6 console error do CSP chặn subset Cyrillic-ext của Manrope (không ảnh hưởng EN/VI) | `shots/preview/`, `logs/preview.json` |
| Repo hygiene | **PASS** — không commit/push/deploy; không package/route/data/API mới; không import `ignitionV2.css`; owner assets không bị chạm | `git status --short`, diff stat |
| Duplicate-key warnings | **NOT RUN ở P1** — 108 cảnh báo VI Navbar tồn tại trước P1, không sửa (P2); không claim PASS | `logs/capture-before/after.json` |

**Defect tự phát hiện và đã sửa trong P1:** `P1-TABLE-01` — rule `.c11-table td { color: muted }` có specificity cao hơn `.c11-driver`/`.c11-points`, làm tên tay đua và điểm bị mờ. Đã bỏ `color` khỏi `td`; computed color trở lại ivory cho driver/team/position/points; verify table pass `true`; ảnh after được chụp lại toàn bộ sau fix. Không còn defect mở do P1.

**Phát hiện mới (không sửa trong P1):**

| ID | Severity | Phát hiện | Xử lý đề xuất |
|---|---|---|---|
| D-P1-01 | P2 | 108 duplicate-key console error ở VI Navbar, không đổi so với baseline | P2 Navbar redesign |
| D-P1-02 | P3 | Production CSP `font-src 'self' https://fonts.gstatic.com` chặn subset Cyrillic-ext Manrope được Vite inline `data:` (6 console error); EN/VI không bị ảnh hưởng, `Manrope` VI check = true | P8: cho `data:` trong `font-src` hoặc tắt inline font |
| D-P1-03 | P4 | Mobile 390 tab strip cắt icon Calendar ở mép trái (trạng thái scroll sẵn có, giống before) | P4 Race Center |
| D-P1-04 | P4 | Numeral `.c11-position/.c11-points` vẫn weight 700 (ngoài role 500/600), có thể synthetic bold | P4 khi rebuild results |
| D-P1-05 | P7 | CTA trang Car Anatomy vẫn đỏ legacy, chưa đồng bộ ignition | P7 Anatomy |
| D-P1-06 | P3 | Panel session countdown giữ nền đỏ `#251113` trong khi border đã ignition | P3 Homepage |

**Cleanup candidates — CHỈ MANIFEST, CHƯA XÓA (chờ owner duyệt D8):**
- `scratch/ignition/p1-baseline/` — 7 script QA (`capture`, `verify`, `preview`, `table-detail`, 3 debug), 1 detail + 96 before + 96 after + 6 preview PNG, `logs/` (capture/verify/preview JSON + gate logs).
- Không xóa baseline/screenshot cho đến khi owner duyệt manifest.
- `apps/web/NUL` là mục lạ tồn tại trước P1 (gây cảnh báo git); không tự xóa.

**NOT RUN / residual risks:** axe/screenreader; Lighthouse/Web Vitals/INP; real-device/GPU FPS; 200%/400% zoom; full-page screenshots (chỉ viewport); Firefox/Safari; production deploy và pipeline verification (ngoài P1). Production preview chỉ là local, không phải bằng chứng deploy.

**Gate 1 checklist (§13.10):** (1) token/DESIGN sync — **chờ owner duyệt**; (2) About ≥4.5 — **PASS**; (3) countdown visual = aria — **PASS**; (4) đủ before/after — **PASS**; (5) lint/typecheck/test/build PASS + preview local — **PASS**, deploy NOT RUN; (6) intro ±5%, skip/ESC/reduced — **PASS**; (7) không V2 CSS/package/route/data/commit — **PASS**; (8) duplicate-key — **NOT RUN (P2)**; (9) owner `APPROVED P1` — **PENDING**.

**Decision:** **HOLD** — kỹ thuật đã QA_READY, nhưng Gate 1 chưa thể GO khi chưa có `APPROVED P1` của owner. Không chuyển P2, không cleanup.

### 13.15 P1 CLOSEOUT — CLEANUP GATE (31/10/2026)

**Status:** `P1 APPROVED → CLEANUP_VERIFIED / GATE 1 GO / P2 OPEN`. Owner đã xác nhận **`APPROVED P1`** ngày 31/10/2026 dựa trên P1 QA và independent visual audit. Không commit/push/merge/deploy.

**Base:** HEAD `d4838ad5be4c809dc020c52fe84ae47edcdb67c3`, branch `migration/clean-architecture`. Working tree trước closeout: 13 file modified + `AboutPage.test.tsx` mới + owner docs/`source-assets`/V2 reference untracked — không mất thay đổi nào. Sau closeout chỉ giảm 6 artifact debug; source và evidence còn nguyên.

**Tài liệu đã đọc:** `docs/IGNITION_MASTER_PLAN.md` rev 1.3.1 (§13.14), `AGENTS.md`, `DESIGN.md`, `docs/IGNITION_Design_Spec.md`, P1 QA/evidence trong `scratch/ignition/p1-baseline/`. **Independent visual audit:** không tìm thấy báo cáo audit như một file trong repo hay `E:\Formula 1` (đã quét `*audit*`); approval của owner trong yêu cầu 31/10/2026 là bản ghi Gate 1, không tự tạo lại nội dung audit.

**Xác minh 6 CSP console error (D-P1-02):**

| Câu hỏi | Bằng chứng | Kết luận |
|---|---|---|
| P1 có gây ra? | `_headers` từ commit đầu `621588f`; `main.tsx` font imports từ `926b979`; `vite.config.ts` không đổi; P1 diff 13 file không có font/header/config | **Không — pre-existing** |
| Nguồn lỗi | Build CSS có đúng 1 `@font-face` inline: Manrope Variable subset Cyrillic-ext, `unicode-range:U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F`, ~2.553 bytes; CSP `font-src 'self' https://fonts.gstatic.com` thiếu `data:` | Vite inline font nhỏ dưới ngưỡng 4KB, CSP chặn `data:` |
| Ảnh hưởng EN/VI? | 20/20 preview loads: EN `Manrope` Latin = true; VI `Manrope` Vietnamese = true; Cyrillic = false; 0 lỗi khác ngoài đúng 1 CSP error/trang | **Không ảnh hưởng EN/VI**; chỉ subset Cyrillic-ext không dùng |
| Có fix P1? | Không sửa vì không phải regression P1 và ngoài scope | Giữ **D-P1-02 (P3)** cho P8 |

**CLEANUP_MANIFEST (đã thực thi phần được phép):**

| Path | Loại | Lý do | Refs | Backup | Quyết định | Kết quả |
|---|---|---|---|---|---|---|
| `scratch/ignition/p1-baseline/debug-fonts.cjs`, `debug-season.cjs`, `debug-season2.cjs` | Script debug one-off | Bị `verify.cjs` thay thế; không còn reference | `grep` toàn repo: 0 | `E:\Formula 1\archives\ignition-p1-cleanup-2026-10-31\` | Xóa | **Đã xóa**; SHA-256 khớp backup |
| `scratch/ignition/p1-baseline/shots/debug-fonts.png`, `debug-season.png`, `debug-season2.png` | Ảnh debug one-off | Không phải baseline; 2 ảnh trùng hash; đã có 96 after + verify | 0 | cùng backup | Xóa | **Đã xóa**; SHA-256 khớp backup |
| `scratch/ignition/p1-baseline/` (còn lại: 4 script QA + `smoke-closeout.cjs`, 96 before + 97 after + 6 preview + 2 reduced PNG, logs/gates/requal) | Evidence | Gate 1/P2 before-after và rollback | Master plan §13.14/§13.15 | — | **Giữ** | Không xóa |
| `scratch/ignition/p0-baseline/` (35MB, 136 file) | Baseline P0 | Lịch sử Gate 0/P1 before | §13.3 | — | **Giữ** | Không xóa |
| `scratch/frontend/` (146MB) | Scratch cũ | Được `vite.config.ts` tham chiếu cho review video local | `vite.config.ts` | — | **Giữ — cần duyệt riêng** | Không xóa |
| `apps/web/dist/` (5.5MB) | Build output | Sinh lại bằng build; cần cho preview local | build script | — | **Giữ** | Không xóa |
| `apps/web/NUL/` (2 wrangler log) | Mục lạ Windows | Tồn tại trước P1, gây warning Git | — | — | **Giữ — duyệt riêng** | Không xóa |
| `source-assets/` (59MB), `.local-assets/` (28MB) | Owner assets | D8 bảo vệ | — | — | **Giữ** | Không xóa/chạm |
| `docs/PODIUM_EDS_IGNITION_V2_Review_Patch/` (gồm `install.py`) | Reference owner | D3: chỉ tham chiếu, không chạy | §13.8 | — | **Giữ** | Không chạy/không xóa |
| `docs/IGNITION_MASTER_PLAN.md`, `docs/IGNITION_Design_Spec.md`, `docs/PODIUM_EDS_MASTER_SUMMARY.md`, `docs/qa/` | Docs owner | Source of truth/QA | — | — | **Giữ** | Không xóa |

**Cleanup executed:** 6 file debug (3 script + 3 PNG), backup ngoài source tree tại `E:\Formula 1\archives\ignition-p1-cleanup-2026-10-31\` cùng `SHA256SUMS.txt`; hash nguồn = hash backup trước khi xóa. Không dùng `git clean`, `reset --hard`, không xóa directory lớn, không chạm owner/source/model/baseline.

**Re-QA sau cleanup (31/10/2026):**

| Gate | Kết quả | Evidence |
|---|---|---|
| `git diff --check` | **PASS** exit 0 | log terminal |
| ESLint | **PASS** exit 0 — 0 error, 15 warning pre-existing | `logs/requal-2026-10-31/lint.{log,exit}` |
| TypeScript | **PASS** exit 0 | `typecheck.{log,exit}` |
| Tests | **PASS** — 363 web + 16 api + 2 security = **381** | `test.{log,exit}` |
| Build | **PASS** exit 0 — Vite 10.38s; SEO/prerender/commercial isolation/Cloudflare guards PASS | `build.{log,exit}` |
| Security | **PASS** — secrets + public asset boundary | `secrets.*`, `assets.*` |
| Browser smoke (local production preview) | **PASS** — 20/20 load (5 route × 2 viewport × EN/VI); 0 overflow; 0 non-CSP console/pageerror/http; EDS-G01 hiện diện; không Model B badge; VI Manrope = true; đúng 1 CSP error/trang (Cyrillic-ext) | `logs/requal-2026-10-31/closeout-smoke.json` |

**Gate 1 checklist (cập nhật §13.10):** (1) token/DESIGN sync — **APPROVED P1**; (2) About ≥4.5 — PASS; (3) countdown visual = aria — PASS; (4) before/after đủ — PASS; (5) lint/typecheck/test/build + preview local — PASS, deploy **NOT RUN** theo D7; (6) intro ±5%, skip/ESC/reduced — PASS; (7) không V2 CSS/package/route/data/commit — PASS; (8) duplicate-key — **NOT RUN (P2)**, không claim PASS; (9) owner `APPROVED P1` — **PASS**; cleanup — **PASS**.

**Decision:** **CLEANUP_VERIFIED — GATE 1 GO.** P2 được mở. Residual: D-P1-02 (P3, P8), D-P1-03/04 (P4), D-P1-05 (P7), D-P1-06 (P3); duplicate-key sẽ xử lý ở P2. Không commit/push/deploy.

### 13.16 P2 EXECUTION RECORD — NAVIGATION, LAYOUT & MOTION (31/10/2026)

**Status:** Historical snapshot — `P2 COMPLETE / QA_READY / GATE 2 OWNER REVIEW`; các refinement Gate 2 và evidence cuối nằm tại §13.17. P2.1–P2.5 đã triển khai và QA local. **Không commit/push/merge/deploy; không cleanup P2; không mở Phase 3; không đổi intro timing/Model B/ITM/results engine/route/data/API.**

**Base:** HEAD `d4838ad5be4c809dc020c52fe84ae47edcdb67c3`, branch `migration/clean-architecture`. Working tree chưa commit, gồm P1 + P2; không có thay đổi `package.json`/lockfile/store/service/route/data. P2 source diff đúng 5 file:

| File | Diff | Vai trò |
|---|---:|---|
| `apps/web/src/components/layout/Navbar.tsx` | +275 / −97 | Desktop nav + mobile drawer + active/deep-link/Escape/focus |
| `apps/web/src/components/layout/navItems.ts` | +31 mới | IA thuần, ID/label duy nhất cho VI/EN × DEV/prod |
| `apps/web/src/components/layout/navbarH1.css` | +241 / −27 | 64px header, dropdown, drawer, focus, reduced-motion |
| `apps/web/src/components/layout/Navbar.test.tsx` | +63 / −38 | 11 test: routes, active, deep link, unique keys, DEV/prod |
| `apps/web/src/components/mobile/MobileAllInOne.tsx` | +2 / −59 | Bỏ bottom tab bar, giữ section `#home`/`#giai-dau`/`#showroom` |

**P2.1 — Desktop navigation:** header 64px, 6 primary item (Overview, Results, Standings, Drivers, Teams, Engineering) + dropdown Results/Standings/Engineering, Showroom CTA, VI/EN, active underline. Chỉ dùng route/query hiện có; không tạo `/races`, `/circuits`, `/stories`; không đổi route ngữ nghĩa. Back/Forward, deep link `?tab=standings&category=constructors`, `aria-expanded/controls`, `aria-current`, Escape toàn cục hoạt động. D-P0-03/D-P1-01 duplicate key/item đã xử lý: 0 key warning trong 88 trang; test khẳng định ID/label duy nhất. Nav hiển thị từ 1024px (trước 1100px); 1024 VI/EN không overflow.

**P2.2 — Mobile navigation:** bottom tab bar đã bỏ; thay bằng drawer `min(100%, 430px)`, `100dvh`, scrim, `role="dialog" aria-modal="true"`, close 44px, link 56px, expand 48px, CTA 52px, safe-area top/bottom, focus trap, body lock, Escape/backdrop, focus trả về toggle. Nội dung drawer scroll được trong landscape (812×375, 844×390) tới Showroom/About; không overflow ngang; không che nội dung; 375/390/768/1024 đã kiểm tra. Canvas WebGL không bị tạo thêm khi mở/đóng (1→1; context 1→1).

**P2.3 — Intro & motion:** **không đổi timing**. Đo thực tế: 1× ≈6,21 giây, 2× ≈4,26 giây, 3× ≈3,38 giây (config 6.200/4.250/3.350 ms; lệch 3× +1,0%, trong dung sai ±5%); skip latency 100ms; session: SPA 0, document thứ hai 0, replay 1, skipped-after-seen 0; reload replay 1 (by design); reduced motion 0; body overflow được khôi phục. Nav motion thuần CSS: dropdown/fade 180ms, drawer slide 220ms, scrim 180ms; reduced-motion = 0s; không GSAP/package mới; không jank/không re-init WebGL khi mở drawer trong Showroom.

**Design Spec 0.8–1.2s — hai lựa chọn để owner quyết, chưa thực thi:**

| Option | Timing | UX impact | Trạng thái |
|---|---|---|---|
| **A — Giữ hiện tại** | default 3× 3.350ms (đo 3.384ms); skip Esc/Space 100ms; session skip; reload replay | Giữ 5 phase cinematic (awakening → pressure → hold → lights-out → launch), cảm giác thương hiệu mạnh; chậm hơn spec ~2,15–2,55s và khóa tương tác chính trên first document; repeat trong session được skip nhưng reload vẫn replay | **Đang dùng**, đúng yêu cầu P2 “không đổi timing” |
| **B — Theo Spec** | 1.0s (dải 0,8–1,2s) | Vào nội dung nhanh hơn ~2,35s; gần mục tiêu “không chặn tương tác chính”; mất buildup/anticipation và nhịp lights-out; cần sửa timing config + đo lại/regression + làm lại video intro | **NOT implemented** — chờ quyết định Gate 2 |

**P2.4 — Visual QA:** 6 viewport (375×812, 390×844, 768×1024, 1024×768, 1440×900, 1920×1080) × 7 trang (Home, Competition, Results, Standings, Showroom, Engineering, About) × VI/EN = 84, thêm Drivers/Teams 1440 × 2 = **88 row**, **125 ảnh** (88 trang + 37 state), **4 video có tên** (desktop dropdown, intro 3× desktop/mobile, mobile menu) + 4 raw trùng hash. State: normal/active, hover nav + CTA, keyboard focus, dropdown Results/Standings/Engineering + keyboard, mobile menu open/expanded, scrolled, reduced motion (EN 1440/375; VI bổ sung 1440/375), keyboard-only, Escape/backdrop/focus trap, landscape. Contact sheet 14 cặp: `scratch/ignition/p2-shell/contact-sheet.png`. Kết quả: **0 overflow, 0 console issue (ngoài D-P1-02), 0 key warning, 0 bottom bar**.

**P2.5 — Engineering QA:**

| Gate | Kết quả | Evidence |
|---|---|---|
| ESLint | **PASS** — 0 error; 15 warning pre-existing; 4 file P2 sạch | terminal exit 0 |
| TypeScript | **PASS** — 4 workspace exit 0 | terminal |
| Tests | **PASS** — 388: 370 web (65 file) + 16 API + 2 security; 11 Navbar test | `npm run test` exit 0 |
| Build | **PASS** — Vite 9,18s; SEO 72 route; prerender 4 article; commercial isolation + Cloudflare PASS | terminal exit 0 |
| Dist size | 5.334.630 B vs 5.329.751 B trước build = **+4.879 B (+0,09%)** | `apps/web/dist` |
| Security | **PASS** — secrets + public asset boundary; `npm audit --audit-level=high` exit 0 (12 moderate dev-tooling, không đổi dependency) | terminal |
| Full browser capture | **PASS** — 88/88 row; checks rowCount/overflowFree/consoleClean/noBottomBar/desktopAt1024/keyWarningsFree = true; 0 issue; 551s | `logs/capture-after.json` |
| Production preview | **PASS** — 36/36 row (3 viewport × 2 lang × 6 route), 12/12 check; EDS-G01 6/6, không Model B badge; ITM 0 node; dữ liệu thật (Antonelli 365 điểm); drawer/intro/history/deep-link PASS; 36 font message D-P1-02 (1/trang) được đếm, không ẩn | `logs/p2-preview/preview-smoke.json` |
| ITM DEV | **PASS** — 6 chapter, 75/75 transform finite, 46 bước story, 1 canvas, click chapter 04, 0 console error | `logs/itm-check.json`, `itm-chapter-04.png` |
| Reduced/landscape bổ sung | **PASS** — VI reduced: intro 0, animation 0s, drawer 44px/body lock; 812×375 & 844×390: 0 overflow, scroll tới CTA/About | `logs/reduced-vi.json`, `logs/orientation.json` |
| DEV/prod boundary | **PASS** — DEV showroom “Model B Studio” (1 canvas); production 6/6 EDS-G01; `eds-g02.glb` không có trong `dist/client/models` (chỉ `eds-g01.glb` 660.192 B); ITM asset/class 0 trong dist | `dist/client/models`, preview JSON |
| Results engine/data | **PASS** — dữ liệu thật ở DEV và preview; không placeholder grid; không đổi data/API | capture + preview |

**Findings:** Không có defect P0/P1/P2 do P2 gây ra. D-P0-03/D-P1-01 duplicate key/item **đã fix** (0 key warning). 3 lỗi harness QA đã sửa và ghi rõ, không nới gate: (1) capture loại `/engineering` DEV khỏi `desktopAt1024` vì ITM shell cố ý ẩn global nav; (2) regex tên Antonelli case-sensitive trong khi bảng CSS uppercase; (3) regex “constructors” vs label “Constructor standings”; (4) phân loại font message D-P1-02 đã biết là pre-existing và vẫn đếm đủ 36. D-P1-02 (P3/P8) còn nguyên, không ảnh hưởng EN/VI.

**UNVERIFIED / residual:** GPU thật/FPS, Safari/Firefox, axe/screenreader, Lighthouse/Web Vitals/INP, so khớp pixel với mockup (concept sheet), CI/deploy/2 pipeline dữ liệu **NOT RUN** vì chưa push/deploy. Intro timing là quyết định owner tại Gate 2. Contact sheet là DEV; production có evidence preview riêng.

**Cleanup candidates — chỉ liệt kê, chưa xóa:** 4 file raw `page@*.webm` trùng hash với 4 video có tên; `itm-chapter-04.png` đặt ở root `p2-shell/` (đề nghị chuyển vào `shots/after/`); `apps/web/NUL/` pre-existing từ 24/10 (P1 đã giữ, cần duyệt riêng); `dist/` có thể sinh lại. Evidence P2 và baseline P0/P1 giữ nguyên.

**Gate 2 checklist:** (1) desktop nav/active/deep link/Back-Forward/Escape — **PASS**; (2) mobile drawer/touch/focus/escape/backdrop/no occlusion/no bottom bar — **PASS**; (3) intro timing unchanged + skip/session/reduced — **PASS**; hai option spec 0.8–1.2s — **REPORTED, owner decision**; (4) before/after + states + videos + contact sheet — **PASS**; (5) lint/typecheck/test/build/security/preview/ITM/data/DEV-prod boundary — **PASS local**; deploy/CI/pipeline — **NOT RUN**; (6) không package/route/data/API/V2 CSS/commit — **PASS**; (7) owner xác nhận `GATE 2 APPROVED` — **PENDING**.

**Decision:** **P2 QA_READY — GATE 2 OWNER REVIEW.** Chưa phải GO production; Phase 3 và cleanup P2 bị khóa. Không commit/push/merge/deploy.

### 13.17 P2 GATE 2 FINAL REFINEMENT — WORDMARK, 1024 TYPOGRAPHY, INTRO/DROPDOWN EVIDENCE (31/10/2026)

> **SUPERSEDED IN PART — owner override 31/10/2026:** the typographic `PODIUM / EDS` header wordmark was reverted to the canonical official logo in §13.18. The wordmark evidence below is retained as historical Gate 2 record only; the 1024 typography, dropdown, intro, screenshot and QA findings remain valid unless restated in §13.18. Wordmark-era videos, frames, shots and logs were archived off-tree at `E:\Formula 1\archives\ignition-p2-cleanup-2026-10-31\` and removed from the working tree under the Gate 2 cleanup (§13.19); the fixed-path video/log files show the current official-logo state.

**Status:** `P2 FINAL OWNER REVIEW`. Gate 2 changes requested đã được xử lý; Phase 3 vẫn khóa. **Không cleanup P2, commit, push, merge, deploy; không đổi intro timing, Model B, ITM, Results Engine, route, query param, API hoặc mobile navigation.** Đây vẫn là local evidence, chưa phải production approval.

**Phạm vi thay đổi Gate 2 — đúng 3 file nguồn:**

| File | Thay đổi | Ghi chú |
|---|---|---|
| `apps/web/src/components/layout/Navbar.tsx` | Wordmark `PODIUM / EDS`; đồng bộ state focus/ARIA của dropdown; Escape trả focus về chevron | Không đổi route, item, query hay drawer markup |
| `apps/web/src/components/layout/navbarH1.css` | Typography wordmark/nav tại 1024; selector dropdown theo `data-dismissed` thay vì `:focus-within` | Giữ token/font hiện có, không thêm package/font |
| `apps/web/src/components/layout/Navbar.test.tsx` | Test SSR cho wordmark + accessible home label | 12/12 Navbar test PASS |

Các file nguồn còn lại không bị sửa trong Gate 2 (xác minh bằng `find apps/web/src -newermt`): mobile drawer, routes, store, services, data, Model B và ITM giữ nguyên. Không có thay đổi `package.json`/lockfile.

**1. Wordmark đối chiếu `01_Homepage.png` — PASS (concept match, không phải pixel contract):** `PODIUM` ivory + slash ivory + `EDS` ignition; Barlow Condensed 800, skew nhẹ, uppercase; `aria-label` là `PODIUM EDS — Trang chủ` / `PODIUM EDS — Home`; wordmark `aria-hidden`. Đo computed: 1024 = 26.528px (127×34), 1440 = 30.4px (146×39). Ảnh mockup `01_Homepage.png` giữ nguyên hash `7f1fdb7d…2130b6`; 7 asset logo public (logo, logo-compact, icon-192/512, apple-touch-icon, favicon, og-preview) giữ nguyên hash/size/mtime; drawer và Footer vẫn dùng `OfficialBrandLogo` gốc. **Không xóa asset gốc.**

**2. Navbar 1024 — VI/EN, khoảng cách, focus và zoom:**

| Metric (1024×768) | VI | EN |
|---|---|---|
| Main link | 13.0176px, 700, spacing 0.4556px, padding-inline 6.08px | 13.0176px, 700, spacing 0.4556px, padding-inline 6.08px |
| Submenu | 13px, 600, padding 10px 12px | 13px, 600, padding 10px 12px |
| CTA / language | 12px · 148×40 / 11px · 44×44 | 12px · 148×40 / 11px · 44×44 |
| Nav group gap | 2.56px | 2.56px |
| Nav extents / controls | 193–863 / bắt đầu 885 | 186–870 / bắt đầu 885 |
| Brand focus | amber 2px, offset +4px | amber 2px, offset +4px |
| Link focus | amber 2px, offset −4px | amber 2px, offset −4px |
| Overlap / overflow | 0 / 0 | 0 / 0 |

Tại 1440: main link 14px; VI nav 383–1106, controls 1285; EN nav 375–1114, controls 1285; 0 overflow. Keyboard focus mở dropdown có `aria-expanded=true`; Escape đóng menu và trả focus về chevron; click ngoài và pointer-leave không tự mở lại; Tab sau Escape mở lại đúng. Browser zoom 200% (CSS viewport 512×384) chuyển sang drawer 430×384, link 56px/14.4px, close 44×44, 0 overflow, body locked — **PASS**.

**Text-only 200% (mô phỏng `html { font-size: 32px }` tại 1024):** nav scroll width 1708px > 1024, CTA right 1586, language x1615 ngoài viewport; header clip, document overflow không tăng. Ảnh before Gate 2 cũng hỏng tương tự → **D-P2-01 (P3, pre-existing, không phải regression Gate 2), chưa fix**. Browser zoom 200% là check chính và PASS; text-only 200% được ghi residual, không claim PASS WCAG.

**3. Desktop dropdown video — PASS:** `gate2/videos/gate2-dropdown-keyboard-vi-1440x900.webm`, 12.08s / 3.798.952 B; quay sau page load + fonts ready (`?intro=false`), có QA overlay. Trình tự: hover mở → click pin (`aria-expanded=true`) → Tab vào submenu (focus ring, submenu mở) → Escape đóng + focus trả về chevron → giữ trạng thái cuối. 9/9 check PASS: pageLoaded, wordmark, navFont14, hoverOpened, pinnedExpanded, keyboardSublink, escapeClosed, focusRestored, noModal. Ảnh: `frame-1…frame-5-*.png`; extracted `video-…-t6600.png` (keyboard focus) và `-t9500.png` (Escape/focus restored); log `logs/gate2-dropdown-video.json`.

**4. Intro 3× — PASS, không đổi timing:** đo thật từ DOM mount đến removal bằng MutationObserver:

| Run | Duration mount→removal | Phase (pressure / hold / lights-out / launch) |
|---|---:|---|
| 1 | 3348.1ms | 213.7 / 926.7 / 1348.3 / 2049.0 |
| 2 | 3347.1ms | 242.9 / 917.8 / 1350.9 / 2048.4 |
| 3 | 3347.5ms | 235.0 / 918.0 / 1349.5 / 2048.2 |

Config default 3× = 3350ms; cả 3 run lệch ≤3ms; 3/3 PASS, phase order/tolerance PASS. Video `gate2/videos/gate2-intro-3x-vi-1440x900.webm` 7.16s / 1.941.389 B; overlay hiển thị đúng `REMOVED at 3348 ms · config 3350 ms`; ảnh `frame-intro-after.png`; log `logs/gate2-intro-3x.json`. Không thay timing, skip, sessionStorage hay reduced-motion.

**5. Mobile navigation / routes / query / API / Results Engine / Model B / ITM:** không sửa; regression được chạy lại qua test, full capture, production preview và ITM check. Không có route mới (`/races`, `/circuits`, `/stories` vẫn không tồn tại); deep link `?tab=standings&category=constructors`, Back/Forward, active state, drawer focus trap/body lock giữ nguyên.

**6. VI/EN screenshots tại 375, 390, 768, 1024, 1440, 1920:** full capture 88 route rows (7 route × 6 viewport × 2 ngôn ngữ + Drivers/Teams 1440 × 2), **130 PNG**, 56 state; 0 overflow, 0 console issue, 0 key warning, 0 bottom bar; thời gian 526.662s. Bộ state Gate 2 riêng 12 tổ hợp viewport × ngôn ngữ: header, dropdown desktop (1024/1440/1920 VI/EN), drawer mobile (375/390/768 VI/EN); 0 overflow, font ≥12px, drawer mở/body lock, 0 page error; log `logs/gate2-states.json`. Before = ảnh P2 QA_READY đã preserve tại `shots/gate2-before`; after = `shots/after`; contact sheet `contact-sheet-gate2-headers.png` (12 cặp header) và `contact-sheet-gate2-states.png` (dropdown, focus, zoom, 12 drawer).

**7. QA engineering (local):**

| Gate | Kết quả | Evidence |
|---|---|---|
| Focused | **PASS** — Navbar 12/12 | `npx vitest run src/components/layout/Navbar.test.tsx` |
| Full tests | **PASS** — 389: web 371/65 file + API 16 + security 2 | `npm run test` exit 0 |
| Lint | **PASS** — 0 error, 15 warning pre-existing | `npm run lint` exit 0 |
| TypeScript | **PASS** — api/web/contracts/security, 4/4 exit 0 | `npm run typecheck` |
| Build | **PASS** — Vite; SEO 72 route; prerender 4 article; commercial isolation + Cloudflare PASS | `npm run build` exit 0 |
| Dist | 5.319.849 B vs 5.334.630 B P2 = **−14.781 B (−0.28%)**; logo 7 file và `eds-g01.glb` 660.192 B còn nguyên | `dist/client` |
| Security | **PASS** — secrets + public boundary; audit high exit 0; 12 moderate dev-tooling, không đổi dependency | `security:secrets`, `security:assets`, `security:audit` |
| Production preview | **PASS** — 36/36 row, 13/13 check; 36 font message D-P1-02 (nonKnown 0); drawer/intro/history/deep-link PASS | `logs/p2-preview/preview-smoke.json` |
| ITM DEV | **PASS** — 6 chapter, 75/75 transform, 46 bước, 1 canvas, chapter 04, 0 console error | `logs/itm-check.json` |
| Assets | **PASS** — logo/01_Homepage/eds-g01 hash giữ nguyên; chỉ `eds-g01.glb` trong dist models | `gate2/asset-manifest.txt` |
| Harness note | Lần preview đầu trỏ sai `dist` root → asset trả `text/html`; **discarded**, chạy lại `vite preview --outDir dist/client` mới dùng làm evidence. Không phải app defect. | terminal + `logs/p2-preview` |

**8. Gate 2 checklist (8 yêu cầu owner):**

| # | Yêu cầu | Trạng thái |
|---|---|---|
| 1 | Header đối chiếu 01_Homepage; wordmark hoàn thiện; giữ asset gốc | **PASS** — concept match, 7 asset + mockup hash unchanged |
| 2 | 1024 VI/EN font/spacing/focus/200% zoom, không nhỏ/chồng | **PASS** browser zoom; **D-P2-01 P3** text-only 200% pre-existing |
| 3 | Video dropdown sau load: mở menu, keyboard focus, Escape, focus restoration | **PASS** — 9/9 check |
| 4 | Intro 3× real timestamps + video đồng bộ, không đổi timing | **PASS** — 3347–3348ms vs 3350ms |
| 5 | Giữ mobile navigation/routes/query/API/Results Engine/Model B/ITM | **PASS** — chỉ 3 file nguồn; regression PASS |
| 6 | Ảnh VI/EN 6 viewport cho affected states | **PASS** — 88 row/130 PNG + 12 state + 2 contact sheet |
| 7 | Focused tests, lint, typecheck, build, QA | **PASS local**; deploy/CI/pipeline **NOT RUN** |
| 8 | Chỉ cập nhật `docs/IGNITION_MASTER_PLAN.md` | **PASS** — chỉ plan + scratch evidence; không commit/push |

**Findings/defects:** Không có P0/P1/P2 mới do Gate 2. **D-P2-01 (P3, pre-existing):** text-only 200% tại 1024 làm header tràn/clip; browser zoom 200% PASS; chưa fix, cần owner quyết trước khi mở accessibility hardening. **D-P1-02 (P3/P8)** font message Manrope Cyrillic-ext vẫn còn, 1 message/trang, EN/VI không ảnh hưởng.

**UNVERIFIED / residual:** CI, production deploy, 2 pipeline dữ liệu **NOT RUN** (chưa push/deploy); real GPU/FPS, Safari/Firefox, axe/screen reader, Lighthouse/Web Vitals/INP, pixel-perfect mockup, physical-device QA **NOT RUN**; browser QA dùng Chromium headless + SwiftShader cho 3D, không đại diện GPU thật. Text-only 200% pre-existing chưa xử lý. Owner `P2 FINAL OWNER REVIEW` chưa phải `GATE 2 APPROVED`/GO.

**Cleanup candidates — historical list, executed in part under §13.19:** raw video trùng `shots/after/videos/page@*.webm` + `gate2/videos/raw/`; extracted frame PNG `gate2/video-*.png` (có thể tái tạo); HTML tạm `gate2/contact-sheet-gate2-*.html`; `p2-shell/contact-sheet.png` (P2 cũ, đã có bản Gate 2); `apps/web/NUL/` pre-existing; `dist/` có thể sinh lại; các process preview local đã dừng. Giữ baseline P0/P1/P2, ảnh/video/log Gate 2 và asset gốc.

**Evidence register:** `scratch/ignition/p2-shell/gate2/` (videos, frames, contact sheets, asset manifest), `scratch/ignition/p2-shell/shots/{gate2-before,after}` (ảnh), `scratch/ignition/p2-shell/logs/{capture-after,capture-gate2-before,gate2-1024-after,gate2-1024-before,gate2-states,gate2-computed-1024,gate2-intro-3x,gate2-dropdown-video}.json`, `scratch/ignition/p2-shell/logs/p2-preview/preview-smoke.json`, `scratch/ignition/p2-shell/logs/itm-check.json`.

**Decision:** **P2 FINAL OWNER REVIEW.** Chưa phải GO production; Phase 3 và cleanup P2 bị khóa; không commit/push/merge/deploy. Owner quyết định Gate 2 tiếp theo; D-P2-01 và D-P1-02 được nêu riêng, không tự hạ severity.

### 13.18 P2 BRAND IDENTITY CORRECTION — OFFICIAL LOGO RESTORED (31/10/2026)

> **SUPERSEDED — owner approved Gate 2 on 31/10/2026; cleanup verified in §13.19.** This section remains the historical brand-correction record.

**Status:** `P2 OWNER REVIEW`. Owner override: **PODIUM EDS là logo thương hiệu chính thức do owner sở hữu**; yêu cầu thay bằng wordmark `PODIUM / EDS` bị hủy. Header đã trở lại logo raster gốc; quy tắc **BRAND IDENTITY LOCK** được ghi tại §3.1 và `DESIGN.md`. Phase 3 vẫn khóa; **không cleanup P2, commit, push, merge, deploy; không đổi intro timing, routes, query params, API, Results Engine, Model B, ITM hoặc mobile navigation.**

**Phạm vi thay đổi — 3 file nguồn + 2 tài liệu:**

| File | Thay đổi | Ghi chú |
|---|---|---|
| `apps/web/src/components/layout/Navbar.tsx` | Header brand dùng lại `<OfficialBrandLogo size="sm" variant="full">`; bỏ markup wordmark | Không đổi nav items, dropdown, focus, drawer |
| `apps/web/src/components/layout/navbarH1.css` | Bỏ toàn bộ `.h1-nav__wordmark*`; thêm `.h1-nav .h1-nav__brand-logo` cao 2rem (<1024) / 2.25rem (≥1024), `width:auto` | Chỉ kích thước hiển thị trong container sẵn có `min-height:44px`, `padding-inline:2px` |
| `apps/web/src/components/layout/Navbar.test.tsx` | Test SSR khẳng định official logo `/logo/logo.png`, alt, class brand; không còn wordmark | Navbar 12/12 PASS |
| `DESIGN.md` | Thêm mục **Brand identity lock** | Ba quy tắc owner + giới hạn chỉnh size/padding/container |
| `docs/IGNITION_MASTER_PLAN.md` | §3.1 Brand Identity Lock, §13.18, revision 1.3.5 | Chỉ tài liệu kế hoạch |

Không file nguồn nào khác bị sửa (`find apps/web/src -newermt` chỉ trả 3 file trên); không thêm/xóa asset, font, package hoặc dependency. Logo gốc, `logo-compact.png`, icon/apple-touch/favicon/og-preview và `eds-g01.glb` giữ nguyên hash.

**1. Logo gốc — canonical, không vẽ lại:**

| Asset | SHA-256 | Trạng thái |
|---|---|---|
| `apps/web/public/logo/logo.png` (800×298) | `226ab6f1d80a4337f3120069e03ae361a73df115c5463f5584d4643a9036acd2` | Không đổi |
| `apps/web/public/logo/logo-compact.png` | `424a28bfd473ee664d051e8f127a51be84c53e1b62753c510a8cfe09a8176125` | Không đổi |
| 5 asset còn lại (icon-192/512, apple-touch, favicon, og-preview) | hash trong `gate2/asset-manifest.txt` | Không đổi |
| `apps/web/public/models/eds-g01.glb` | `a9a1226d87ec10b3188b82cad01039200e81be4999a88ebb27e75d0da9ac8325` | Không đổi |

**2. Đo logo tại 375/390/768/1024/1440/1920 × VI/EN — 10/10 check PASS:** 12 header row + 6 drawer row, 0 page error.

| Nhóm viewport | CSS height | Kích thước render | Tỷ lệ render | Nguồn | DPR2 pixels |
|---|---:|---|---|---|---|
| 375/390/768 | 32px | 85.89×32 | 0.3726 | 800×298 (0.3725) | 171.78×64 |
| 1024/1440/1920 | 36px | 96.64×36 | 0.3725 | 800×298 (0.3725) | 193.28×72 |

Checks: `allFound`, `originalAsset`, `loaded` (natural 800×298), `aspectPreserved` (≤0.006), `notUpscaled` (render×DPR ≤ native), `notCropped` (`object-fit:contain`, brand/header overflow 0, nằm trong header), `expectedSize`, `accessible` (alt `PODIUM — Effet de Sol`, link aria-label), `drawerLogoOk` (85.89×32), `noPageErrors`. Logo gốc 800×298 luôn được downscale xuống 172–194px theo DPR2 nên không upscale/mờ; không crop, không kéo giãn. Drawer mobile dùng cùng asset, 85.89×32.

**3. Khoảng cách Navbar sau khi đổi logo (không chồng lấn):** brand container vẫn 100.64×44; logo 96.64×36 tại ≥1024.

| Viewport | VI: brand right → nav first x (gap) | EN: brand right → nav first x (gap) | Main font | Header/document overflow |
|---|---|---|---:|---|
| 1024×768 | 148.64 → 180.09 (**31.45px**) | 148.64 → 173.00 (**24.36px**) | 13.0176px | 0 / 0 |
| 1440×900 | 164.64 → 361.84 (**197.20px**) | 164.64 → 354.22 (**189.58px**) | 14px | 0 / 0 |

Các cải tiến P2 giữ nguyên: nav font 13.0176px @1024 / 14px @1440, dropdown hover/click/keyboard/Escape, ARIA khớp trạng thái, drawer focus trap/body lock, route/query/active state không đổi.

**4. Video current-state (official logo) — quay lại sau page load complete; bản wordmark lưu lịch sử:**

| Video | Thời lượng / bytes | Kết quả |
|---|---|---|
| `gate2/videos/gate2-dropdown-keyboard-vi-1440x900.webm` | 12.16s / 3.713.731 B | **9/9 PASS**: pageLoaded, officialLogo, navFont14, hoverOpened, pinnedExpanded, keyboardSublink, escapeClosed, focusRestored, noModal; QA marks: load 1806.7ms → hover 2924ms → pin 4351.5ms → keyboard 5940.2ms → Escape 8763.4ms → final 10636.4ms |
| `gate2/videos/gate2-intro-3x-vi-1440x900.webm` | 7.16s / 1.927.130 B | **3/3 PASS**: mount→removal 3351 / 3350 / 3347ms vs config 3350ms; overlay `REMOVED at 3351 ms · config 3350 ms` |

Frame hiện tại: `frame-1…frame-5` (dropdown), `video-…-t6600.png` (keyboard focus), `video-…-t9500.png` (Escape + focus restored), `frame-intro-after.png` / `video-gate2-intro-…-t4200.png` (official logo + intro overlay). Bản wordmark cũ đã được archive ngoài source tree tại `E:\Formula 1\archives\ignition-p2-cleanup-2026-10-31\` và xóa khỏi working tree theo manifest §13.19; không dùng làm current-state evidence.

**5. Re-capture VI/EN sau khi khôi phục logo:** full capture 88 rows / 56 states / **130 PNG**, 0 overflow, 0 console issue, 0 key warning, 0 bottom bar; 673.37s; log `logs/capture-after.json`. Bộ ảnh Gate 2 wordmark cũ (`shots/gate2-wordmark/` + `logs/capture-gate2-wordmark.json`) đã archive ngoài source tree và xóa khỏi working tree theo §13.19; before P2 vẫn ở `shots/gate2-before/`. Bộ brand riêng: 12 header @2x + 12 logo close-up @2x + 6 drawer = 30 PNG trong `gate2/brand/shots/`; contact sheet `gate2/brand/contact-sheet-brand-6viewports.png` (270.823 B) hiển thị đủ 6 viewport × VI/EN, kèm close-up @2x.

**6. QA engineering (local):**

| Gate | Kết quả | Evidence |
|---|---|---|
| Focused | **PASS** — Navbar 12/12 | `npx vitest run src/components/layout/Navbar.test.tsx` |
| Full web | **PASS** — 371/371, 65 file | `npx vitest run` |
| Full repo | **PASS** — 389 = web 371 + API 16 + security 2; exit 0 | `npm run test`; `logs/p2-brand/full-test.log` |
| Lint | **PASS** — 0 error, 15 warning pre-existing | `npm run lint` exit 0 |
| TypeScript | **PASS** — api/web/contracts/security 4/4 exit 0 | `npm run typecheck` |
| Build | **PASS** — Vite 25.47s; SEO 72 route; prerender 4 article; commercial isolation + Cloudflare PASS | `npm run build` exit 0 |
| Dist | **5.319.266 B** — −583 B vs Gate 2 (5.319.849), −15.364 B (−0.288%) vs P2 baseline (5.334.630) | `dist/client` |
| Security | **PASS** — secrets + public boundary PASS; audit exit 0, 12 moderate dev-tooling pre-existing | `security:secrets`, `security:assets`, `security:audit` |
| Production preview | **PASS** 36/36 row, 13/13 check, intro true; 36 font message D-P1-02, nonKnown 0 | `logs/p2-preview/preview-smoke.json` |
| ITM DEV | **PASS** — 6 chapter buttons, 75/75 transforms, 1 canvas, chapter 04, 0 error | `logs/itm-check.json` |
| Assets | **PASS** — toàn bộ logo asset + `eds-g01.glb` hash không đổi | `gate2/asset-manifest.txt` |

**Preview harness note:** lần chạy preview đầu tiên (song song với full capture) báo `intro=false`; log ghi overlay count 0 tại mốc probe 1200ms và 1600ms. Chạy lại khi CPU rảnh PASS đầy đủ 13/13, overlay mount 1→0 đúng; probe độc lập khi rảnh thấy overlay xuất hiện từ 300ms. Đây là timing sensitivity của harness dưới tải CPU, **không phải app defect đã xác nhận**; không sửa test/wait để ép pass. Lần fail đầu tiên không được dùng làm evidence; `preview-smoke.json` hiện tại là lần PASS khi CPU rảnh.

**7. Checklist 7 yêu cầu owner:**

| # | Yêu cầu | Trạng thái |
|---|---|---|
| 1 | Giữ nguyên logo gồm hình dạng, typography, tỷ lệ, màu sắc, asset gốc | **PASS** — official raster 800×298, hash không đổi, không vẽ lại |
| 2 | Không vẽ lại/tái tạo/thay font/thay bằng logo mockup | **PASS** — wordmark removed; header render `logo.png` |
| 3 | Chỉ chỉnh size/padding/container; không crop/biến dạng | **PASS** — height 32/36px, width auto, aspect 0.3725, contain, overflow 0 |
| 4 | Giữ cải tiến Navbar + mobile drawer P2 | **PASS** — font/focus/drawer giữ nguyên; 88-row recapture |
| 5 | BRAND IDENTITY LOCK trong plan + DESIGN.md | **PASS** — §3.1 + DESIGN.md |
| 6 | Kiểm tra logo 375…1920 VI/EN, không cắt/méo/mờ | **PASS** — 10/10 checks, 18 rows, 30 ảnh + contact sheet |
| 7 | Không sửa ngoài P2, không xóa asset, không commit/push/deploy | **PASS** — 3 source + 2 docs; asset nguyên vẹn |

**Findings/defects:** Không có P0/P1/P2 mới. **D-P2-01 (P3, pre-existing)** text-only 200% tại 1024 vẫn tràn/clip; browser zoom 200% không bị ảnh hưởng bởi thay đổi logo. **D-P1-02 (P3/P8)** font message Manrope Cyrillic-ext vẫn còn 1 message/trang. Không tự hạ severity, không sửa ngoài scope.

**UNVERIFIED / residual:** CI, production deploy, 2 pipeline dữ liệu **NOT RUN** (không push/deploy); real GPU/FPS, Safari/Firefox, screen reader/axe, Lighthouse/Web Vitals/INP, physical-device QA, pixel-perfect **NOT RUN**; browser QA dùng Chromium headless + SwiftShader cho 3D, không đại diện GPU thật. Preview intro harness nhạy với tải CPU (đã nêu). `P2 OWNER REVIEW` chưa phải `GATE 2 APPROVED`/GO.

**Cleanup candidates — historical list, later executed under §13.19:** bản wordmark archive (`gate2/videos/gate2-wordmark/`, `gate2/wordmark-frames/`, `logs/gate2-wordmark/`, `shots/gate2-wordmark/`, `logs/capture-gate2-wordmark.json`); raw video `gate2/videos/raw/`; extracted frame PNG; contact sheet HTML tạm. **Giữ:** official logo assets, ảnh/video/log current-state, baseline P0/P1/P2, QA logs và manifest.

**Evidence register:** `gate2/brand/{shots,contact-sheet-brand-6viewports.png}`, `logs/brand/{verify-logo,nav-layout}.json`, `gate2/videos/{gate2-dropdown-keyboard-vi-1440x900,gate2-intro-3x-vi-1440x900}.webm`, `logs/{gate2-dropdown-video,gate2-intro-3x,capture-after,itm-check}.json`, `logs/p2-preview/preview-smoke.json`, `logs/p2-brand/full-test.log`, `gate2/asset-manifest.txt`, `shots/{gate2-before,after}`.

**Decision:** **P2 OWNER REVIEW.** Logo chính thức đã được khôi phục; brand identity lock có hiệu lực; Phase 3 và cleanup P2 bị khóa; không commit/push/merge/deploy. Owner quyết định Gate 2 tiếp theo sau khi xem bằng chứng.

### 13.19 P2 CLOSEOUT — GATE 2 APPROVED & CLEANUP VERIFIED (31/10/2026)

**Status:** `P2 APPROVED / CLEANUP_VERIFIED / GATE 2 GO / P3 OPEN`. Owner đã xác nhận **`GATE 2 APPROVED`** ngày 31/10/2026 và chọn trình tự **“Approve Gate 2; cleanup then P3”**. Cleanup chỉ giới hạn ở artifact scratch đã ignore; không xóa source, logo chính thức, asset owner, model, baseline rollback hoặc tài liệu owner. Không commit/push/merge/deploy.

**1. Cleanup manifest:** `scratch/ignition/p2-shell/CLEANUP_MANIFEST.md`.

| Hạng mục | Giá trị |
|---|---|
| Backup ngoài source tree | `E:\Formula 1\archives\ignition-p2-cleanup-2026-10-31\` |
| File / dung lượng | **220 file / 95.525.174 B** |
| Integrity | `SHA256SUMS.txt` xác minh **220/220 OK** trước và sau khi xóa |
| Phương thức | `cp -a --parents` → hash verify → xóa từng path; không `git clean`/`reset --hard`/force push |
| Đã xóa | wordmark archive 142 shots + 24 gate2 shots + 4 contact sheet + 3 wordmark PNG + 21 frames + 2 videos + 2 logs + 1 capture log + 9 raw videos + 4 pre-brand frames + 7 closeout probe/debug + 1 HTML tạm |
| Giữ nguyên | official logo 7 asset + `eds-g01.glb`, `gate2/brand/`, `gate2/closeout/`, videos/frames current-state, `shots/{after,gate2-before,before}`, QA logs, P0/P1 baseline, owner docs, `source-assets/`, `apps/web/dist` (rebuild), `apps/web/NUL/` pre-existing |

**2. Re-QA sau cleanup — log tại `scratch/ignition/p2-shell/logs/requal-2026-10-31/` (mỗi gate có `.log` + `.exit`):**

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| `git diff --check` | **PASS** exit 0; chỉ 3 cảnh báo CRLF sẽ chuyển LF (`Navbar.test.tsx`, `MobileAllInOne.tsx`, `AboutPage.tsx`), không có whitespace error | `diffcheck.{log,exit}` |
| ESLint | **PASS** exit 0 — 0 error, 15 warning pre-existing | `lint.{log,exit}` |
| TypeScript | **PASS** exit 0 — api/web/contracts/security 4/4 | `typecheck.{log,exit}` |
| Tests | **PASS** — **389** = web 371 (65 file) + API 16 (3 file) + security 2 (1 file); 0 fail | `test.{log,exit}` |
| Build | **PASS** exit 0 — Vite 8.90s; SEO 72 route; 4 Engineering article; commercial isolation PASS (32 module/116 artifact); Cloudflare output PASS; `dist/client` 5.319.266 B / `dist` 5.335.245 B | `build.{log,exit}` |
| Security | **PASS** — secret scan + public asset boundary PASS; `npm audit --audit-level=high` exit 0; 12 moderate dev-tooling (minimatch qua ESLint), không high/critical, không đổi dependency | `secrets.*`, `assets.*`, `audit.*` |
| Browser smoke (local production preview, `127.0.0.1:4173`, rebuilt `dist/client`) | **PASS** — 36/36 row (6 route × 3 viewport × EN/VI), 13/13 check; 0 overflow, 0 pageerror, 0 HTTP ≥400, nonKnown 0; 36 console message đều là cùng message font Manrope data/WOFF2 (**D-P1-02**, pre-existing, EN/VI không ảnh hưởng); desktop shell 6 link + CTA, mobile drawer 44×44 close/56px link + focus trap + body lock, intro skip/session/reduced-motion, Back/Forward + constructor deep link PASS; production EDS-G01, no Model B badge, no ITM node | `preview-smoke-post-cleanup.json`; bản trước cleanup giữ tại `preview-smoke-pre-cleanup.json` |

**3. Kết luận:** mọi gate bắt buộc sau cleanup **PASS** → **`P2 CLEANUP_VERIFIED`**, **Gate 2 GO**, **Phase 3 được mở**. Không có P0/P1/P2 mới. Residual giữ nguyên: **D-P1-02** (P3/P8, font Cyrillic-ext không dùng), **D-P2-01** (P3, text-only 200% tại 1024 pre-existing). CI, production deploy, 2 pipeline dữ liệu, real GPU/FPS, Safari/Firefox, screen reader/axe, Lighthouse/Web Vitals/INP và physical-device QA vẫn **NOT RUN**; browser QA dùng Chromium headless + SwiftShader cho 3D, không đại diện GPU thật.

**4. Phase 3:** chỉ bắt đầu sau mốc này, theo scope P3.1–P3.6 và dừng tại `P3 QA_READY — GATE 3 OWNER REVIEW`; không cleanup P3 trước approval; không commit/push/merge/deploy.

### 13.20 P3 HOMEPAGE EXECUTION — QA READY (31/10/2026)

**Status lịch sử:** **`P3 QA_READY — GATE 3 OWNER REVIEW`** — đã được **superseded bởi §13.21** sau vòng owner review “GATE 3: CHANGES REQUESTED”. P3.1–P3.6 đã hoàn tất trên local checkout; Gate 2 vẫn `APPROVED / CLEANUP_VERIFIED`. Không commit, push, merge, deploy; **không cleanup P3** và **không bắt đầu P4** trước quyết định của owner.

**1. Phạm vi source đã thay đổi (chỉ homepage):** `FeaturedRace.tsx` (Latest GP + Race Intelligence), `HomeView.tsx` (section order/reveal), `HomeStoryLinks.tsx` (Explore + Editorial), `PodiumBrandHero.tsx` (hierarchy/reveal/media guards), `homepageH1.css`, `podiumHeroR1.css`, và test mới `FeaturedRace.test.tsx`. Không đổi package, route, query contract, API, Results Engine, dữ liệu nền, intro timing, Model B hay ITM; không thêm public asset. Official PODIUM EDS logo và asset gốc giữ nguyên.

**2. Bố cục sau P3 (desktop → mobile):**

| # | Section | Thay đổi thực tế |
|---:|---|---|
| 1 | Hero | Eyebrow `THE RACING EXPERIENCE REIMAGINED`; H1 3 dòng `RACE / BEYOND / LIMITS.` (VI `ĐUA / VƯỢT / GIỚI HẠN.`); subheading ngắn; 2 CTA `Explore the season` → Results và `Open Showroom` → Showroom; side meta + HUD EDS/G01 + lifestyle note; một media stage. Mobile order: eyebrow → H1 → subheading → media → CTA; logo official không đổi |
| 2 | News ticker | Giữ nguyên; route calendar thật; pause offscreen/hover/focus/reduced-motion |
| 3 | `01 / Latest Grand Prix` | `FeaturedRace` được tái cấu trúc thành identity + classification đã xác minh + Race Intelligence; loại bỏ nguy cơ trùng identity với block Featured Race cũ |
| 4 | Countdown | Giữ countdown/next-round thật, re-number theo section order; không đổi logic |
| 5 | Season overview | Giữ driver/constructor leaders; không đổi nguồn dữ liệu |
| 6 | `04 / Explore` | 6 card: Results, Standings, Drivers, Teams, Showroom 3D, Engineering; desktop 3 cột, ≤1023 2 cột, ≤767 1 cột; mobile dạng row card gọn |
| 7 | `05 / Editorial` | Giữ 3 article card source-checked; không thay nội dung |

`FeaturedRace` không còn là một block identity riêng; Latest GP đảm nhiệm cả hai vai trò để **không lặp thông tin**. Season overview/editorial/countdown/ticker được giữ vì vẫn mang dữ liệu và giá trị riêng, không phải placeholder.

**3. Latest GP + dữ liệu đã xác minh:** chỉ chọn round `status === 'completed'`, `!isSynthesized`, `entries.length > 0`, round cao nhất; render top 8 theo `position` và chỉ các field có thật. Race Intelligence chỉ suy ra từ chính race đó: winning margin, fastest lap, biggest gain; không suy diễn điểm/đội. Sprint tab chỉ xuất hiện khi có sprint entries đã xác minh. Loading `syncing`, lỗi sync và trạng thái không có classification đều có copy trung thực và link tới Standings/Calendar, không hiển thị dữ liệu giả.

| Quan sát dữ liệu cuối | Giá trị |
|---|---|
| Baseline bundled | R15 Azerbaijan (verified), dùng khi sync chưa xong |
| Runtime sync local | `/api/jolpica` 200, 18 completed rounds; `f1_sync_meta_v2` success, source `Jolpica F1 API` |
| Latest GP cuối | Round 18 United States GP, COTA, 25 Oct 2026; winner Andrea Kimi Antonelli; FL Charles Leclerc `1:37.976`; margin `+13.078`; biggest gain `+3` (NOR P8→P5) |

Không thêm endpoint/API và không sửa Results Engine. Health của hai workflow data tự động trên GitHub **chưa được xác minh** trong môi trường local này; chỉ quan sát proxy sync local.

**4. Route integrity (chỉ route hiện có):** Results `/season/2026?tab=results`; Standings `/season/2026?tab=standings`; Drivers `/drivers`; Teams `/teams`; Showroom `/showroom`; Engineering `/engineering` (DEV ITM) hoặc `/engineering/car-anatomy` (production); Latest GP deep link `/season/2026/race/:round`. Không tạo `/races`, `/circuits`, `/stories` hoặc route mới. QA xác nhận 6/6 card + 2 hero CTA + ticker + mobile hub + browser Back/Forward.

**5. Motion/media (không đổi timing intro):**

| Hạng mục | Bằng chứng |
|---|---|
| Intro 3× | Đo production preview chuẩn (không software-GL interference): mount→remove **3348–3350 ms** trên bundle cuối; video timing riêng **3356 ms**; phase awakening→pressure→lights-out→launch đúng |
| Skip/ESC | ESC remove sau **675–757 ms** (final bundle 681 ms); skip button hoạt động; session key `podium-start-lights-seen=1`; quay lại cùng session không phát lại |
| Reduced motion | Không intro, không blur reveal, ticker animation `none`, overflow không khóa |
| Hero reveal | Anime.js `createScope`: opacity `.55→1`, translateY `24→0`, blur `9→0`, 620 ms `out(4)`, stagger 70 ms; rail 900 ms; `scope.revert()` khi unmount/reduced |
| Section/card/countdown | CSS reveal 620 ms + delay 90/80/150 ms; odometer 520 ms; countdown rail 850 ms; hover card 240 ms; tắt dưới reduced motion |
| Ticker | Một ticker 42 s linear; pause offscreen/hover/focus; không particle/flame/second canvas |
| Media | DEV: một video single-play + poster, pause offscreen/resume, fallback khi ended/error; production: lazy EDS-G01 3D + SVG poster, `frameloop` chỉ active khi hero visible, mobile/low-end poster; 0 request Model B; production Engineering vào `/engineering/car-anatomy`, không ITM |
| Observation | Khi chạy SwiftShader, shader compile của 3D làm main thread bận và intro wall-clock kéo dài **5.885–6.233 ms**, dù timing profile vẫn 3.350 ms. Đây là quan sát môi trường software-GL, không phải thay đổi intro; GPU thật **NOT RUN** |

**6. QA evidence:** `scratch/ignition/p3-home/` (before/after, videos, contact sheet, logs/gates).

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| ESLint | **PASS** exit 0 | `logs/gates/lint.log` |
| TypeScript | **PASS** exit 0, 4/4 workspace | `logs/gates/typecheck.log` |
| Tests | **PASS** **392** = web 374 (66 file) + API 16 (3 file) + security 2 (1 file), 0 fail | `logs/gates/test.log` |
| Build | **PASS** exit 0; Vite 9,40 s; SEO 72 route; commercial isolation PASS (32 module/116 artifact); Cloudflare output PASS | `logs/gates/build.log` |
| Security | **PASS** secret scan + public boundary; `npm audit --audit-level=high` exit 0; 12 moderate dev-tooling pre-existing (minimatch/ESLint), không high/critical, không đổi dependency | `logs/gates/{secrets,assets,audit}.log` |
| Browser QA production preview | **PASS 46/46**, 0 failure, **0 console error**; 6 viewport × EN/VI; overflowX 0; 1 H1; 6 card; 7 section; không overlap/clip; focus ring 2px amber; keyboard Enter + Back/Forward; reduced motion 375/1440; browser zoom 200% (720×450, 512×384); HTTP/CSP headers OK | `logs/gates/qa-final.log` |
| Visual capture | **PASS 12/12 row**, 0 issue; **24 before PNG** + **36 after PNG** (hero/full/home × 6 viewport × VI/EN) + 5 detail section + contact sheet | `before/`, `after/`, `contact/`, `P3_BEFORE_AFTER_CONTACT_SHEET.png` |
| Intro/video guards | Intro timing/skip/session/reduced + video visibility + motion guards **PASS**; video visibility dùng WebM substitute 7,16 s cho clip DEV 1,516 s | `logs/p3-5-*`, `logs/p3-6-intro-prod-defaultgl.json`, `logs/p3-6-intro-timing-video.json` |
| SEO metadata (local preview) | Title/description/H1/OG có; `robots` = `noindex, nofollow` do build context local (`indexing=false`, site UNCONFIGURED); canonical null; **production indexing NOT VERIFIED** | Chromium DOM probe, `build.log` |
| Motion videos | desktop intro→hero 6,28 s; desktop scroll 20,04 s; mobile hero→scroll 11,32 s; intro timing video 3356 ms | `videos/*.webm` |

**7. Bundle delta (P2 approved build → P3 final build):** HomeView JS **24,95 → 35,53 kB** (gzip 8,36 → 11,01), HomeView CSS **22,20 → 34,47 kB** (gzip 4,98 → 6,63); index JS **628,89 kB không đổi**, index CSS **182,92 → 181,79 kB**. Không thêm package; phần tăng nằm trong chunk HomeView lazy, không đẩy vào first-load shell ngoài route home. Đây là bundle size, **không phải** kết luận performance.

**8. Mức độ giống IGNITION và phần giữ lại:** đạt các cấu trúc nhận diện chính của mockup 01 — eyebrow + 3-line display headline (từ cuối màu ignition) + subheading + 2 CTA + media stage bên phải + side meta/HUD; Latest GP bố cục identity trái / classification phải / 3 metric; Explore 6 card; Editorial giữ. Khác mockup có chủ đích: dùng dữ liệu thật, bỏ card Race Center/Configure trùng chức năng, không bịa circuit elevation/turn, không copy logo/ảnh/dữ liệu mockup, và giữ official logo. Giữ ticker/countdown/season overview/editorial/FeaturedRace/intro/nav/mobile hub vì đều có chức năng hoặc dữ liệu riêng; không giữ phần tử trang trí không có mục đích.

**9. Defects:** không có **P0/P1/P2 mới**. Không sửa test hay nới gate. 5 lỗi harness QA ban đầu đã được sửa minh bạch, không phải defect app: regex query của Engineering card, click marquee ticker không ổn định, filter drop-shadow bị nhầm là blur, chờ scene production chưa đủ lâu, và chờ data sync R18 chưa settle.

**Residual / observations không chặn Gate 3:** **O-P3-01** (P4, môi trường): SwiftShader làm intro wall-clock dài hơn; real GPU chưa đo. **D-P2-01** (P3): text-only 200% tại 1024 vẫn tràn header, pre-existing; browser zoom 200% PASS. **D-P1-02** (P3/P8): font Cyrillic-ext message pre-existing, EN/VI không ảnh hưởng. Không hạ severity.

**10. Cleanup candidates — chỉ sau `GATE 3 APPROVED` và phải có manifest + backup:** các script chẩn đoán một lần `diag-*.cjs`, `extract-motion-frames.cjs`, `videos/frame-*.png` và các bản ghi Playwright thô `videos/page@*.webm` sau khi owner đã xem; các log QA trùng/không cần giữ; HTML render contact sheet nếu không cần tái lập. **Giữ:** before/after PNG, contact sheet, 4 video có tên, log gate hiện tại, `P3_AUDIT.md`, `P3_MOTION_MAP.md`, official logo/asset, EDS-G01, source, baseline P0–P2, `dist` để preview. Không xóa asset gốc hoặc baseline rollback.

**11. Rollback:** P3 chưa commit. Thay đổi P3 nằm trong 6 source file homepage + 1 test; rollback đúng cách là **inverse patch các hunk P3** (không dùng `git checkout`/`reset` toàn file vì working tree còn chứa P1/P2 đã được owner duyệt). Không có migration/dữ liệu cần rollback; logo/asset không đổi; build lại `dist` từ source sau rollback. Không có snapshot source P2 riêng trong repo — nếu cần quay về toàn bộ trạng thái P2, phải dùng artifact/plan đã duyệt và inverse patch có kiểm soát.

**12. NOT RUN / giới hạn release:** real-GPU FPS/frame-time, LCP/CLS/INP field data, Lighthouse, physical-device, Safari/Firefox, axe/screenreader thủ công, CI checks, preview/production deployment, production smoke test, health hai workflow data tự động, production indexing và canonical deployment chưa chạy. Đây là lý do trạng thái dừng ở **OWNER REVIEW**, không phải GO phát hành; performance **không được claim PASS**.

**Owner review package:** `scratch/ignition/p3-home/P3_BEFORE_AFTER_CONTACT_SHEET.png`; `videos/desktop-intro-hero.webm`, `videos/desktop-scroll.webm`, `videos/mobile-hero-scroll.webm`, `videos/desktop-intro-3x-prod.webm`; `before/`, `after/`, `contact/`, `logs/gates/`.

### 13.21 P3 FINAL VISUAL POLISH — OWNER REVIEW (31/10/2026)

**Status:** **`P3 FINAL OWNER REVIEW`**. Owner đã review P3 và yêu cầu 3 chỉnh sửa (P3-V01…V03); cả ba đã được triển khai, đo và QA lại trên **cùng production build** đang chạy preview local. Gate 2 vẫn `APPROVED / CLEANUP_VERIFIED`; P4, cleanup, commit, push, merge và deploy đều **khóa**. Không sửa dữ liệu, route, API, Results Engine, intro timing, Model B/ITM hay official logo.

**1. Phạm vi source của vòng polish:** `HomeStoryLinks.tsx` (label mobile + VI Engineering), `FeaturedRace.tsx` (localize panel index/sr-only heads/data-source fallback), `homepageH1.css` (card mobile + metrics/classification ≤479), `HomeStoryLinks.test.tsx`, `FeaturedRace.test.tsx`. Không đổi package, route, query contract, dữ liệu, asset hay tài liệu nào ngoài file plan này.

**2. Findings, fix và kết quả đo:**

| ID | Trước (baseline 1.3.7) | Fix | Sau (production preview, 31/10/2026) |
|---|---|---|---|
| **P3-V01** Mobile Explore cards | Ở 375/390, `.h25-card__type` bị `display:none`; card 78 px chỉ còn slogan headline + icon; 6 tên danh mục không hiển thị | ≤767: card row `min-height 64px`, icon 44 px; `.h25-card__body` chuyển flex column, type 10.88 px; ẩn copy paragraph + CTA text; base desktop giữ `display:contents` để không đổi layout | 6/6 label hiển thị ở **375/390/768/1024/1440/1920 × EN/VI**: `Results/Kết quả`, `Standings/Bảng xếp hạng`, `Drivers/Tay đua`, `Teams/Đội đua`, `Showroom 3D`, `Engineering/Kỹ thuật`; card 72 px (VI Showroom 85 px); contrast **9.79:1**; routes 6/6 nguyên vẹn; overflowX **0**; desktop card 257–312 px như cũ |
| **P3-V02** Race Intelligence localization | Panel index `RACE INTELLIGENCE`, sr-only table heads `Pos/Driver/Team/Time / Gap` và fallback source `Championship data` hardcoded EN, kể cả khi VI | Localize theo `lang`: `PHÂN TÍCH CHẶNG ĐUA`, `Hạng/Tay đua/Đội/Thời gian / Cách biệt`, fallback `Dữ liệu giải đấu`; giữ proper nouns, `Sprint`, dữ liệu và brand | VI: panel index + 7 sr heads đúng, fallback đã dịch; EN không đổi; 6 viewport × 2 ngôn ngữ PASS; live language switch đổi cả index, 6 card label và 7 sr heads; `Jolpica F1 API`, `Andrea Kimi Antonelli`, `LEC · Ferrari`, `NOR · P8 → P5` giữ nguyên |
| **P3-V03** Mobile metrics | 375/390: 3 cột 111/116 px, label 9.92 px, value 14.72 px, detail 10.56 px; nhãn VI xuống dòng từng chữ, chật; text-only 200% làm trang tràn **119 px (375)** và **104 px (390)** | ≤479: 3 metric thành 3 block full-width xếp dọc (label 10.88 / value 16.8 / detail 11.52 px); classification cuộn trong khung (`overflow-x:auto`); ≥480 giữ nguyên 3 cột/label 9.92–10.56 px | Cell rộng **333 px (375) / 348 px (390)**, xếp dọc, không clip, không overflow; contrast **7.99 / 15.34 / 7.99** (đều ≥4.5); giá trị `+13.078`, `1:37.976`, `+3` và big-gain `NOR · P8 → P5` không đổi; 768+ vẫn 3 cột 172–243 px; 200% text zoom: font 21.76/33.6/23.04 px, page overflowX **0**, không cắt nội dung |

**3. Interaction / accessibility / responsive evidence** (`verify-polish-qa.cjs`, 44 check):
- 6 viewport × EN/VI: label visible/rendered, font, contrast, route, overflow; metrics layout, font, contrast, values, clipping; localization.
- Focus: card `:focus-visible` outline **2 px solid amber**, tab order đủ 5 link; Enter card Engineering → `/engineering/car-anatomy?chapter=diffuser`.
- Touch 375: card 1 → `/season/2026?tab=results`; card 6 → `/engineering/car-anatomy?chapter=rear-wing`.
- Hover 1440: transform `none → translateY(-5px)` (mẫu `-4.55px` tại 400 ms), border `#2A3242 → ignition`; corrected harness dùng real mouse + scroll ổn định (không sửa CSS).
- Reduced motion 375: không transition/transform, 6 label vẫn hiển thị, overflowX 0.
- 200% text zoom 375/390: 6 label hiển thị (cao 33–98 px do wrap hợp lý), metrics full-width, page overflowX 0.
- Live language switch 390: EN↔VI đổi đúng index/labels/heads và đổi lại được.

**4. QA gates cuối (cùng build):**

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| Focused tests | **PASS 8/8** (HomeStoryLinks 4 + FeaturedRace 4) | `logs/gates/focused-tests-final.log` |
| Full tests | **PASS 395/395**: web 377 (66 file) + API 16 (3 file) + security 2 (1 file), 0 fail | `logs/gates/full-tests-final.log` |
| ESLint | **PASS** exit 0; **0 error**, 15 warning pre-existing | `logs/gates/lint-final.log` |
| TypeScript | **PASS** exit 0, 4/4 workspace | `logs/gates/typecheck-final.log` |
| Build | **PASS** 9,84 s; `HomeView-BgwBjcsM.js` 35,72 kB (gzip 11,05) + `HomeView-CRMpeFVy.css` 35,09 kB (gzip 6,72); commercial isolation + Cloudflare output PASS; SEO 72 route | `logs/gates/build-polish.log` |
| Production preview QA | **PASS 46/46**, 0 failure, **0 console error**; 6 viewport × EN/VI; hero/ticker/countdown/latest/season/explore/editorial; back/forward; production boundaries | `logs/gates/home-qa-final.log` |
| Polish QA | **PASS 44/44**, 0 failure, **0 console error** | `logs/gates/polish-qa.json`, `polish-qa.log` |
| Security | Secrets + public asset boundary **PASS**; `npm audit --audit-level=high` exit 0; 12 moderate pre-existing dev-tooling, 0 high/critical | `logs/gates/security-*-final.log`, `npm-audit-final.log` |
| Intro bảo toàn | Default `/` **3× = 3352 ms** (không có stored preference); `?intro=3x` 3347 ms; ESC skip 671 ms; session key `podium-start-lights-seen=1`; quay lại session không phát lại; reduced motion không intro (`data-motion-engine=reduced`); `?intro=false` không intro | `logs/gates/intro-default-speed.log`, `intro-final-production.log` |
| DEV/production boundary | Production: 0 video hero, EDS-G01 GLB là model duy nhất, Model B không request, Engineering → `/engineering/car-anatomy`; DEV ITM được bao phủ trong full suite (66 file), 8/8 focused test là HomeStoryLinks + FeaturedRace | `home-qa-final.log`, `focused-tests-final.log` |
| Logo lock | `logo.png` SHA-256 `226ab6f1…9036acd2`; `logo-compact.png` `424a28bf…a8176125` — **khớp baseline P2**, không crop/redraw/refont | `sha256sum`, git status logo path sạch |
| Visual before/after | **72 ảnh section** (3 section × 6 viewport × EN/VI × before/after) + **14 ảnh textzoom** (6 before + 6 after VI + 2 QA) + 3 trạng thái (hover/focus/reduced); 3 contact sheet | `p3v-before/`, `p3v-after/`, `p3v-contact/p3v01-explore.png`, `p3v02-race-intelligence.png`, `p3v03-metrics.png` |

**5. Harness corrections (không phải defect app, không sửa gate):** expectation font desktop đúng là **9.92/16.8/10.56 px** (chỉ ≤479 mới 10.88/16.8/11.52); route Engineering production tự thêm `?chapter=…` nên kiểm tra bằng `startsWith`; hover probe cũ lấy mẫu khi smooth-scroll chưa ổn định nên `:hover` mất trước 400 ms — đã chuyển sang real mouse + scroll ổn định và PASS. Vòng `verify-home-qa` cần hover trước khi click marquee ticker (đúng hành vi pause-on-hover); không thay đổi app.

**6. Quan sát / residual risks:** 12 moderate npm là dev-tooling pre-existing, không high/critical; `D-P2-01` text-only 200% tại 1024 vẫn là pre-existing ngoài phạm vi polish (browser zoom 200% và 375/390 text-only đã PASS); element screenshot desktop có navbar fixed xuất hiện giữa section ở **cả before và after** — artifact capture, không phải regression; `apps/web/NUL/` là thư mục log wrangler cũ (24/10, ignored, trước P3) và chỉ tạo warning Git trên Windows, không được xóa trong P3.

**7. NOT RUN (không claim PASS):** real-GPU FPS/frame-time, LCP/CLS/INP field data, Lighthouse, physical-device, Safari/Firefox, axe/screen-reader thủ công, CI/GitHub Actions, preview/production deployment và production smoke test, health của **hai workflow data tự động**, production indexing/canonical, và xác minh dữ liệu trên môi trường production thật. Đây là lý do dừng ở **OWNER REVIEW**, không phải GO phát hành.

**8. Owner review package:** `scratch/ignition/p3-home/p3v-contact/` (3 contact sheet), `p3v-before/` + `p3v-after/` (full-res), `logs/gates/polish-qa.{json,log}`, `home-qa-final.log`, `build-polish.log`, `intro-*-production.log`.

**Rollback:** vòng polish chỉ gồm 3 source file + 2 test; rollback là inverse patch các hunk P3-V01…V03, **không** dùng `git checkout/reset` toàn file vì working tree còn P1/P2/P3 đã được duyệt. Không có migration/dữ liệu/asset cần rollback.

**Kế tiếp:** vòng này được kế tiếp bởi **§13.22 — GATE 3 FINAL ACCEPTANCE** (12 px labels + đo ESC riêng). §13.21 giữ nguyên làm bằng chứng lịch sử.

### 13.22 P3 FINAL ACCEPTANCE — 12 PX LABELS + ESC LATENCY (31/10/2026)

**Status:** **`GATE 3 FINAL ACCEPTANCE — APPROVED P3 PENDING`**. Owner xác nhận P3-V01…V03 đã có kết quả QA PASS và yêu cầu hai kiểm tra cuối trước khi đóng Gate 3: (1) nâng nhãn Explore Cards và Latest GP Metrics tại 375/390 lên tối thiểu **12 px** theo `DESIGN.md`, không tăng overflow/chồng chữ ở 200% text zoom; (2) tách riêng phép đo **ESC keydown → intro biến mất**, không đổi intro mặc định 3×. Cả hai đã hoàn tất trên **cùng production build**; homepage layout, dữ liệu, route, API, Results Engine, Model B/ITM, intro timing và official logo **không đổi**. Gate 2 vẫn `APPROVED / CLEANUP_VERIFIED`; P4, cleanup, commit, push, merge, deploy đều **khóa** cho đến khi owner xác nhận `APPROVED P3`.

**1. Phạm vi source của vòng acceptance:** duy nhất `apps/web/src/components/home/homepageH1.css` — 3 declaration trong mobile media query:
- `≤767px` `.h25-card__type`: `font-size .68rem → .75rem` (**10,88 → 12 px**), thêm `line-height: 1.3`.
- `≤479px` `.home-latest-gp__intel span`: `.68rem → .75rem` (**10,88 → 12 px**), thêm `line-height: 1.3`.
- `≤479px` `.home-latest-gp__intel small`: `.72rem → .75rem` (**11,52 → 12 px**), thêm `line-height: 1.35`.

Không đổi desktop/base (Explore type 10,88 px; intel label 9,92 px; detail 10,56 px), không đổi value 16,8 px, grid, route, query contract, dữ liệu, asset hay `DESIGN.md`. Không sửa intro timing, Model B, ITM, Results Engine.

**2. Kết quả đo nhãn (production preview, 31/10/2026):**

| Target | Trước vòng này | Sau — normal 375/390 | Sau — 200% text zoom |
|---|---|---|---|
| Explore label (6, EN/VI) | 10,88 px | **12 px / 15,6 px**; card 72 px (VI Showroom 3D 84 px); 6/6 hiển thị, không overlap, nằm trong card; page overflowX **0** | **24 px / 31,2 px**; card 166–347 px do wrap hợp lý; không overlap; không clip; section overflow **0** |
| Latest GP metric label | 10,88 px | **12 px / 15,6 px**; cell 333 px (375) / 348 px (390) | **24 px / 31,2 px**; cell 293 / 308 px; không clip |
| Latest GP metric detail | 11,52 px | **12 px / 16,2 px**; 3 cell full-width xếp dọc; contrast **7,99 / 15,34 / 7,99** | **24 px / 32,4 px**; không clip |
| Metric values | +13.078 / 1:37.976 / +3 | **không đổi**; `LEC · Ferrari`, `NOR · P8 → P5` không đổi | **không đổi** |

**3. Overflow A/B tại 200% text zoom (chứng minh không tăng):**

| Đo | EN 375 | EN 390 | VI 375 | VI 390 |
|---|---|---|---|---|
| Page overflowX — nhãn 12 px (mới) | 22 px | 18 px | **0** | **0** |
| Page overflowX — nhãn cũ 10,88/11,52 px (legacy inject) | 22 px | 18 px | **0** | **0** |
| `.h25-explore` section overflow | **0** | **0** | **0** | **0** |
| `.home-latest-gp` section overflow | **0** | **0** | **0** | **0** |

Page overflow EN **22/18 px là pre-existing, không đổi** so với chính nhãn cũ; nguồn là block countdown (`.h1-countdown__digits` / `.h1-countdown__timing`), không phải Explore hay Latest GP. Classification cuộn trong khung riêng (`overflow-x:auto`) **160/145 px** khi 200%; đây là containment theo thiết kế, không phải page overflow. VI 200% page overflow **0**. Không có chồng chữ, không cắt nội dung.

**4. Đo ESC riêng — tách khỏi mount→remove:**

- Phép đo cũ **671 ms** là `remove − mount` với ESC nhấn **400 ms sau khi selector intro xuất hiện**; vì vậy nó gồm cả thời gian intro đang chạy + overhead, **không phải** độ trễ phản hồi ESC.
- Phép đo mới (`verify-esc-latency.cjs`): ghi `performance.now()` tại **keydown capture phase** và tại **MutationObserver khi `.podium-intro` bị remove**, backup poll 10 ms; 5 run tại 1440×900, ESC ở 600 ms.
- Kết quả: **1,0 / 1,6 / 1,6 / 1,4 / 1,3 ms** — min **1,0 ms**, median **1,4 ms**, max **1,6 ms**; tất cả < 100 ms. ESC nhận ở phase `pressure`, `data-speed=3x`, session key `podium-start-lights-seen=1`, không có page error.
- Intro mặc định **3× không đổi**: 3 lần đo `remove − mount` = **3346 / 3349 / 3353 ms** (baseline trước đó 3352 ms), không có stored speed preference; `DEFAULT_INTRO_SPEED = '3x'` trong `startLightsTiming.ts` không bị sửa (git status sạch).

**5. Ảnh nghiệm thu cuối:** **24 ảnh section PNG** trong `scratch/ignition/p3-home/p3v-final/` — EN/VI × 375/390 × Explore/Latest GP/Intel × normal/200% text zoom; 3 contact sheet PNG `final-contact-explore.png`, `final-contact-latest-gp.png`, `final-contact-intel.png`. `capture-final-acceptance.cjs` đạt **8/8 check** (4 normal + 4 zoom), 0 failure; ảnh Latest GP xác nhận dữ liệu R18 được giữ nguyên (`Andrea Kimi Antonelli`, `+13.078`, `1:37.976`, `+3`, `NOR · P8 → P5`, `Jolpica F1 API`). Element screenshot vẫn có navbar fixed xuất hiện giữa crop như các vòng trước — artifact capture, không phải regression.

**6. QA gates cuối (cùng build):**

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| Focused tests | **PASS 8/8** (HomeStoryLinks 4 + FeaturedRace 4) | `logs/gates/focused-tests-acceptance.log` |
| ESLint | **PASS** exit 0; **0 error**, 15 warning pre-existing | `logs/gates/lint-acceptance.log` |
| TypeScript | **PASS** exit 0, 4/4 workspace | `logs/gates/typecheck-acceptance.log` |
| Full tests | **PASS 395/395**: web 377 (66 file) + API 16 (3 file) + security 2 (1 file), 0 fail | `logs/gates/full-tests-acceptance.log` |
| Build | **PASS** 10,11 s; `HomeView-CK6rPTrJ.js` 35,72 kB (gzip 11,05) + `HomeView-mOAtwAo4.css` 35,14 kB (gzip 6,72); commercial isolation **PASS** (32 module/116 artifact); Cloudflare output **PASS** (4 Engineering article); SEO **72 route** | `logs/gates/build-acceptance.log` |
| Polish QA | **PASS 44/44**, 0 failure, **0 console error**; 6 viewport × EN/VI; focus/touch/hover/reduced motion/live language switch/200% zoom | `logs/gates/polish-qa-acceptance.{json,log}` |
| Home QA | **PASS 46/46**, 0 failure, **0 console error**; routes, hero media boundary, ticker, reduced motion, browser zoom, production boundaries | `logs/gates/home-qa-acceptance.log` |
| Security | Secrets **PASS**; public asset boundary **PASS**; `npm audit --audit-level=high` exit 0; 12 moderate pre-existing dev-tooling, 0 high/critical | `logs/gates/security-secrets-acceptance.log`, `security-assets-acceptance.log`, `npm-audit-acceptance.log` |
| Logo lock | `logo.png` **226ab6f1…9036acd2**; `logo-compact.png` **424a28bf…a8176125** — khớp baseline P2; git status hai path **sạch** | `sha256sum`, `git status` |
| Data / protected scope | R18 values preserved; `results-engine`, `insideMachineI1`, `detailedResults2026.ts`, `results.ts`, `logo/` **không có modification**; Model B chỉ là untracked pre-existing, không sửa | `git status` theo path |
| Final capture | **PASS 8/8**, 0 failure; 24 PNG + 3 contact sheet | `logs/gates/final-acceptance-capture.{json,log}`, `p3v-final/` |

**7. Harness / môi trường (không phải defect app):** lần chạy polish QA **đầu tiên sau khi restart preview** đo context EN-375 trước khi sync Jolpica hoàn tất (request đầu `/api/jolpica` mất **12.255 ms**), nên thấy fallback tĩnh R15 (`Formula1.com result snapshot`, RUS/VER/HAD, +0,196s) và 2 check dữ liệu fail; **10 context còn lại** đã thấy R18 (`Jolpica F1 API`) và PASS. Chạy lại khi API ấm: **44/44 PASS**. Không sửa app/harness expectation; đây là race thời điểm hydrate dữ liệu, và cold-start hiển thị snapshot tĩnh đã xác minh là hành vi pre-existing ngoài phạm vi nhãn 12 px. Log lần chạy lạnh được giữ tại `polish-qa-acceptance-cold.{json,log}` để đối chiếu.

**8. Quan sát / residual risks:** 12 moderate npm là dev-tooling pre-existing; EN 200% text-only page overflow **22/18 px** là pre-existing từ countdown (không tăng bởi thay đổi này); fixed-navbar trong element screenshot là artifact capture; `D-P2-01` text-only 200% tại 1024 vẫn ngoài phạm vi; cold-start data hydration có thể hiển thị snapshot R15 (dữ liệu tĩnh đã xác minh) trong khoảng 12 s ở lần fetch nguồn đầu tiên của preview local trước khi Jolpica sync xong — không phải regression của vòng này, không sửa dữ liệu.

**9. NOT RUN (không claim PASS):** real-GPU FPS/frame-time, LCP/CLS/INP field data, Lighthouse, physical-device, Safari/Firefox, axe/screen-reader thủ công, CI/GitHub Actions, preview/production deployment và production smoke test, health của **hai workflow data tự động**, production indexing/canonical, xác minh dữ liệu trên production thật.

**10. Owner review package:** `scratch/ignition/p3-home/p3v-final/` (24 PNG + 3 contact sheet), `logs/gates/final-acceptance-capture.{json,log}`, `polish-qa-acceptance.{json,log}`, `home-qa-acceptance.log`, `build-acceptance.log`, `esc-latency-final.{json,log}`, `intro-default-speed-final.log`, `focused-tests-acceptance.log`, `security-*-acceptance.log`, `npm-audit-acceptance.log`.

**Rollback:** chỉ 3 declaration CSS trong `homepageH1.css`; rollback là inverse patch về `.68rem/.72rem` không line-height, **không** dùng `git checkout/reset` toàn file vì working tree còn P1/P2/P3 đã duyệt. Không có migration/dữ liệu/asset cần rollback.

**Dừng tại GATE 3 FINAL ACCEPTANCE:** chờ owner xác nhận **`APPROVED P3`**. Không commit, push, merge, deploy, cleanup hoặc mở P4.

### 13.23 P3 CLOSEOUT — COUNTDOWN 200% + LATEST GP COLD LOADING (31/10/2026)

**Status lịch sử:** **`P3 CLOSEOUT OWNER REVIEW — GATE 3 APPROVAL PENDING`** — owner đã **`APPROVED P3`** ngày 31/10/2026; cleanup verified tại §13.24. Owner đã nhận revision 1.3.9 và yêu cầu xử lý hai tồn tại trước khi đóng Gate 3, không redesign Homepage: (1) countdown EN 375/390 tràn ngang 22/18 px tại 200% text zoom; (2) Latest GP có thể trình bày snapshot R15 như kết quả mới nhất trong ~12 s cold request. Cả hai đã được sửa tối thiểu trên cùng production build; countdown data/timing, API contract, Results Engine, store, R18 values, official logo, Model B, ITM và intro 3× **không đổi**. Gate 2 vẫn `APPROVED / CLEANUP_VERIFIED`; P4, cleanup, commit, push, merge, deploy đều **khóa** cho đến khi owner xác nhận `APPROVED P3`.

**1. Phạm vi source của vòng closeout (chỉ 3 file):**
- `apps/web/src/components/home/homepageH1.css`: mobile `.h1-countdown__digits` đổi sang `repeat(auto-fit, minmax(min(100%, 4.2em), 1fr))`; thêm `overflow-wrap: anywhere` cho label đếm; thêm màu brake-amber cho `.home-latest-gp__verified.is-syncing` và `.is-stale`. Không đổi desktop/base grid, font size, route hay layout khác.
- `apps/web/src/components/home/FeaturedRace.tsx`: thêm trạng thái `syncing` (spinner + "Checking latest round" / "Đang kiểm tra chặng mới nhất" + snapshot đang dùng) và `error` (cảnh báo + "Latest round unverified" / "Chặng mới nhất chưa xác minh" + snapshot đang dùng), `role="status"`; nhánh success vẫn là verified + source. Không đổi dữ liệu được chọn, bảng, panel, intel hay contract.
- `apps/web/src/components/home/FeaturedRace.test.tsx`: 3 regression test cho syncing EN/VI và error.

Không sửa `HomeRaceCountdown.tsx` (mtime 15:36), `RollingDigits.tsx` (30/10 22:48), `startLightsTiming.ts` (`DEFAULT_INTRO_SPEED = '3x'`, 30/10), `detailedResults2026.ts`, `results-engine/`, `insideMachineI1/`, store/API, logo hay asset Model B; các mtime đều **trước** thời điểm sửa closeout (19:53). `git status` các path bảo vệ **sạch**.

**2. Countdown 200% — tái hiện đúng và root cause (production preview):**

Inject legacy override (4 track `repeat(4, minmax(0,1fr))`, label không wrap) để tái lập CSS trước sửa; đo thật, không suy đoán:

| Đo tại 200% | EN 375 | EN 390 | VI 375 | VI 390 |
|---|---|---|---|---|
| Legacy page overflowX | **22 px** | **18 px** | 0 | 0 |
| Legacy track | 55,75 px | 59,5 px | 55,75 px | 59,5 px |
| Odometer intrinsic (mỗi số) | 89,78 px | 89,78 px | 89,78 px | 89,78 px |
| Label dài nhất (`Seconds`) | scrollWidth **118 px**, text paint right **397,25** | **118 px**, paint right **408,5** | `Giây` 58 px | `Giây` 60 px |
| Legacy digits scroll/client | **357/295** | **368/310** | 329/295 | 340/310 |
| Fixed: cột | **2 × 135,5 px** | **2 × 143 px** | 2 × 135,5 px | 2 × 143 px |
| Fixed: page / section overflow | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** |
| Fixed: label scroll/client | 136/136 | 143/143 | 136/136 | 143/143 |

Root cause xác nhận: container timing EN 375 = 295 px; 4 track chỉ còn 55,75 px trong khi odometer cần 89,78 px và label "Seconds" cần 118 px. Track cuối bắt đầu tại 279,25 px nên text kết thúc 397,25 px = **375 + 22,25**; EN 390 tương tự **390 + 18,5**. VI không tràn trang vì label ngắn hơn (≤67 px), nhưng vẫn có intrinsic overflow 34/30 px trong digits. Fix đưa track lên 135,5/143 px và cho phép label wrap; **không ẩn, không cắt số**, odometer 89,78 px nằm trọn trong track.

- Normal: vẫn 4 cột 74,75 px (375) / 78,5 px (390), page/section overflow **0**.
- Reduced motion tại 200%: **8 giá trị tĩnh**, **0 strip**, overflow **0**; transition/odometer strip bị tắt đúng.
- 400% (ngoài yêu cầu bắt buộc 200%, kiểm theo khả năng browser): digits reflow **1 cột 215/230 px**, odometer **179,6 px** nằm trong track, **digits overflow 0**, values đủ 4. Tuy nhiên page overflow còn **311 / 265 / 296 / 250 px** (EN375/VI375/EN390/VI390) từ identity H2, link "View calendar", status/date và schedule/session text — **không phải digits**, là tồn tại pre-existing ngoài phạm vi fix tối thiểu; không che/cắt số.

**3. Latest GP — minh bạch provenance, không đổi dữ liệu:**

| Trạng thái | UI | Dữ liệu hiển thị |
|---|---|---|
| `syncing` | spinner amber + **"Checking latest round"** / **"Đang kiểm tra chặng mới nhất"**, subline **"Saved R15 snapshot · Formula1.com result snapshot"** (hoặc R18 + Jolpica khi warm), `role="status"`, class `is-syncing` | snapshot đang có vẫn hiển thị, **không** gắn nhãn verified |
| `error` | cảnh báo amber + **"Latest round unverified"** / **"Chặng mới nhất chưa xác minh"**, subline snapshot/source, class `is-stale` | giữ R15 đã lưu, **không** claim verified |
| success | BadgeCheck xanh + **"Verified classification"** / **"Phân loại đã xác minh"** + source | R18 Jolpica như trước |

Không thay đổi thứ tự chọn dữ liệu, table 8 dòng, Race Intelligence, contract `/api/jolpica`, timeout hay cơ chế sync. Không tạo dữ liệu.

**4. Cold / warm / error / timeout (Playwright, production preview, route delay giữ nguyên API contract):**

| Kịch bản | Bằng chứng |
|---|---|
| Cold start — request `/api/jolpica` đầu tiên delay **11.000 ms** | EN pending đo tại **8.137 ms**, verified tại **11.826 ms**; VI **8.129 / 11.828 ms**; pending hiển thị R15 Azerbaijan + "Saved R15 snapshot · Formula1.com result snapshot"; sau đó R18 United States, Antonelli 1:35:16.650, Jolpica |
| Layout shift loading → verified | Section height **1407,4 → 1407,4 px (delta 0)**; CLS tổng **0,0038 (EN) / 0,0067 (VI)** ≤ 0,1; 2 shift entries nhỏ |
| Warm cache — R18 đã lưu, request đầu delay **8.000 ms** | Pending hiển thị **"Saved R18 snapshot · Jolpica F1 API"**, verified sau đó; EN/VI; tại 200% overflow pending/verified **0/0** |
| API error — `route.abort('failed')` | EN/VI chuyển `is-stale` + "Latest round unverified" / "Chặng mới nhất chưa xác minh", giữ R15 Azerbaijan, **không** verified |
| Timeout — route treo 16 s, client `AbortSignal.timeout(12 s)` | EN **12.200 ms**, VI **12.256 ms** → `is-stale`, giữ R15, copy VI đúng; không crash |
| API thật khi ấm | `GET /api/jolpica?path=…&limit=100&offset=0` → **200**, 58.455 B, **11,8 ms**; cold 12 s của origin **không tái lập tự nhiên** trong preview local, nên harness mô phỏng độ trễ mạng và **không** sửa response |

**5. QA gates cuối (cùng build):**

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| Focused tests | **PASS 10/10** (FeaturedRace 7 + Countdown 3) | `logs/focused-closeout.log` |
| Full tests | **PASS 398/398**: web **380** (66 file) + API **16** (3 file) + security **2** (1 file), 0 fail | `logs/tests.log` |
| ESLint | **PASS** exit 0, **0 error**, 15 warning pre-existing (không file closeout) | `logs/lint.log` |
| TypeScript | **PASS** exit 0, cả 4 workspace | `logs/typecheck.log` |
| Build | **PASS** 9,88 s; `HomeView-JAHBztFz.js` 36,27 kB (gzip 11,24) + `HomeView-BCtrdgZq.css` 35,39 kB (gzip 6,76); commercial isolation PASS; Cloudflare PASS; SEO 72 route (local, indexing=false/context UNSET) | `logs/build.log` |
| Security | Secrets **PASS**; public boundary **PASS**; `npm audit --audit-level=high` exit 0 (12 moderate pre-existing dev-tooling, 0 high/critical) | `logs/security-secrets.log`, `security-assets.log`, `security-audit.log` |
| Preview smoke | **PASS 41/41**: EN/VI 390 + EN 1440; verified R18, 8 rows, 0 page overflow, logo SHA khớp, 0 page error, 0 unexpected console error, 0 failed request; 1 CSP font warning pre-existing/page được tách riêng | `logs/preview-smoke.{json,log}` |
| Browser closeout | **PASS 84/84**, 0 fail: 24 countdown check + reduced motion + cold/warm/error/200% + CLS + overflow | `logs/closeout-browser-qa.{json,log}` |
| VI timeout bổ sung | **PASS 4/4**; stale + R15 + copy VI tại 12.256 ms | `logs/timeout-vi.{json,log}` |
| Logo lock | `logo.png` **226ab6f1…9036acd2**; `logo-compact.png` **424a28bf…a8176125** — khớp baseline; browser fetch + SHA-256 cũng khớp | `sha256sum`, `preview-smoke.json` |
| Protected scope | `startLightsTiming.ts` `DEFAULT_INTRO_SPEED='3x'` unchanged; countdown component/RollingDigits/data/results-engine/ITM/API/store không sửa trong vòng này; Model B untracked pre-existing không sửa | mtime + `git status` theo path |

**6. Ảnh evidence:** **37 PNG** trong `scratch/ignition/p3-closeout/shots/` — 21 countdown (EN/VI × 375/390 × normal/200%/400%, reduced-motion, cặp legacy/fixed 200%) + 16 Latest GP (cold/warm/error/timeout/200%, EN/VI). File `diag-countdown-viewport-zoom200.png` bị trống và **không** dùng làm evidence. Screenshot element vẫn có fixed navbar xuất hiện giữa crop ở ảnh countdown dài — artifact capture đã ghi nhận từ trước, không phải regression; số đo trong JSON là nguồn authoritative.

**7. Quan sát / residual risks:**
- **P4 pre-existing (không block):** mỗi trang phát 1 console warning CSP `font-src` cho một data-URI woff2. Nguyên nhân: Vite inline subset Manrope cyrillic-ext < 4 KB; CSP hiện không cho `data:` font. Cùng message có trong log P1 (`preview.json`, `requal.../closeout-smoke.json`) và P2 (`preview-smoke*.json`) nên **không do closeout**; EN/VI dùng file subset latin/vietnamese và không bị ảnh hưởng. Không sửa CSP/build config trong vòng này vì ngoài phạm vi được duyệt.
- **400%:** digits đạt, page còn tràn do typography/schedule ngoài digits (mục 2); ngoài cam kết 200%.
- 12 moderate npm là dev-tooling pre-existing; 15 lint warning pre-existing; fixed-navbar trong element screenshot là artifact capture.
- Cold 12 s được mô phỏng bằng route delay; **không** phải đo server-side origin thật.

**8. NOT RUN (không claim PASS):** cold origin server-side thật 12 s, Lighthouse/CWV field, real-GPU FPS/frame-time, physical-device, Safari/Firefox, axe/screen-reader thủ công, CI/GitHub Actions, hai automated data workflow, preview/production deployment và production smoke, production indexing/canonical.

**9. Rollback:** inverse patch đúng các hunk closeout — 2 declaration grid/label + 1 rule màu trạng thái trong `homepageH1.css`; derived flags + verified block trong `FeaturedRace.tsx`; xóa 3 test mới. Không dùng `git checkout/reset` toàn file vì working tree còn thay đổi P1–P3 đã duyệt; không có migration/dữ liệu/asset cần rollback.

**10. Owner review package:** `scratch/ignition/p3-closeout/shots/` (37 PNG), `logs/closeout-browser-qa.{json,log}`, `logs/preview-smoke.{json,log}`, `logs/countdown-before-after.{json,log}`, `logs/countdown-overflow-after2.log`, `logs/timeout-vi.{json,log}`, `logs/tests.log`, `logs/lint.log`, `logs/typecheck.log`, `logs/build.log`, `logs/security-*.log`, `logs/api-smoke.json`.

**Owner decision 31/10/2026:** **`APPROVED P3`** trong phạm vi Homepage Cinematic Redesign. Hai tồn đọng (400% overflow ngoài countdown và CSP font subset) được owner ghi nhận và **không được đánh dấu PASS**; cleanup và Gate 3 được xử lý tại §13.24.

### 13.24 P3 CLOSEOUT — CLEANUP VERIFIED & GATE 3 GO (31/10/2026)

**Status:** `P3 APPROVED / CLEANUP_VERIFIED / GATE 3 GO / P4 OPEN`. Owner đã xác nhận **`APPROVED P3`** ngày 31/10/2026 trên cơ sở revision 1.4.0, đồng thời yêu cầu giữ hai vấn đề tồn đọng ở trạng thái **OPEN — không PASS**. Cleanup chỉ giới hạn ở artifact scratch đã ignore; không xóa source, logo chính thức, `source-assets/` (Model B/ITM), tài liệu owner, baseline rollback hoặc evidence đã dẫn trong plan. Không commit/push/merge/deploy.

**1. Bảo vệ working tree trước cleanup:** branch `migration/clean-architecture`, HEAD `d4838ad5be4c809dc020c52fe84ae47edcdb67c3`. Snapshot `git status --porcelain -uall` = **23 modified + 23 untracked**; hash 9 file bảo vệ (source closeout, `startLightsTiming.ts`, `detailedResults2026.ts`, `logo.png`, `logo-compact.png`) đều khớp trước và sau cleanup. Không dùng `git checkout/reset/clean/stash`, không revert bất kỳ thay đổi P1–P3 nào.

**2. CLEANUP_MANIFEST:** `scratch/ignition/p3-closeout/CLEANUP_MANIFEST.md`; backup ngoài source tree `E:\Formula 1\archives\ignition-p3-cleanup-2026-10-31\`.

| Hạng mục | Giá trị |
|---|---|
| Đã xóa | **138 file / 57.955.303 B** |
| Thành phần | 7 raw `page@*.webm`; 18 extracted `frame-*.png`; 14 script diag/extract một lần; 1 PNG diagnostic trống; 1 log trùng `countdown-overflow-after1`; 1 log dev P2 lẻ; 7 HTML contact-sheet tạm; 44 ảnh dev-stage; 14 ảnh diagnostic (diag/crop/mobile-slice); 30 mobile segment; 1 ảnh hover trùng; 2 directory rỗng |
| Integrity | `files.tsv` + `SHA256SUMS.txt`; nguồn và backup **138/138 OK** trước khi xóa |
| Giữ nguyên | source P1–P3, 4 video có tên, `before/after`, `p3v-*`, contact sheet PNG, `P3_AUDIT.md`, `P3_MOTION_MAP.md`, toàn bộ log gate hiện tại (gồm log đo 400% overflow), 37 PNG closeout, official logo 7 asset, `source-assets/` Model B/ITM, owner docs, baseline P0–P2, `dist` cho preview, `apps/web/NUL/` pre-existing |
| CSS audit | 15/15 CSS file đều được import; **không có stylesheet mồ côi**; không xóa CSS/token/selector nào; class `is-syncing`/`is-stale` có phát và có style |
| Phương thức | `cp -a --parents` → SHA-256 verify hai phía → xóa từng path; không `git clean`/`reset --hard`/force push |

**3. Re-QA sau cleanup — log tại `scratch/ignition/p3-closeout/cleanup/requal-2026-10-31/` (mỗi gate có `.log` + `.exit`):**

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| `git status` scope | **PASS** — pre/post snapshot giống hệt (23 modified + 23 untracked) | `pre-/post-cleanup-git-status.txt` |
| Protected hashes | **PASS** — 9/9 OK | `protected-source-sha256.txt` |
| `git diff --check` | **PASS** exit 0; 3 CRLF warning pre-existing | terminal |
| ESLint | **PASS** exit 0 — 0 error, 15 warning pre-existing | `lint.{log,exit}` |
| TypeScript | **PASS** exit 0 — 4/4 workspace | `typecheck.{log,exit}` |
| Tests | **PASS** — **398/398**: web 380 (66 file) + API 16 + security 2, 0 fail | `tests.{log,exit}` |
| Build | **PASS** exit 0 — Vite **9,63 s**; SEO 72 route; commercial isolation PASS; Cloudflare PASS; bundle hash **giống hệt** trước cleanup | `build.{log,exit}` |
| Security | **PASS** — secrets PASS, public boundary PASS, `npm audit --audit-level=high` exit 0; 12 moderate dev-tooling pre-existing, 0 high/critical | `secrets.*`, `assets.*`, `audit.*` |
| Browser smoke (production preview `127.0.0.1:4173`) | **PASS** — **38/38** functional check (EN/VI 390 + EN 1440): verified R18, 8 rows, 0 overflow, logo SHA lock, 0 pageerror, 0 unexpected console, 0 failed request | `preview-smoke.json`, `preview-smoke-post-cleanup.{log,exit}` |

**4. Tồn đọng — tuyệt đối không đánh dấu PASS:**
- **D-P1-02 CSP font subset:** mỗi trang vẫn phát 1 warning `font-src` cho data-URI woff2 (Manrope cyrillic-ext do Vite inline < 4 KB); pre-existing từ P1/P2, EN/VI không bị ảnh hưởng. Ghi trong `preview-smoke.json.openIssues` là `OPEN — not PASS` và **không** tính vào 38 check PASS.
- **400% text zoom ngoài countdown:** page overflow 311/265/296/250 px (EN375/VI375/EN390/VI390) do identity H2/link/status/schedule; digits countdown đủ và overflow 0. Vẫn **OPEN**, không sửa trong cleanup.
- 12 moderate npm (dev-tooling) và 15 lint warning là pre-existing.

**5. Kết luận:** mọi gate bắt buộc sau cleanup **PASS** → **`P3 CLEANUP_VERIFIED`**, **Gate 3 GO**, **Phase 4 được mở**. Không có P0/P1/P2 mới. CI/GitHub Actions, hai automated data workflow, preview/production deployment, production smoke, Lighthouse/CWV field, real-GPU FPS, physical-device, Safari/Firefox và axe/screen-reader vẫn **NOT RUN**.

**6. Phase 4:** bắt đầu từ mockup `02_Race_Center.png` và `07_Calendar_Circuits.png`; tái cấu trúc Race Center (sticky round/session controls, chỉ session có dữ liệu xác minh, bảng kết quả có màu đội nhưng không dùng màu làm tín hiệu duy nhất), Calendar completed/upcoming với dữ liệu chính xác; **không tạo route `/circuits`/Circuit Explorer** khi chưa có phê duyệt riêng. Dừng tại **P4 OWNER REVIEW**; không cleanup P4, không commit/push/merge/deploy.

### 13.25 P4 EXECUTION — RACE CENTER & CALENDAR QA READY (31/10/2026)

**Status:** `P4 QA_READY / OWNER REVIEW / P4 OPEN`. Owner đã **`APPROVED P3`** và mở P4 theo mockup `02_Race_Center.png` + `07_Calendar_Circuits.png`; phase này chỉ triển khai Race Center và Calendar, **không tạo route `/circuits` / Circuit Explorer**, không đổi API/dữ liệu/Model B/ITM. Không cleanup P4, không commit/push/merge/deploy. P4 **chưa được duyệt**.

**1. Baseline & phạm vi thay đổi**

- Branch `migration/clean-architecture`, HEAD `d4838ad5be4c809dc020c52fe84ae47edcdb67c3`; working tree cuối P4 = **28 modified + 7 untracked entry** (35 dòng `git status --porcelain`), toàn bộ thay đổi P1–P3 được giữ nguyên.
- File P4: `apps/web/src/components/championship/ChampionshipCalendar.tsx`, `WeekendResults.tsx`, `championshipC1.css`, `championshipC11.css`, `championshipC1.test.tsx`, `championshipC11.test.tsx`. Không đổi `package.json`/lockfile, route, `apps/api`, dữ liệu 2026, `source-assets/`, Model B/ITM.
- Logo chính thức giữ nguyên SHA-256: `logo.png` `226ab6f1…03a9036acd2`, `logo-compact.png` `424a28bf…a8176125` — khớp BRAND IDENTITY LOCK.

**2. Triển khai**

**Race Center** (`WeekendResults.tsx` + `championshipC11.css`):

- `.rc-hero` thống nhất tiêu đề/mô tả với 3 số liệu thật (23 rounds / 18 verified rounds / 86 verified sessions) và legend 4 trạng thái Results/Awaiting/Current/Upcoming.
- Round rail **23 chip** đúng dữ liệu mùa, có `aria-current` cho round đang chọn; `.rc-pinned-controls` gồm rail + session tabs, sticky dưới `.f4-controls`, offset `--c11-pinned-top` cập nhật bằng `ResizeObserver`.
- `.rc-round-hero` hiển thị round/state/circuit + 62 laps / 4.940 km / 306.143 km / lap record; badge `SPRINT WEEKEND`; trạng thái “Results · 5 sessions with verified classification”.
- Giữ đúng **FP1 / Qualifying / Sprint Qualifying / Sprint / Race** theo dữ liệu đã xác minh; trạng thái từng session tính bằng `getSessionTimeRange` (`Scheduled`/`Awaiting`/`Results`), round chưa xác minh có giải thích, không hiển thị nhầm “0” hay bịa session.
- Bảng R17 22 hàng: nền theo đội qua `data-team` **kèm tên đội dạng text** trong từng hàng và note “Team tint is supplementary…”; source/updated/FINAL; bảng và rail là scroll container riêng, sticky không che bảng.
- Keyboard: session tabs ArrowLeft/Right/Home/End; top tabs arrow; focus visible; `prefers-reduced-motion` tắt smooth scroll/transition.

**Calendar** (`ChampionshipCalendar.tsx` + `championshipC1.css`):

- Filter **All / Completed / Upcoming** với số thật **23 / 18 / 5** (5 = 4 upcoming + round hiện tại R19), đồng bộ `?view=`, `aria-pressed`, Enter/Space, giữ query/hash, reload vẫn đúng; filter All xóa `view`.
- Trạng thái lịch đúng: **18 completed + 1 current (R19 Mexico, 30/10–01/11) + 4 upcoming**; next race = `current ?? upcoming`; card Next Race + countdown `role="timer"` (“Lights out in” / “Đếm ngược tới giờ xuất phát”); CTA mở `/season/2026?tab=results&round=19`.
- Mùa 2025 hiển thị **24/24 completed** + panel Season Complete + final round; timezone theo browser; VI/EN đầy đủ.
- Responsive: 2 cột ≥1101, 1 cột ≤1100; 390 không overflow; hero stats `auto-fit`; container query `.cal-main` xử lý round identity khi cột hẹp do text zoom.
- Không render map/Circuit Explorer; truy cập `/circuits` chỉ trả app shell (status 200, `hasExplorer:false`), không thêm route.

**3. Static quality gates (chạy lại trên source cuối, log trong `scratch/ignition/p4/logs/gates/`)**

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| ESLint | **PASS** exit 0 — 0 error, 15 warning pre-existing (scratch/tools) | `lint.log`, `lint.exit` |
| TypeScript | **PASS** exit 0 — 4/4 workspace | `typecheck.log`, `typecheck.exit` |
| Tests | **PASS** exit 0 — **400/400**: web 382 (66 file) + API 16 (3 file) + security 2 (1 file); gồm 2 test P4 mới cho cấu trúc Race Center và filter/next-race Calendar | `tests.log`, `tests.exit` |
| Build | **PASS** exit 0 — Vite **8,46 s**; SEO 72 route; commercial isolation PASS; Cloudflare PASS; entry `assets/index-BGjOoXJd.js` 628,89 kB (gzip 90,91 kB) | `build.log`, `build.exit` |
| Security | **PASS** — secret scan PASS; public asset boundary PASS | `secrets.*`, `assets.*` |
| Production preview | **PASS** — `127.0.0.1:4173` HTTP 200; HTML trỏ đúng `assets/index-BGjOoXJd.js`; JS trả `text/javascript`, `x-content-type-options: nosniff` | `scratch/ignition/p4-preview.log` |

**4. Browser QA — production preview, 46/46 PASS** (`scratch/ignition/p4/qa-p4.cjs`, `logs/qa-p4-final.log`, `logs/qa-p4.json`)

| Nhóm | Kết quả đo |
|---|---|
| Dữ liệu Calendar | 23 rounds; completed 18 / upcoming 4 / current 1; next R19 `current`; countdown render; 2025 24/24 + Season Complete |
| Filter & URL | Completed 18, Upcoming 5, All 23; `?view=completed`; `aria-pressed` đúng; Space/Enter; reload giữ filter; CTA → `?tab=results&round=19` |
| Race Center dữ liệu | 22 hàng R17; team texts Red Bull/Ferrari/Mercedes + tint; note hiển thị; source/updated/FINAL; không bịa session |
| Sticky & layout | 1440/1024/768/390: gap f4-bottom → pinned-top = **0/0/1/0 px** (`logs/sticky-probe-final.log`, ảnh `p4-sticky-*-final.png`); 768 driver cell **120 px / inner 88 px**, bảng scroll **702/853** với 10 cột đọc được; 390 tab Calendar 142,7 px nằm trong list 29–353 |
| Keyboard & motion | session tabs Arrow/Home/End đúng; top tabs arrow chuyển tab; focus ring filter 2 px `rgb(255,179,71)`; reduced motion `scroll-behavior:auto`, chip transition `0s` |
| VI/EN | Heading/filter/next card/countdown/session tabs/team note localized; proper nouns và dữ liệu giữ nguyên |
| An toàn | 0 pageerror; 0 console error (CSP warning pre-existing bị loại khỏi check, vẫn **OPEN**); 0 request failure; không có link/route Circuit Explorer |
| Quan sát hydration | Lần đầu có thể thấy 3 hàng `data-team="unknown"` trước khi dữ liệu ổn định; sau settle **22/22 hàng** đúng, tái hiện trong <300 ms — ghi nhận, không che |

**5. Text zoom 200% / 400%**

| Bề mặt | 200% | 400% |
|---|---|---|
| Calendar 1440 | **PASS** page 0; hero/next/countdown/filters/round/layout đều 0 | page 0 nhưng hero **487**, filters **456**, round **399**, layout **322** — **OPEN, không PASS** |
| Calendar 390 | **PASS** page 0; tất cả P4 surface 0 | page **287**; hero 326, next 195, filters 374, round 190 — **OPEN, không PASS** |
| Race Center 1440 | **PASS** page 0; hero/pinned/rail/tabs/roundHero 0; tableWrap 522 trong `overflow-x:auto` | page **132**; hero 389, tabs 1261, table 2479, roundHero 142 — **OPEN, không PASS** |
| Race Center 390 | **PASS** page 0; hero/pinned/rail/roundHero 0; tabs 247 trong `overflow-x:auto` | page **139**; hero 220, tabs 882, table 373, roundHero 204 — **OPEN, không PASS** |
| Countdown (mọi bề mặt) | **PASS** container 0 | **PASS** container 0 (digits không tràn) — không suy ra toàn trang PASS |

- **Quan sát pre-existing:** dải `.f4-controls` dùng chung (không thuộc P4) ở 200% có hai biểu hiện: (a) nhãn tab nằm trong tablist cuộn ngang `overflow-x:auto` — đo 1440: client 644 / scroll 1811 px, 390: client 260 / scroll 1715 px nên vẫn cuộn tới được; (b) nhóm chọn năm tại 390/200% bị Card `overflow-hidden` cắt (“202…”) và **không cuộn được** — thuộc nhóm **D-P2-01 text-only zoom pre-existing**, ngoài scope P4. Ảnh: `p4-calendar-390-zoom200.png`, `p4-results-390-zoom200.png`, `p4-results-1440-zoom200.png`, `p4-rc-390-zoom200-controls.png`; probe `logs/f4-zoom-probe.log`. **OPEN**, không sửa trong P4 để tránh scope creep; cần owner quyết định.

**6. Defects P4**

| ID | Severity | Mô tả | Root cause | Xử lý & retest |
|---|---|---|---|---|
| D-P4-01 | P2 | 768 driver column co còn 44 px, tên gãy giữa từ (“Hamilt o n”) | Thiếu `min-width` cho `.c11-driver` khi bảng nén | **FIXED** — `min-width: 7.5rem`; cell 120/inner 88; ảnh `p4-results-768-table.png`; QA PASS |
| D-P4-02 | P3 | 390/400% countdown rộng 106 px do padding/rem units bị nén | Padding rem + grid units cố định | **FIXED** — padding `min(1.1rem,4vw)`, units `min(100%,4.2em)` auto-fit, wrap; countdown 0 ở 1440/390 |
| D-P4-03 | P2 | 390/200% calendar header + round toggle tràn 125/27 px | Action/timezone intrinsic width; grid rem cố định | **FIXED** — width/min-width + cột `min(…,vw)`; đo lại 0 |
| D-P4-04 | P2 | 1440/200% round identity 0 px và session list tràn | Cột calendar bị ép hẹp dưới text zoom | **FIXED** — container query `.cal-main` + `.c1-session-list` auto-fit; chuỗi overflow rỗng, đo lại 0 |

Không có P0/P1 mới. Hai điều chỉnh harness (số upcoming thực tế 5 gồm current; ArrowLeft từ Results sang Calendar) là sửa kỳ vọng test, không phải lỗi sản phẩm.

**7. Tồn đọng & chưa xác minh**

- **D-P1-02 CSP font subset:** vẫn 1 warning `font-src` data-URI woff2 mỗi trang; pre-existing, EN/VI không ảnh hưởng — **OPEN, không PASS**.
- **400% text zoom ngoài countdown:** số đo bảng §5 — **OPEN, không PASS**, không sửa trong P4.
- **Shared `.f4-controls` tại 200% (D-P2-01 text-only family):** tablist cuộn được, nhưng nhóm năm 2024/2025/2026 tại 390/200% bị `overflow-hidden` cắt và không cuộn được — **OPEN**, cần owner quyết định (không sửa ngoài scope P4).
- 15 lint warning + 12 moderate npm dev-tooling là pre-existing; `npm audit` **không chạy lại** trong lượt P4 cuối (P3 closeout: 0 high/critical).
- **NOT RUN trong P4:** Lighthouse/Core Web Vitals, axe/screen-reader, Safari/Firefox, thiết bị thật/GPU thật, CI GitHub Actions, hai automated data workflow, preview deployment ngoài local, production deployment/smoke.

**8. Evidence**

- QA harness + kết quả: `scratch/ignition/p4/qa-p4.cjs`, `logs/qa-p4-final.log`, `logs/qa-p4.json` (46/46 PASS, 0 FAIL).
- Gate logs: `scratch/ignition/p4/logs/gates/`; sticky probe: `logs/sticky-probe-final.log`.
- Ảnh: **30 PNG** `scratch/ignition/p4/shots/p4-*.png` — calendar/results EN 1440 & 390, VI 1440, 768 table, sticky 1440/1024/768/390, filter completed, 2025 complete, zoom 200/400, round/controls/table states.
- Diagnostic 1024: `logs/diag3.log` + `shots/diag-*-1024-en.png` (page overflow 0, 23 rounds, 22 hàng).
- Preview: `scratch/ignition/p4-preview.log`; build hash và content-type đã xác minh lại sau build cuối.

**9. Kết luận**

P4 đạt **QA_READY**: static gates PASS, 46/46 browser check PASS trên production preview, các defect P2/P3 trong scope đã fix và retest. Tuy nhiên **chưa thể GO**: còn **D-P1-02 CSP** và **400% overflow ngoài countdown** ở trạng thái OPEN theo yêu cầu owner, cùng quan sát F4 controls pre-existing; owner chưa duyệt P4. Quyết định: **HOLD — P4 OWNER REVIEW**. Dừng tại đây; **không cleanup P4, không commit/push/merge/deploy**.

### 13.26 P4 VISUAL + FUNCTIONAL OWNER REVIEW — GATE 4 (01/11/2026)

**Status:** `P4 QA_READY / VISUAL + FUNCTIONAL OWNER REVIEW / GATE 4 PENDING`. Owner yêu cầu nâng P4 tiệm cận mockup `02_Race_Center.png` + `07_Calendar_Circuits.png`, đóng các lỗi 200%/400% còn mở và áp **bốn gate** theo §3.2. Đã thực hiện trong phạm vi P4: **không đổi route, API, dữ liệu 2026, Results Engine, Model B/ITM**; **không tạo `/circuits`**; **không cleanup, commit, push, merge, deploy**; **chưa mở P5**. Các kết luận `OPEN` về 400% và F4 controls tại §13.25 được **thay thế** bởi section này (§13.25 giữ nguyên như bản ghi lịch sử).

**1. Baseline & phạm vi thay đổi**

- Branch `migration/clean-architecture`; working tree cuối = **29 modified + 8 untracked entry** (37 dòng `git status --porcelain`), giữ nguyên toàn bộ thay đổi P1–P4 trước đó.
- Trong lượt Gate 4 chỉ sửa thêm **một** file source dùng chung: `apps/web/src/components/ui/Tabs.tsx` (hành vi reveal tab, không redesign) + probe/evidence trong `scratch/` (ignored). Không đổi `package.json`/lockfile, `apps/api`, `source-assets/`, ảnh/asset công khai.
- Logo chính thức giữ nguyên SHA-256: `logo.png` `226ab6f1…03a9036acd2`, `logo-compact.png` `424a28bf…a8176125` — khớp BRAND IDENTITY LOCK §3.1.

**2. Art direction đã áp dụng (IGNITION / AERO-RACING EDITORIAL)**

| Lớp | P4 thể hiện |
|---|---|
| Palette | Carbon `#0a0c10` / `#0b111a` / `#0d131c`; ignition/racing gradient `#ff4a18` → `#ff6a00` → `#ff2a2a` → `#e51b37`; amber `#ffc46b` / `#f1d3ab` cho số liệu và accent; ivory `#f4f0e8`; muted `#7f8b99` / `#cbd0d6`. Đỏ/cam chỉ dùng cho hierarchy, không phủ toàn màn hình |
| Typography | Display condensed cho hero (Race Center / Calendar), mono cho index `00/01` và telemetry (laps, km, lap record), UI sans cho nhãn/điều khiển; VI/EN dùng cùng scale |
| Composition | Hero editorial 2 cột (copy + visual index/schematic) → stats → filter/rail → nội dung; Calendar bất đối xứng 2 cột ≥1101 px, 1 cột ≤1100 px |
| Hierarchy | Race Center: Hero → Round rail → Session tabs → Round identity → Classification. Calendar: Hero → Season nav → Next Grand Prix → Filter → 23 cards |
| Data surface | Bảng là DOM thật, team tint **kèm tên đội dạng chữ**, số liệu tabular; không dùng ảnh tĩnh thay bảng |
| Mobile | 390 thiết kế riêng: hero stack, stats `auto-fit`, filter wrap, card stack, bảng và rail cuộn ngang có affordance; không co tỷ lệ desktop |

**3. Asset plan & provenance**

- **Không thêm raster asset nào** trong P4 (`git status` không có `.png/.jpg/.webp/.avif/.svg` mới; hai component không có `<img>`/`url()`).
- Hình đường đua là `CircuitTrace` — SVG nội bộ dựng từ `apps/web/src/data/championship/circuitsData.ts`, render path + kerb + marker bằng CSS/SVG; **có caption “Circuit schematic · illustrative” / “Repository circuit schematic · illustrative, not an official FIA map.”** ngay trên UI.
- **Không** tải ảnh tay đua, logo đội, sponsor hoặc track map ngoài repo; **không** dùng ảnh mockup làm asset production; **không** dùng mockup làm bằng chứng runtime.
- **Gap provenance cần owner quyết định:** header comment của `circuitsData.ts` tự mô tả là “Authentic Formula 1 Circuit Maps”, nhưng repo không ghi nguồn/giấy phép cho các path này. UI đang ghi “illustrative” để trung thực; cần owner/legal xác nhận trước khi nâng thành “official” ở phase sau.

**4. Implementation evidence**

**4.1 F4 tab + season switcher tại 200%/400% (đóng lỗi còn mở)**

- Root cause: rail cuộn ngang chỉ reveal tab đang chọn khi mount/đổi value/font-ready; text-only zoom làm layout đổi nhưng border box của rail không đổi kích thước → selected tab nằm ngoài viewport, và native focus scroll đè lên reveal sau keyboard Home/End.
- Fix trong `Tabs.tsx` (hành vi, không đổi visual): signature `value:clientWidth:scrollWidth:selectedWidth` + `ResizeObserver` trên rail, trên selected tab và `documentElement`; reveal bằng `scrollTo` (instant khi mount/layout/zoom, `auto` khi đổi tab để tôn trọng reduced motion); keyboard dùng `focus({ preventScroll: true })` + double-rAF reveal; `data-scroll-start/end` cập nhật theo scroll.
- Đo lại **96/96 PASS** (`probe-tabs-zoom.cjs`): 390/1440 × EN/VI × 200%/400%; selected tab coverage **100%**, years 2026/2025/2024 **all visible**, rail `overflow-x:auto`, keyboard End/Home/ArrowRight/ArrowLeft giữ đúng focus và reveal. Không còn nhóm năm bị `overflow-hidden` cắt.

**4.2 Race Center (mockup 02)**

- `.rc-hero` thống nhất tiêu đề/mô tả + 3 số liệu thật (23 rounds / 18 verified rounds / 86 verified sessions) + legend 4 trạng thái; visual cột phải dùng `CircuitTrace` có index round và caption illustrative.
- Round rail **23 chip** đúng dữ liệu mùa, `aria-current` cho round đang chọn; `.rc-pinned-controls` (rail + session tabs) sticky dưới `.f4-controls`, offset `--c11-pinned-top` cập nhật bằng `ResizeObserver`; gap f4-bottom → pinned-top đo được **0/0/1/0 px** tại 1440/1024/768/390.
- `.rc-round-hero` hiển thị round/state/circuit + 62 laps / 4.940 km / 306.143 km / lap record; badge `SPRINT WEEKEND`; trạng thái session tính bằng `getSessionTimeRange` (`Scheduled`/`Awaiting`/`Results`), round chưa xác minh có giải thích, không hiển thị “0” giả và không bịa session.
- Bảng R17 22 hàng: nền theo đội qua `data-team` **kèm tên đội dạng text** + note “Team tint is supplementary…”; source/updated/FINAL; bảng và rail là scroll container riêng, sticky không che bảng; hover/focus row có trạng thái đọc được.

**4.3 Calendar (mockup 07)**

- Filter **All / Completed / Upcoming** với số thật **23 / 18 / 5** (5 = 4 upcoming + round hiện tại R19), đồng bộ `?view=`, `aria-pressed`, Enter/Space, giữ query/hash, reload đúng; filter All xóa `view`.
- Trạng thái đúng: **18 completed + 1 current (R19 Mexico, 30/10–01/11) + 4 upcoming**; next race = `current ?? upcoming`; card Next Grand Prix + countdown `role="timer"` (“Lights out in” / “Đếm ngược tới giờ xuất phát”), refresh 30 s (không animation mỗi giây); CTA mở `/season/2026?tab=results&round=19`.
- Mùa 2025 hiển thị **24/24 completed** + panel Season Complete; timezone theo browser; VI/EN đầy đủ; hero có season nav và schematic illustrative.

**4.4 400% và sticky**

- P4 surfaces tại 400%: hero, next card, filters, round identity, layout, pinned controls, rail track, round hero đều **0 px** overflow; bảng và session tabs vượt khung là **scroll container có chủ đích** (`overflow-x:auto`), không dùng `overflow:hidden` để che.
- Sticky tại 400% đã chuyển `position: static` (`championshipC11.css`), nên pinned stack không phủ bảng; đo lại không có overlap.

**4.5 Results data regression**

- `resultsDataRegression.test.tsx` + `resultSelection.test.ts`: no-round → latest verified; deep link round; Sprint trên sprint weekend; non-Sprint weekend; future round không có kết quả; summary rows không bị coi là final; đổi session/round đồng bộ URL; Back/Forward; không hardcode R18/R19.
- E2E `e2e-results-history.cjs`: **8/8 PASS** (no-round → R18, chip → R19, session param, Back/Back/Forward, future round empty state, 0 pageerror).

**5. Bốn gate theo §3.2**

| Gate | Kết quả | Bằng chứng | Ghi chú |
|---|---|---|---|
| **G-1 Layout/UX** | **PASS** (P4 surfaces) | 46/46 browser QA; 96/96 tab zoom; `probe-gate4.json` offenders `[]`; 86 ảnh after + state gallery 20 states | Không overflow/clip ngoài chủ đích; sticky 0/0/1/0 px; keyboard/focus PASS |
| **G-2 Visual/Imagery** | **PARTIAL** | Palette/typography/contrast PASS; asset inventory 0 raster mới; caption illustrative | Chưa có ảnh/map có license như mockup 02/07; `circuitsData.ts` provenance chưa xác minh |
| **G-3 Motion/Performance** | **PARTIAL** | Motion map §6; reduced motion PASS; build 10,72 s, entry 628,90 kB (gzip 90,91 kB) | Lighthouse/Core Web Vitals, FPS thiết bị thật **NOT RUN** |
| **G-4 Engineering QA** | **PASS** | lint 0 error/15 warning; typecheck 0; **417 tests** PASS; build PASS; secret/asset PASS; 46/46 + 96/96 + 8/8 browser | CSP D-P1-02 và global 400% vẫn OPEN ngoài P4 |

Vì G-2 và G-3 là **PARTIAL**, P4 **không thể được đề xuất APPROVED** theo §3.2 dù G-1/G-4 PASS.

**6. Motion map P4**

| Thành phần | Trigger | Chuyển động | Reduced motion |
|---|---|---|---|
| Selected tab (session + top tabs) | mount / zoom / đổi tab | `scrollTo` instant (layout) hoặc `auto` (đổi tab), rail `scroll-behavior:smooth` | `scroll-behavior:auto`, transition `0s` |
| Rail edge fade | scroll | opacity 140 ms | tắt transition |
| Round chip | hover/focus/active | transform + background ~140–180 ms | `transform:none`, transition `none` |
| Table row | hover/focus | background 160 ms | transition `none` |
| Calendar card / filter | hover/press | background 160 ms; filter focus ring 2 px amber | transition `none` |
| Round/session panel | đổi round/session | `c11-enter` 200–350 ms (opacity + 4 px translate) | animation tắt |
| Countdown | timer 30 s | không animation; `role="timer"` | giữ nguyên |
| Hero schematic | tĩnh | không animation, không parallax | giữ nguyên |

Không có animation vô hạn trên màn hình P4. Selector `.c11-skeleton` còn `c11-pulse infinite` nhưng **không được render** ở bất kỳ TSX nào — ghi nhận là dead CSS, không phải animation runtime.

**7. Visual gaps so với mockup 02/07 (không tô hồng)**

1. **Không có ảnh thật** (tay đua, xe, khán đài, bầu trời) như mockup; P4 dùng nền carbon/gradient + schematic SVG. Đây là khác biệt lớn nhất về “cảm giác mockup”.
2. **Track map không phải bản đồ chính thức**: chỉ là path minh họa nội bộ, có caption; mockup 07 dùng outline chi tiết hơn.
3. **Không có Circuit Explorer** như màn hình phụ trong mockup 07 — đúng chỉ đạo owner (`/circuits` không được thêm).
4. Bảng classification giữ mật độ dữ liệu cao (10 cột) thay vì card thoáng như mockup; ưu tiên khả năng đọc dữ liệu thật.
5. Tại **400%**, tab rail hiển thị “center slice” của tab đang chọn (tab rộng 528 px trong rail 132 px) — không phải overflow, nhưng nhãn bị cắt hai bên là giới hạn của rail cuộn ngang ở 4× text.
6. Ở **390/EN/400%** toàn trang còn **63 px** overflow do **header/footer toàn cục** (xem OPEN-GLOBAL-01), không thuộc P4.

**8. Defects & tồn đọng**

| ID | Severity | Mô tả | Root cause | Trạng thái |
|---|---|---|---|---|
| D-P4-05 | P2 | Selected tab không được đưa vào viewport khi text-only zoom; nhóm năm 2026/2025/2024 bị cắt | Reveal chỉ chạy khi mount/value; rail border box không đổi khi zoom | **FIXED** — `Tabs.tsx`; 96/96 PASS |
| D-P4-06 | P3 | Keyboard Home/End để lại tab đang chọn ngoài viewport | Native focus scroll chạy sau effect reveal | **FIXED** — `focus({preventScroll:true})` + double-rAF; 96/96 PASS |
| D-P4-07 | P3 | Probe báo FAIL giả khi đo giữa animation cuộn | `scroll-behavior:smooth` 480–500 ms | **FIXED (harness)** — reveal instant khi layout + chờ 900 ms |
| D-P4-08 | P2 | 400% trước đây tràn ở hero/filters/round/table P4 | Thiếu ràng buộc px/container query | **CLOSED** — P4 surfaces 0 px; scroll container cho bảng/tabs |
| D-P4-09 | P3 | 200% nhóm năm bị `overflow-hidden` cắt, không cuộn được | `.f4-controls` flex + width intrinsic | **CLOSED cho P4 surfaces** — wrap + rail reveal |
| **OPEN-GLOBAL-01** | P2 (ngoài P4) | 390/EN/400%: `footer logo.png` rộng 373 px (right 453) → **63 px** doc overflow; header brand 348 px (right 428), right group 476–790, toggle 176 px | Global shell/footer không có ràng buộc 400% | **OPEN — không sửa trong P4** |
| **D-P1-02** | P2 | CSP `font-src` data-URI woff2 warning mỗi trang | Pre-existing | **OPEN — không PASS** |
| — | P3 | `.c11-skeleton` giữ `c11-pulse infinite` nhưng không render | Dead CSS | **Documented** — không phải animation runtime |
| — | — | `circuitsData.ts` tự nhận “Authentic” nhưng không có nguồn/license | Provenance | **OPEN — cần owner/legal** |

**9. Evidence (final build)**

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| ESLint | **PASS** exit 0 — 0 error, 15 warning pre-existing | `logs/gates/lint.log`, `.exit` |
| TypeScript | **PASS** exit 0 — 4/4 workspace | `logs/gates/typecheck.log`, `.exit` |
| Tests | **PASS** exit 0 — **417**: web **399** (68 file) + API **16** (3) + security **2** (1) | `logs/gates/tests.log`, `.exit` |
| Build | **PASS** exit 0 — **10,72 s**; entry `assets/index-BGehobvu.js` **628,90 kB** (gzip **90,91 kB**) | `logs/gates/build.log`, `.exit` |
| Security | **PASS** — secret scan PASS; public asset boundary PASS | `logs/gates/secrets.*`, `assets.*` |
| Production preview | **PASS** — `127.0.0.1:4173` HTTP 200, HTML trỏ `index-BGehobvu.js` | `scratch/ignition/p4-preview.log` |
| Browser QA | **46/46 PASS**, 0 FAIL | `logs/qa-p4-final.log`, `logs/qa-p4.json` |
| Tab text zoom | **96/96 PASS** | `logs/probe-tabs-zoom.log`, `.json` |
| Layout/overflow probe | **PASS** — `offenders: []`, `rootScroll===rootClient`; bảng/tabs chỉ cuộn trong container | `logs/probe-gate4.log`, `.json` |
| Results history E2E | **8/8 PASS** | `logs/e2e-results-history.log`, `.json` |
| Zoom 1440 | Calendar 200%/400% page **0**; Race Center 200%/400% page **0** | `qa-p4-final.log` |
| Zoom 390 | Calendar/Race Center 200% page **0**; 400% page **63** (global only), P4 surfaces **0** | `qa-p4-final.log` |
| Visual evidence | **86 before + 86 after PNG** (375/390/768/1024/1440/1920 × VI/EN + states); **5 contact sheets**; state gallery **20 states** | `shots/visual-before/`, `shots/visual-after/`, `shots/contact/` |
| Global overflow diagnosis | 413 phần tử vượt viewport, doc 453 vs 390 | `logs/global-overflow-390-400.json`, `diag-global-overflow.cjs` |

**10. NOT RUN trong lượt Gate 4**

Lighthouse/Core Web Vitals; axe/screen-reader; Safari/Firefox; thiết bị thật/GPU thật; CI GitHub Actions; hai automated data workflow; preview/production deployment và smoke. `npm audit` không chạy lại.

**11. Kết luận**

P4 đạt **QA_READY** và đã đóng các lỗi 200%/400% trong phạm vi P4; G-1 và G-4 PASS. Tuy nhiên **G-2 PARTIAL** (thiếu ảnh/map có license, provenance chưa xác minh) và **G-3 PARTIAL** (chưa đo Web Vitals/FPS thiết bị thật), cùng **OPEN-GLOBAL-01**, **D-P1-02** và giới hạn rail 400%, nên **chưa thể đề xuất APPROVED**. Quyết định: **HOLD — P4 VISUAL + FUNCTIONAL OWNER REVIEW / GATE 4 PENDING**. Owner xem contact sheet + state gallery và quyết định: chấp nhận hướng “schematic minh họa” hay yêu cầu bổ sung asset có license trước khi duyệt. **Không cleanup, commit, push, merge, deploy; không mở P5.**

### 13.27 P4 CINEMATIC VISUAL ACCEPTANCE — OWNER REVIEW (01/11/2026)

**Status:** `P4 CINEMATIC VISUAL ACCEPTANCE — OWNER REVIEW / GATE 4 PENDING`. Owner trả `CHANGES REQUESTED`: bố cục, sticky controls, Results Engine và Calendar interaction được chấp nhận nhưng **chất lượng hình ảnh chưa đạt**, kèm chỉ đạo **không được chỉ thay CSS/gradient/neon SVG**. Vòng này thay lớp hình ảnh bằng **plate điện ảnh render từ chính EDS-G01**, hoàn thiện composition Race Center + Calendar, đóng tràn header/footer toàn cục tại 390/400% và bảo đảm tab dài đọc được trọn nhãn. Không đổi route, API, dữ liệu 2026, Results Engine, Model B/ITM; không thêm `/circuits`; không dùng ảnh đội/sponsor/venue/bản đồ FIA/mockup; không sửa logo chính thức; **không cleanup, commit, push, merge, deploy**; **chưa mở P5**. §13.26 giữ nguyên làm bản ghi lịch sử; các kết luận G-2/G-3 `PARTIAL` và OPEN-GLOBAL-01 ở §13.26 được thay bằng mục 5–7 dưới đây.

**1. Cinematic asset system — 36 file, 637.185 B**

| Plate | Variants (AVIF + WebP) | Bytes (both formats) | Vai trò |
|---|---|---|---|
| `hero-desktop` | 1600×900, 960×540, 640×360 | 70.156 | Artwork hero Race Center (desktop) |
| `hero-mobile` | 1080×1350, 720×900, 480×600 | 150.143 | Hero mobile Race Center + hero Calendar (composition dọc) |
| `poster-crimson` | 900×1125, 600×750, 420×525 | 92.938 | Poster feature chặng, palette 1 |
| `poster-amber` | 900×1125, 600×750, 420×525 | 114.070 | Poster feature chặng, palette 2 |
| `poster-emerald` | 900×1125, 600×750, 420×525 | 115.486 | Poster feature chặng, palette 3 |
| `poster-night` | 900×1125, 600×750, 420×525 | 94.392 | Poster feature chặng, palette 4 |

- **Nguồn:** render từ `apps/web/public/models/eds-g01.glb` (asset EDS-G01 gốc của project) bằng `scratch/ignition/p4/render/scene.html` (three.js WebGL, Chromium local) và xuất bằng `export.cjs` (sharp: brightness/saturation/contrast + vignette + grain; AVIF q52 effort 5, WebP q80 effort 5). Không dùng ảnh/3D/texture của bên thứ ba, không dùng mockup, không dùng Model B.
- **File lớn nhất:** `hero-mobile-1080.webp` **59.608 B**. Payload đo được tại viewport đã test: Race Center **16.555 B** (hero 960 AVIF 6.622 + poster 600 AVIF 9.933); Calendar **13.491 B** (hero 480 AVIF 7.212 + poster 420 AVIF 6.279).
- **Delivery:** `<picture>` AVIF/WebP `srcset` + `sizes`; mobile source swap ≤767 px; hero `loading="eager" fetchPriority="high"`, poster `loading="lazy"`; WebP là fallback. Mọi plate là `<img alt="">` trong container `aria-hidden`, kèm caption dữ liệu hiển thị (“Circuit schematic · illustrative” / “EDS-G01 · {palette} livery study”).
- **Trung thực dữ liệu:** palette chọn tất định `(round − 1) mod 4`, chỉ mang tính trang trí; artwork không mã hóa race/weather/tyre/lap fact nào. Không tạo chart/bảng dữ liệu giả.

**2. Composition**

- **Race Center:** hero dùng artwork làm chủ thể (xe + ánh sáng) thay vì nền gradient; copy/eyebrow/stats/legend giữ nguyên dữ liệu thật (23 rounds, 18 verified rounds, verified sessions). Round feature dùng poster theo palette + caption; schematic đường đua chuyển thành accent góc trên với caption illustrative. Bảng classification giữ 10 cột dữ liệu thật, 22 hàng tint theo đội **kèm tên đội dạng chữ**.
- **Calendar:** hero artwork có composition dọc riêng (`hero-mobile` dùng cho cả desktop theo thiết kế); Next Grand Prix là card editorial có poster theo chặng, tên chặng/round/ngày/countdown `role="timer"` và CTA mở Race Center R19. Filter All/Completed/Upcoming giữ 23/18/5 và state Completed/Current/Upcoming thống nhất.
- **Mobile:** crop riêng 50% 76% (scale 1.2) so với desktop 72% 58% (scale 1.55); caption đổi vị trí, không tái sử dụng crop desktop.
- **Fix hiển thị:** `.rc-hero-art img` thiếu `object-fit` gây bóp dọc ~30% tại 390 → thêm `object-fit: cover` + `object-position`; regression `cinematicArtContract.test.ts` 3/3 và 12/12 case đo `heroFit: "cover"`.

**3. Global accessibility 390 / 200% / 400%**

- `useTextZoomAttribute` phát hiện text-only zoom và gắn `data-text-zoom="200|400"` lên `<html>`; khi zoom ≥200% header chuyển sang flow thường, desktop nav ẩn, toggle hiện, logo 56/64 px; footer logo giới hạn 48/64 px height (trước đây rộng 373 px gây 63 px doc overflow), container padding 20/12 px, footer `overflow-wrap:anywhere` tại 400%.
- Tab dài: 6/6 nhãn tại 400% rộng **260 px**, font **20 px**, `min-height 48 px`, `clipped:false`; rail 268 px không tạo overflow; nhãn đọc trọn, chọn được, keyboard focus đúng.
- Đo 18 tổ hợp (results/calendar × 390 × EN/VI × 100/200/400): **docOverflow 0**, header/footer rộng 390; Home 400% còn **228 px (EN) / 153 px (VI)** — thuộc Home surface, ngoài P4, **OPEN — không PASS**.
- Keyboard: toggle mở/đóng dialog, roving tabs; reduced motion: 0 animation. Logo SHA-256 không đổi (`226ab6f1…03a9036acd2`, `424a28bf…a8176125`).

**4. Browser acceptance — 12/12**

- 1440×900 / 768×1024 / 390×844 × EN/VI × Results R17 / Calendar, `?intro=false`, production preview `:4173`.
- 12/12 `heroReady:true`; hero `currentSrc` đúng theo viewport (results desktop 960/640, mobile 480; calendar dùng `hero-mobile` có chủ đích); `naturalWidth>0`, `objectFit:"cover"`, `alt:""`, `aria-hidden:true`; poster 600/900/420; palette R17 crimson, R19 night; 22/22 hàng có team tint; Next GP card đủ race/round/date/CTA; **0 broken image, 0 failed request, 0 pageerror**.
- Console chỉ còn lỗi face font Manrope data-URI có từ trước (D-P1-02); body vẫn render Manrope. `docOverflow 0` ở cả 12 case; header/footer 390/1440.

**5. Bốn gate**

| Gate | Kết quả | Bằng chứng | Ghi chú |
|---|---|---|---|
| **G-1 Layout/UX** | **PASS** | 12/12 acceptance; 18 phép đo zoom; keyboard/reduced motion; ảnh 1440/768/390 EN/VI + hero/feature/table crop | Không overflow/clip ngoài chủ đích; mobile có composition riêng |
| **G-2 Visual/Imagery** | **PARTIAL** | 36 plate project-owned + provenance registry; ảnh before (CSS-only) / after (cinematic) cùng state; palette/type/contrast | **Đã có imagery + provenance**; còn thiếu **minh họa đường đua có chiều sâu** — trace vẫn là schematic 2D accent, không phải artwork 3D |
| **G-3 Motion/Performance** | **PARTIAL** | Motion map giữ nguyên; reduced motion PASS; bundle 629,53 kB (gzip 91,14); lab vitals + CLS log | Lighthouse/field Web Vitals/INP/GPU thật **NOT RUN**; CLS VI vượt 0,1 trong cold run |
| **G-4 Engineering QA** | **PASS** | lint/typecheck/**424** test/build/security/preview; commercial isolation PASS | CSP D-P1-02 và Home 400% vẫn OPEN ngoài P4 |

**6. Final engineering evidence (source cuối)**

| Check | Kết quả |
|---|---|
| ESLint | **PASS** exit 0 — 0 error, 15 warning pre-existing (`logs/final/lint.*`) |
| TypeScript | **PASS** exit 0 — 4/4 workspace (`logs/final/typecheck.*`) |
| Tests | **PASS** exit 0 — **424**: web **406** (70 file) + API **16** (3) + security **2** (1) (`logs/final/tests.*`) |
| Build | **PASS** exit 0 — 8,93 s; entry `index-Dwl4qguP.js` **629,53 kB** (gzip **91,14 kB**) (`logs/final/build.*`) |
| Commercial guard | **PASS** — removed 14 legacy + 2 review-only, verified 73 EDS assets; isolation 32 module/116 file |
| Cloudflare output | **PASS** — 4 Engineering articles |
| Secret / asset boundary | **PASS** exit 0 (`logs/final/secrets.*`, `assets.*`) |
| Preview | **PASS** — `/` và route Results HTTP 200; plate `hero-desktop-960.avif` HTTP 200, 6.622 B |

**7. Lab vitals (loopback, không phải field) + CLS residual**

| Case | LCP median (ms) | CLS median | Ghi chú |
|---|---|---|---|
| results 1440 EN | 244 | 0,0099 | unthrottled |
| results 390 EN | 200 | 0,0341 | unthrottled |
| results 390 VI | 192 | **0,1324** | vượt target 0,1 |
| calendar 1440 EN | 612 | 0,0087 | unthrottled |
| calendar 390 EN | 476 | 0,0054 | unthrottled |

- Throttled (4× CPU, 1,6 Mbps/750 kbps): LCP **5.844–8.604 ms**, CLS 0,0002–0,0098, 4–6 long task (dài nhất 1.215 ms). Đây là lab loopback + CDP emulation, **không đại diện field**; Lighthouse/INP thật **NOT RUN**.
- **D-P4-11 (P2, OPEN):** VI 390 results đo 0,132 ở 3/4 cold run (1/4 pass 0,0017). Shift xảy ra 486–538 ms, **sau** khi artwork tải xong; nguồn shift là reflow text-metric của hero copy/visual, **không có nguồn nào là plate**. Nghi vấn face font Manrope swap muộn (data-URI, không preload). Đề xuất vòng sau: preload/size-adjust hoặc reserve chiều cao rail; **chưa sửa trong lượt này** để tránh thay đổi typography toàn cục ngoài scope.
- **D-P4-12 (P3, OPEN):** cùng URL results R17, hai lần tải liền kề hiển thị “Verified sessions” **85** và **86** (18 verified rounds không đổi), nghi do aggregate render trước khi nguồn dữ liệu hội tụ; cần quyết định hiển thị pending/settled ở vòng sau. Không phải dữ liệu race bịa.

**8. NOT RUN**

Lighthouse; axe/screen-reader; Safari/Firefox; thiết bị/GPU thật và FPS LOD; INP field; CI GitHub Actions; hai automated data workflow; preview/production deployment và smoke. `npm audit` không chạy lại trong lượt này (kết quả gần nhất trước đó: exit 0, 12 moderate, 0 high, dev tooling).

**9. Evidence**

`scratch/ignition/p4/evidence-cinematic-acceptance.json` (12 case), `evidence-lab-vitals.json`, `evidence-cls-vi-isolated.log`, `evidence-zoom-final.log`, `evidence-keyboard-final.log`, `logs/final/*`, **42 ảnh `shots/final-*.png`** (1440/768/390 × EN/VI × full/hero/feature/table), `shots/visual-before/` (CSS-only baseline) và `shots/visual-after/` (bản bị owner từ chối), cùng contact sheets.

**10. Kết luận**

Đã thay lớp hình ảnh đúng chỉ đạo (artwork EDS-G01 thật, có provenance, có crop mobile riêng) và đóng tràn header/footer 390/400% trong phạm vi global + P4. G-1 và G-4 PASS; **G-2 PARTIAL** vì minh họa đường đua có chiều sâu chưa được sản xuất (vẫn là schematic accent), **G-3 PARTIAL** vì field/Lighthouse/INP chưa đo và CLS VI cold run vượt target. Quyết định: **HOLD — `P4 CINEMATIC VISUAL ACCEPTANCE — OWNER REVIEW`**. Owner đối chiếu bộ ảnh before/after và quyết định: duyệt hướng cinematic hiện tại, hay yêu cầu bổ sung artwork đường đua có chiều sâu + xử lý CLS trước Gate 4 GO. **Không cleanup, commit, push, merge, deploy; không mở P5.**

### 13.28 P4 ASSET COMPLIANCE — OWNER REVIEW (01/11/2026)

**Status:** `P4 ASSET COMPLIANCE — OWNER REVIEW / GATE 4 PENDING`. Owner ra **CRITICAL OWNER OVERRIDE** ngày 01/11/2026: EDS-G01 là model owner tự dựng; mọi chỉ đạo trước đó dùng EDS-G01 làm nguồn cinematic imagery **bị hủy bỏ**. §13.27 được giữ nguyên làm bản ghi lịch sử nhưng **kết luận hình ảnh của nó không còn hiệu lực**. Vòng này gỡ toàn bộ artwork dẫn xuất khỏi P4, khóa vĩnh viễn model/video/logo, và ghi nhận trung thực phần chưa thể xác minh.

**1. Vi phạm đã xác định**

- 36 plate (6 bố cục × 3 bề rộng × AVIF/WebP, **637.185 B**) render từ `apps/web/public/models/eds-g01.glb` được đưa vào production build và hiển thị tại Race Center hero, round feature, Calendar hero và Next GP — **không có sự cho phép của owner**.
- Caption công khai "EDS-G01 · project original" / "EDS-G01 · {palette} livery study" xuất hiện trong UI.
- Pipeline render (`scratch/ignition/p4/render/`) và 3 module source (`CinematicPlate.tsx`, `cinematicPlates.ts`, `cinematicArtContract.test.ts`) tồn tại trong cây làm việc.
- Không có ảnh đội/sponsor/venue/bản đồ FIA, không dùng mockup, không dùng Model B, không tạo dữ liệu race/weather/tyre/lap giả trong lớp artwork này.

**2. References đã gỡ**

| File | Thay đổi |
|---|---|
| `apps/web/src/components/championship/WeekendResults.tsx` | Bỏ import `CinematicPlate`/`cinematicPlates`; bỏ `<figure className="rc-hero-art">` + `<CinematicPlate>` + caption; bỏ `data-palette` ở `.rc-hero` và `.rc-round-visual`; bỏ `.rc-round-art` + caption "livery study". Giữ nguyên round rail, sticky controls, bảng 22 hàng, team tint, legend, stats, trace |
| `apps/web/src/components/championship/ChampionshipCalendar.tsx` | Bỏ import và mọi `<CinematicPlate>`; bỏ `data-palette` ở `.cal-hero` và `.cal-next-art`; bỏ caption "EDS-G01 · project original". Giữ filters, Next GP R19, countdown `role="timer"`, CTA, season nav |
| `championshipC11.css` | Xóa toàn bộ block cinematic (~289 dòng: palette, `.rc-hero-art`, `.rc-round-art`, overlay gradients, crop/scale, caption, 400% single-quote trùng lặp). Giữ composition schematic gốc và toàn bộ rule `[data-text-zoom="400"]` của base |
| `championshipC1.css` | Xóa block cinematic Calendar (~229 dòng) tương ứng; giữ base `.cal-hero-visual`, `.cal-next-visual` và rule 400% |
| `apps/web/public/images/p4/cinematic/` | **Xóa khỏi cây public** (36 file); thư mục `images/p4` không còn tồn tại; build mới không chứa `dist/client/images/p4` |
| `scratch/ignition/p4/render/` | **Di chuyển** vào quarantine; không còn chạy được từ đường dẫn cũ |
| 3 module source | **Xóa khỏi `apps/web/src`**; bản sao lưu trong quarantine |
| `apps/web/src/config/p4AssetCompliance.test.ts` | **Thêm mới** 6 test chặn tái phát: không còn `public/images/p4`, không còn module cinematic, không còn chuỗi `/images/p4/cinematic`, `CinematicPlate`, `paletteForRound`, `posterForRound`, `data-palette`, `EDS-G01 ·`; vẫn còn schematic + P4 behaviour; quarantine còn đủ 36 plate |

**Quarantine (không xóa vĩnh viễn):** `scratch/ignition/p4/quarantine/eds-g01-artwork/` — **52 file, 3.271.860 B**, gồm `plates-produced/` (36), `source-render/` (scene.html, render.cjs, export.cjs, server.cjs, export-manifest.json, 7 master PNG), `source-code/` (3 module), `MANIFEST.json` (byte + SHA-256 từng file), `README.md`. Không file nào được serve/import/build. Chưa xóa vì chưa có owner approval.

**3. Phần P4 hợp lệ được giữ**

Sticky round/session controls (`.c11-pinned-controls`), bảng classification 10 cột với 22 hàng tint theo đội kèm tên đội, legend trạng thái, stats 23/18/86, round rail, season switcher, Calendar filters All/Completed/Upcoming (23/18/5), Next GP R19 với countdown + CTA, season nav, responsive 1440/768/390, keyboard roving tabs, reduced motion, và toàn bộ rule 400% của base. **Không khôi phục file về HEAD**; không mất công việc P1–P4 chưa commit.

**4. Homepage video — IMMUTABLE, không thay đổi**

| Hạng mục | Bằng chứng |
|---|---|
| Source | `.local-assets/recovered/homepage-h3-2/tokyo-drift-h3-2-2x.mp4` — **1.761.848 B**, SHA-256 `fc9de024524b299003aee507798f4a89bdaf635c87ef0ef3770dd29ab94bd421`, mtime 30/10/2026 13:48 |
| Poster | `tokyo-drift-h3-2-poster.png` — **866.844 B**, SHA-256 `98f88281993c94425bbc6d6e3ff7ef7e621650a05213ec48937bad60b691cc69`, mtime 30/10/2026 13:49 |
| Component | `PodiumBrandHero.tsx` mtime 31/10/2026 16:01 — trước toàn bộ công việc P4 (bắt đầu 31/10 tối); không có chỉnh sửa nào trong vòng này |
| Logic hiện tại | `devCinematic = import.meta.env.DEV`; `renderVideo = devCinematic && !mobile && !lowEnd && !reducedMotion && !videoFailed && !videoEnded`; video `muted playsInline preload="auto"`, one-shot, `onEnded → poster`, `onError → poster`; không có `loop`, `playbackRate`, `autoPlay` attribute |
| Khớp baseline P3 | Khớp đặc tả đã duyệt tại `scratch/ignition/p3-home/P3_AUDIT.md` (dòng 81, 107) và motion-guard log (poster `/__peds-review/tokyo-drift-h3-2-poster.png`) |
| Production build | Không có `<video>`, không request `/__peds-review/*` hay `*.mp4`; hero dùng 3D scene + fallback `/images/eds/editorial/eds-g01-hero.svg` |

**Không thể xác minh:** P3 không lưu SHA-256 của video/poster tại thời điểm owner duyệt, nên không có hash baseline chính thức để so khớp. Baseline được **thiết lập tại thời điểm này** (hash ở trên) và phải giữ nguyên từ nay. Mtime + nội dung khớp đặc tả P3 là bằng chứng gián tiếp, không phải bằng chứng cryptographic của bản owner đã duyệt.

**5. Model B — license và ranh giới**

- File: `source-assets/models/model-b-eds-optimized-v1.glb`, **2.120.816 B**, SHA-256 `2D0091661DACE5D6C61AEBF898B4974644B44E43A5E8D10F602685C1631610A2` — khớp frozen hash.
- Nguồn: “Formula 1 2022 Car” by Luis Adrian V. trên Sketchfab, **CC BY 4.0**; attribution record có trong `source-assets/models/model-b/README.md`.
- Vị trí: ngoài `public`, chỉ phục vụ qua middleware DEV `/__peds-review/model-b.glb`; build production không chứa model này.
- **Quyền commercial/derivative-image chưa được xác minh** (CC BY 4.0 không tự giải quyết trademark/trade dress/design rights). Do đó dùng Model B cho artwork production: **BLOCKED**. Không tự chọn model khác, không fallback sang EDS-G01.

**6. QA trên source cuối**

| Check | Kết quả |
|---|---|
| ESLint | **PASS** exit 0 — 0 error, 15 warning pre-existing (`logs/compliance/lint.*`) |
| TypeScript | **PASS** exit 0 — 4/4 workspace (`logs/compliance/typecheck.*`) |
| Tests | **PASS** exit 0 — **427**: web **409** (70 file) + API **16** (3) + security **2** (1); có 6 test compliance mới, 3 test contract cũ đã bị gỡ cùng feature (`logs/compliance/tests.*`) |
| Build | **PASS** exit 0 — 9,03 s; entry `index-BESGb1O6.js` **629,53 kB** (gzip **91,15 kB**) (`logs/compliance/build.*`) |
| Commercial guard | **PASS** — removed 14 legacy + 2 review-only, verified 73 EDS assets; isolation 32 module/116 file; Cloudflare 4 articles |
| Secret / asset boundary | **PASS** exit 0 |
| Dist boundary | **PASS** — không còn `dist/client/images/p4`; không có mp4/webm trong public hoặc dist |
| Preview | **PASS** — `/`, `/results`, `/calendar` HTTP 200; URL plate đã gỡ rơi về SPA shell HTML (không phải ảnh), `nosniff` |
| Browser compliance | **12/12** (1440/768/390 × EN/VI × Results R17/Calendar): `heroArt:false`, `roundArt:false`, **0** `img/picture/video` trong hero visual, trace SVG hiện diện, `paletteAttr:0`, **0** request `/images/p4/`, 0 request lỗi, 0 pageerror, docOverflow **0**, 22/22 hàng tint, 5 tab, 3 filter, Next GP R19 + countdown |
| 400% / keyboard | PASS — results/calendar 0 overflow tại 100/200/400 EN/VI; reduced motion 0 animation; ArrowRight chuyển focus/selected đúng |
| Homepage production | PASS — không video, không request review asset; scene + SVG fallback; docOverflow 0 |
| Logo | SHA-256 không đổi (`226ab6f1…03a9036acd2`, `424a28bf…a8176125`) |

**7. Vấn đề còn mở**

- **Hình ảnh P4 hiện chỉ còn schematic** → G-2 **chưa đạt**; cần artwork độc lập, không dùng model, có license/provenance riêng và owner duyệt trước khi đưa lại.
- EDS-G01 vẫn xuất hiện trong production ở các điểm **có trước P4**: `models/eds-g01.glb` (Showroom), `images/eds/editorial/eds-g01-hero.svg` (fallback hero), `images/showroom/eds-g01/**` (schematic), caption Engineering "Sơ đồ EDS-G01 · không phải Model B", và nhãn nav "EDS-G01 Showroom". Đây không phải artwork P4 và không bị thay đổi trong vòng này (HOMEPAGE VIDEO LOCK cấm đổi hero media), nhưng **owner cần xác nhận** phạm vi MODEL LOCK có bao gồm các điểm này hay không.
- **D-P4-11** (CLS VI 390 cold run 0,1324), **D-P4-12** (verified sessions 85/86), Home 400% **228/153 px**, **CSP font subset D-P1-02**: vẫn **OPEN — không PASS**.
- Thư mục rỗng `apps/web/NUL/` (tạo 24/10, trước vòng này) gây warning `git status`; không thuộc phạm vi, không xóa.

**8. NOT RUN**

Lighthouse/axe; Safari/Firefox; thiết bị/GPU thật và FPS LOD; INP field; CI GitHub Actions; hai automated data workflow; preview/production deployment và smoke; `npm audit` không chạy lại.

**9. Evidence**

`scratch/ignition/p4/evidence-asset-compliance.json` (12 case + home + keyboard), `logs/compliance/{lint,typecheck,tests,build,secrets,assets}.{log,exit}`, `logs/compliance/{zoom-reflow,zoom-keyboard}.log`, **13 ảnh `shots/compliance-*`** (1440/768/390 × EN/VI × full/hero/feature + home), `scratch/ignition/p4/quarantine/eds-g01-artwork/MANIFEST.json`.

**10. Kết luận**

Artwork dẫn xuất từ EDS-G01 đã được gỡ khỏi UI, build và public tree; bản gốc được bảo quản ngoài production kèm manifest hash; Homepage video, logo và Model B boundary không thay đổi. Ba khóa vĩnh viễn (MODEL / HOMEPAGE VIDEO / BRAND) đã được ghi vào plan này, `DESIGN.md` và `AGENTS.md`. Tuy nhiên P4 hiện **không còn imagery** (chỉ schematic) và chưa có artwork độc lập được duyệt, nên **chưa thể APPROVED**. Quyết định: **HOLD — `P4 ASSET COMPLIANCE — OWNER REVIEW`**. Owner cần: (a) xác nhận phạm vi MODEL LOCK với các điểm EDS-G01 có trước P4; (b) quyết định có đầu tư artwork độc lập không dùng model hay giữ schematic; (c) quyết định xử lý quarantine. **Không cleanup, commit, push, merge, deploy; không mở P5.**

### 13.29 P4 STAGE A–D — HOMEPAGE VIDEO RESTORED, DEFECTS CLOSED, IMAGERY PROPOSAL (01/11/2026)

**Status:** `P4 STAGE A–D DONE / HOMEPAGE VIDEO RESTORED IN PRODUCTION / G-2 STILL PARTIAL / OWNER DECISION REQUIRED`. Section này ghi lại bốn stage theo owner directive: A (khôi phục Homepage video), B (guard rules), C (đề xuất imagery/provenance, **không tích hợp asset mới**), D (đóng các defect còn mở). Không có commit/push/merge/deploy; P4 vẫn mở; P5 khóa.

#### A. Homepage video — khôi phục đúng bản owner đã duyệt

**1. Audit.** Production trước Stage A render hero 3D `EDSHomeHeroScene` (EDS-G01) và chỉ dùng video trong DEV (`devCinematic = import.meta.env.DEV`). Đây là sai lệch so với bản owner đã duyệt ở P3 (video Tokyo Drift + poster), nhưng **không có hash baseline chính thức** từ P3 để so khớp (đã ghi tại §13.28 §4).

**2. Xác định bản chính xác — không chọn đại.** Trong `.local-assets/recovered/homepage-h3-2/` chỉ có **một** cặp file khớp đặc tả P3, và cặp này đã nằm sẵn trong `public/media/homepage/`:

| Asset | Bytes | SHA-256 | Mtime |
|---|---|---|---|
| `hero-h3-2.mp4` (nguồn `tokyo-drift-h3-2-2x.mp4`) | **1.761.848** | `FC9DE024524B299003AEE507798F4A89BDAF635C87EF0EF3770DD29AB94BD421` | 30/10/2026 13:48 |
| `hero-h3-2-poster.png` (nguồn `tokyo-drift-h3-2-poster.png`) | **866.844** | `98F88281993C94425BBC6D6E3FF7EF7E621650A05213EC48937BAD60B691CC69` | 30/10/2026 13:49 |

Các biến thể `h2-9`, `h3-0`, `h3-1-2x/3x`, `h3-2-3x`, `h3-2r-homepage` và `tokyo-drift-final` có hash/byte khác → **không dùng**, chỉ giữ làm đối chiếu. Không trim, transcode, regenerate, đổi tốc độ, loop, autoplay attribute hay âm thanh; hai file asset **không bị sửa một byte** (guard ở mục B).

**3. Thay đổi source (duy nhất `PodiumBrandHero.tsx`).**
- `renderVideo = !reducedMotion && !saveData && !lowEnd && !videoFailed && !videoEnded` — bỏ điều kiện `import.meta.env.DEV` và `mobile`, nên video là hero production cho mọi viewport đủ điều kiện.
- Bỏ hoàn toàn `lazy(() => import('./EDSHomeHeroScene'))`, `Suspense`, `ErrorBoundary` và nhánh 3D: **không còn canvas/3D phía sau hoặc thay thế video**, không fallback EDS-G01.
- Fallback duy nhất là **poster đã duyệt**: `onError` và `onEnded` → poster; reduced-motion, `saveData`, deviceMemory ≤ 4 GB → poster tĩnh.
- Giữ `muted`, `playsInline`, không `loop`, không `autoPlay`, không `playbackRate`; thêm toggle Pause/Play có nhãn, pause khi hero ra khỏi viewport và resume đúng trạng thái; intro 3,35 s vẫn chặn play tới khi overlay biến mất; skip/reduced-motion giữ nguyên.
- `RACE BEYOND LIMITS.`, CTA, logo, HUD/eyebrow không đổi so với bản P3 đã duyệt.

**4. Bằng chứng production (local production preview `http://localhost:4173`, không phải deployment).** `scratch/ignition/p4/evidence-hero-video.json` + 49 ảnh `scratch/ignition/p4/shots/hero-video/`:
- 12/12 case 375/390/768/1024/1440/1920 × EN/VI: `videoCount=1`, `canvasCount=0`, `sceneCount=0`, `modelLabel=null`, `mentionsG01=false`, `loop=false`, `autoplay=false`, `playbackRate=1`, `documentOverflow=0`; text hero `RACE BEYOND LIMITS.` hiện đúng; video bắt đầu sau intro (first play ~735 ms).
- Poster fallback: `reduced-motion` → poster; `abort` (chặn request mp4) → poster; hết one-shot → poster; offscreen pause và on-screen resume đúng.
- Ảnh `375x812-*-playing.png`, `1440x900-*-playing.png`, `1920x1080-*-playing.png`, `*-poster.png` xác nhận hình ảnh thực tế, không dùng mockup.

**5. Chưa xác minh.** Production deployment thật (owner cấm deploy) → **PENDING**; Safari/Firefox và thiết bị thật → **NOT RUN**.

#### B. Guard rules bổ sung (Stage B)

| Guard | Nội dung |
|---|---|
| `apps/web/src/config/assetLocks.test.ts` (**mới**) | 3 test: mp4 đúng **1.761.848 B** + SHA-256 `FC9DE024…BD421`; poster đúng **866.844 B** + SHA-256 `98F88281…CC69`; logo `logo.png` `226AB6F1…6ACD2` và `logo-compact.png` `424A28BF…8176125` |
| `apps/web/src/config/commercialVisualIsolation.test.ts` | Hero contract: có `HERO_VIDEO_SRC`/`HERO_POSTER_SRC`, `<video>`, `muted`, `playsInline`; **không** `loop`, `autoPlay`, `playbackRate`, `__peds-review`, `EDSHomeHeroScene`, `eds-g01-hero.svg`, `devCinematic`, `ModelBHomeHeroScene`; danh sách asset review-only cấm (gồm mọi biến thể `tokyo-drift-*` và `commercial-b`) |
| `apps/web/src/config/p4AssetCompliance.test.ts` | 6 test: không `images/p4`, không module cinematic, không chuỗi `/images/p4/cinematic`, `CinematicPlate`, `paletteForRound`, `posterForRound`, `data-palette`, `EDS-G01 ·`; quarantine còn đủ 36 plate + manifest |
| `apps/web/src/config/zoomReflowContract.test.ts` | Thêm contract 400% cho Home hero, Home cards **và standings panel** (mục D) |
| `apps/web/src/config/cspFontContract.test.ts` | Thêm contract fallback font metric + CSP `font-src` không có `data:` |

Tất cả là test đọc source/asset trên đĩa (node env), chạy trong full suite; không thay đổi runtime.

#### C. Đề xuất imagery + provenance cho Race Center / Calendar — **KHÔNG tích hợp asset mới**

**Bối cảnh:** sau khi 36 plate EDS-G01 bị gỡ (§13.28), hai surface P4 chỉ còn `CircuitTrace` schematic + data composition. Ảnh hiện tại (baseline preview, không phải đề xuất mới): `scratch/ignition/p4/shots/compliance-results-1440-en-hero.png`, `compliance-calendar-1440-en-hero.png`, và bộ 390/768/1440 × EN/VI.

**Inventory thực tế (kiểm tra trên `apps/web/public`):** 11 raster — 4 ảnh Engineering social PNG, 6 logo/brand, 1 poster hero; 72 SVG `images/eds/**` gồm 24 circuit schematic, 28 **abstract helmet** (ghi rõ “not a portrait or endorsement image”), 11 “EDS-G01 vehicle field study”, 8 engineering, 1 editorial. **Không có** ảnh team/sponsor/venue/FIA, không stock photo, Model B ngoài public, plate EDS-G01 trong quarantine. Vì vậy **không tồn tại asset phù hợp đã được cấp phép** để đưa vào P4 ngay bây giờ.

**Phương án trình owner (chưa chọn thay owner):**

| # | Phương án | Provenance / quyền | Trạng thái |
|---|---|---|---|
| A | **Giữ schematic + data composition** (hiện tại) | 100% project-authored, 0 rủi ro quyền | Hợp lệ ngay; **G-2 PARTIAL** |
| B | **Artwork vector độc lập do project tự dựng** (không render từ model): poster typographic + track geometry từ dữ liệu circuit trong repo + halftone/print texture, xuất SVG/AVIF có manifest | Project-authored; cần owner xác nhận **đây là imagery** và duyệt art direction trước | **Đề xuất chính**; phải có preview riêng trong `scratch/` trước khi tích hợp; không được chỉ là gradient/neon SVG |
| C | **Ảnh owner cung cấp hoặc mua licence** (photography/illustration) | Cần licence bằng văn bản cho web thương mại + quyền crop/derivative; ghi source, author, licence, SHA-256, attribution | Chờ owner cung cấp/duyệt nguồn; chưa có asset → **BLOCKED** |
| D | Render Model B cho production | CC BY 4.0 không tự giải quyết trademark/trade dress/design rights; Model B vẫn DEV-only | **BLOCKED** — không dùng, không fallback EDS-G01 |
| E | Dùng 28 abstract helmet SVG làm imagery P4 | Project-authored nhưng gắn driver cụ thể, dễ hàm ý endorsement (dù desc phủ nhận) | **Không khuyến nghị**; chỉ làm nếu owner chấp thuận rõ ràng |

**Quy tắc provenance cho mọi asset tương lai:** ghi source + author + licence + SHA-256 + phạm vi sử dụng + attribution + ngày owner duyệt vào `docs/asset-licenses.md` **trước** khi tích hợp; không dùng EDS-G01/derivative; không dùng bản đồ FIA chính thức hay mark của team/sponsor/venue; không tạo dữ liệu race/weather/tyre/lap giả để “giống mockup”; hero video không bị chạm tới.

**Kết luận C:** không tích hợp asset mới; **G-2 giữ PARTIAL**; không tuyên bố thiết kế P4 đã hoàn thiện. Owner cần chọn A/B/C (hoặc E có điều kiện) trước khi có vòng imagery tiếp theo.

#### D. Đóng defect Stage D (đo trên production preview, cùng build)

**D-P4-11 — CLS cold-load Results VI mobile.**
- **Root cause (đã xác minh):** fallback `Arial Narrow` rộng hơn Barlow Condensed ~24%, nên `h2` hero đổi từ **2 dòng (70 px)** sang **1 dòng (35 px)** đúng lúc webfont swap (~690–714 ms), đẩy nội dung hero ~44 px → layout shift 0,121–0,133. Preload-only từng cho 0,00013 nhưng phụ thuộc timing mạng nên bị loại.
- **Fix:** thêm hai `@font-face` fallback metric-matched trong `index.css` — `Barlow Condensed Fallback` (`local('Arial Narrow')`, `size-adjust: 80%`) và `Barlow Condensed Arial Fallback` (`local('Arial')/Helvetica/Liberation Sans`, `size-adjust: 68%`) — và chèn vào `--peds-font-display` trước `Arial Narrow`. Line count ổn định từ first paint, kể cả mạng chậm.
- **Đo lại (cold, 390×844, 3 lần VI):** CLS **0 / 0,00195 / 0,00180** (trước: 0,13296 / 0,12313); EN **0,02343**; Home VI **0,00224**; Home EN 1440 **0,00685**; LCP 176–604 ms; docOverflow 0; CSP 0; console 0; request lỗi 0. → **CLOSED (lab, local preview)**.

**D-P4-12 — verified session count 85/86.**
- Session-count cell hiển thị `—` + `sr-only` “Đang đối chiếu số phiên đã xác minh” (`data-pending="true"`, `aria-busy`) cho tới khi store settle, sau đó **86**; không còn trạng thái 85. Xác nhận trong cả 3 cold run VI và run EN (`evidence-stage-d.json` samples `—` → `86`). → **CLOSED**.

**Home 400% text-zoom (228/153 px).**
- Hero cinematic: stack dọc, padding px, title cap 34 px, telemetry static (`podiumHeroR1.css`).
- Explore/Editorial cards: wrap, padding px, type 14/20 px (`homepageH1.css`).
- **Standings panel (mới trong vòng này):** trước fix, panel 364 px nhưng `.c1-section-head` giữ padding 80 px và `h2` 112 px (425 px), list cột 659 px, row body 0 px, toàn bộ bị `overflow:hidden` cắt. Thêm rule 400% trong `championshipC1.css`: head stack + padding 16 px + `h2` 32 px; list `minmax(0,1fr)`; row stack rank/identity/stats, padding 14/12 px. Đo lại: panel `sw = cw = 364` (390) và `1414` (1440), row `sw = cw`, panel height 21.791 → **4.617 px**.
- **Đo tổng:** `diag-400-routes.cjs` → `over=0` cho `/`, `?tab=standings`, `?tab=calendar`, `?tab=results&round=17&session=race` × EN/VI tại 390; `shots-home-zoom-after.cjs` → 4/4 case 390/1440 × EN/VI `over=0`. Ảnh: `home-en/vi-390-400.png`, `home-en/vi-1440-400.png`, `home400-*-standings.png`, `home400-*-standings-1440.png`. → **CLOSED (browser, text-only zoom 400%)**.

**CSP font warning (D-P1-02).**
- **Nguyên nhân (đã xác minh):** Vite inline một subset font nhỏ thành `data:` URL trong CSS, trong khi `_headers` chỉ cho `font-src 'self' https://fonts.gstatic.com` → CSP chặn. **Không mở rộng CSP.**
- **Fix:** `vite.config.ts` đặt `assetsInlineLimit` trả `false` cho `woff/woff2/ttf/otf/eot`, buộc font phát ra file hashed trong `assets/`. Contract test `cspFontContract.test.ts` giữ `font-src` không có `data:` và kiểm tra fallback metrics.
- **Đo lại:** 0 CSP warning trong 6 cold run Stage D (VI/EN Results + Home). → **CLOSED**.

**Evidence Stage D:** `scratch/ignition/p4/evidence-stage-d.json`, `evidence-hero-video.json`, `evidence-home-zoom.json`, ảnh `shots/stage-d/**`, `shots/hero-video/**`, harness `qa-stage-d.cjs`, `diag-400-routes.cjs`, `shots-home-zoom-after.cjs`, `shots-home400-sections.cjs`, `diag-home400-standings.cjs`, `diag-standings-1440.cjs`, `diag-fallback-metrics.cjs`.

#### E. Trạng thái sau Stage A–D

| Gate | Trạng thái | Ghi chú |
|---|---|---|
| Homepage video | **RESTORED (local production preview)** | bytes/hash khớp, không 3D, poster-only fallback; deployment thật **PENDING** |
| D-P4-11 | **CLOSED (lab)** | CLS VI 0–0,00195; EN 0,02343 |
| D-P4-12 | **CLOSED** | `—` → 86, không 85 |
| Home 400% | **CLOSED (browser)** | 0 px overflow, 390/1440 × EN/VI |
| CSP font | **CLOSED** | nguyên nhân inline font; CSP không mở rộng |
| G-2 imagery | **PARTIAL** | chờ owner chọn A/B/C; chưa tích hợp asset |
| G-3 Web Vitals/field | **PARTIAL** | lab local; Lighthouse/axe/INP field/thiết bị thật **NOT RUN** |

**Không cleanup, commit, push, merge, deploy; không mở P5.** Bước tiếp theo duy nhất: owner review Stage C và quyết định imagery.

### 13.30 P4 STAGE E — FINAL QA + OWNER GATE (01/11/2026)

**Status:** `P4 STAGE E DONE / HOMEPAGE VIDEO RESTORED + P4 FINAL OWNER REVIEW / G-2 PARTIAL / G-3 PARTIAL / GATE 4 PENDING`. Stage E là vòng QA cuối trên **local production build**, phát hiện và đóng thêm một defect zoom nhỏ (D-P4-13) bằng CSS + contract test. Không thay đổi video, poster, logo, model, quarantine, dữ liệu, route, API hay CSP. **Không cleanup, commit, push, merge, deploy; P5 khóa.**

#### A. Source delta duy nhất của Stage E

| File | Delta | Ghi chú |
|---|---|---|
| `apps/web/src/components/home/homepageH1.css` | thêm rule `[data-text-zoom="200"]` trong `@media (max-width: 767px)` cho `.h1-countdown__sessions/__session` (stack 1 cột, padding 16 px, `overflow-wrap:anywhere`) | đóng D-P4-13; không chạm hero/video |
| `apps/web/src/config/zoomReflowContract.test.ts` | +1 test (file còn 8 test) | chống tái phát |

Không đổi: `PodiumBrandHero.tsx`, bytes `hero-h3-2.mp4`/poster, `logo*.png`, `eds-g01.glb`, Model B, `public/_headers` (CSP), API/`/api/jolpica`, dữ liệu 2026, routes, `scratch/ignition/p4/quarantine/**`.

#### B. D-P4-13 — Home countdown schedule tràn 4 px tại 390/EN/200% (**CLOSED**)

| Trường | Nội dung |
|---|---|
| Severity / loại | P3 — mobile, text-only zoom 200%, lỗi reflow (không phải lỗi dữ liệu) |
| Component | `HomeRaceCountdown` → `.h1-countdown__sessions` (Home, route `/`) |
| Repro | 390×844, EN, `html { font-size: 32px }` ⇒ `data-text-zoom="200"` |
| Expected | `scrollWidth = innerWidth = 390`; không tràn ngang |
| Actual (trước fix) | `scrollWidth 394` (**+4 px**); `.h1-countdown__sessions` `scrollWidth 374` / `clientWidth 350` (**+24 px**); nhãn EN `Qualifying` cần **156 px** trong cột chữ **99 px** |
| Root cause (đã xác minh) | Schedule vẫn là grid 2 cột `minmax(150px,1fr)`; `padding: 1rem` nhân đôi theo zoom ⇒ mỗi card chỉ còn 99 px chữ. Nhãn EN dài nhất tràn khỏi card và đẩy document rộng thêm 4 px. VI không lỗi vì nhãn ngắn hơn. Không liên quan hero/video/standings. |
| Fix | CSS-only, scope `max-width: 767px` + `[data-text-zoom="200"]`: schedule stack `minmax(0,1fr)`, padding card **16 px**, `overflow-wrap:anywhere` cho `small/strong/time`. **Không hạ font size** để che lỗi. |
| Retest | **48/48** case (390/1440 × EN/VI × 100/200/400 × `/`, `?tab=standings`, `?tab=calendar`, `?tab=results&round=17&session=race`): page overflow **0**, schedule inner overflow **0**, CSP **0**, console error **0**. Ảnh after: `shots/stage-e/home-countdown-390-en-200-after.png`. |
| Status | **CLOSED (browser + contract test)** — guard mới trong `zoomReflowContract.test.ts`. |

#### C. Static + security gates (nguồn cuối, sau fix D-P4-13)

| Gate | Lệnh | Kết quả | Evidence |
|---|---|---|---|
| ESLint | `npm run lint` | **PASS** exit 0 — 0 error / 15 warning (unused args, pre-existing) | `logs/stage-e/lint.log`, `lint.exit` |
| TypeScript | `npm run typecheck` | **PASS** exit 0 | `logs/stage-e/typecheck.log`, `typecheck.exit` |
| Tests | `npm run test` | **PASS** exit 0 — **440** test: web **422**/73 file + API **16**/3 file + security **2**/1 file | `logs/stage-e/tests.log`, `tests.exit` |
| Build | `npm run build` | **PASS** exit 0 — **8,84 s**; entry `index-BPCFNVq6.js` **629,49 kB** (gzip **91,12 kB**); commercial visual isolation **PASS** (114 artifact); Cloudflare output **PASS** | `logs/stage-e/build.log`, `build.exit` |
| Secrets | `npm run security:secrets` | **PASS** | `logs/stage-e/secrets.log` |
| Public assets | `npm run security:assets` | **PASS** — allowlist path+SHA cho đúng một mp4 đã duyệt | `logs/stage-e/assets.log` |
| Dependency audit | `npm run security:audit` (`--audit-level=high`) | **PASS** exit 0 — 0 high/critical; **12 moderate** (dev tooling), không auto-fix | `logs/stage-e/audit.log` |

#### D. Browser QA — production preview 4173 + DEV 5173

**24-case preview smoke** (`evidence-stage-e-smoke.json`, final build):

- **24/24** case `scrollWidth = innerWidth` ⇒ page overflow **0**; CSP warning **0**; page error **0**.
- Hero: đúng **1** video, `src=/media/homepage/hero-h3-2.mp4`, `paused=false`, `loop=false`, không có autoplay attr, `rate=1`, `muted=true`, canvas **0**.
- Race Center: **22** hàng kết quả ở các case có dữ liệu; Calendar: `R19 🇲🇽 MEXICO` + timer hiện diện.
- Reduced motion: hero chỉ poster (`img` naturalWidth 1920), 0 video, 0 canvas.
- Video bị chặn: `videoCount=0`, poster `hero-h3-2-poster.png` load đủ (naturalWidth **1920**), 0 canvas ⇒ **không fallback EDS-G01**.
- **2 case VI Results** có console `429 Too Many Requests`: đây là **pass-through từ upstream `api.jolpi.ca`**, không phải lỗi sản phẩm; preview log ghi `429 Too Many Requests (3ms)`; proxy local dedupe request đồng thời và cache 15 phút. Retest focused (`logs/stage-e/results-vi.log`): **22 hàng**, count **86**, 0 console error, 0 CSP, 0 failed, 0 overflow tại 100/200/400. UI có `c11-notice--stale` + empty state “no verified classification”, **không bịa hàng**.

**48-case zoom matrix** (`evidence-stage-e-zoom.json`, `logs/stage-e/zoom-matrix.log`): 390/1440 × EN/VI × 100/200/400 × 4 route ⇒ **48/48** page overflow **0**, schedule inner overflow **0**, CSP **0**, console error **0**.

**Intro & motion:**

- Intro mặc định: appeared 147 ms → removed 3.498 ms ⇒ **visible 3.351 ms** (~3,35 s); video đang phát trong intro (0,67 s).
- Escape tại ~400 ms sau DOMContentLoaded: appeared 118 ms → removed 602 ms, `introPresent=false`.
- Bàn phím: hero có 4 control tab được (`Explore the season`, `Open Showroom`, `Pause the film`, `Continue`); Enter pause → `paused=true`, Enter lại → `paused=false`; focus ring **2 px solid**. Results tab keyboard chọn `Constructor standings`; Calendar filters All/Completed/Upcoming = **23/18/5**, season **2026/2025/2024**, Next **R19**, timer “Lights out in”.
- Hero video hiện diện & phát ở **12/12** tổ hợp 390/1440 × EN/VI × 100/200/400 (`diag-video-presence`), 0 canvas mọi case.
- **DEV 5173**: 3 route — video phát (0,63 s), không `EDSHomeHeroScene`, 0 canvas, 0 console error/CSP/failed response, 0 overflow.

**Screenshots:** `scratch/ignition/p4/shots/stage-e/` — 16 PNG (hero playing/poster/reduced × 1440 EN & 390 VI, results/calendar hero + full, countdown 200% after). Before/after Homepage video của Stage A nằm ở `shots/hero-video/**` + `evidence-hero-video.json`; bộ Stage E là “after” trên final build.

#### E. Asset provenance & permanent locks (kiểm lại trong Stage E)

| Asset | Bytes | SHA-256 | Kiểm chứng |
|---|---|---|---|
| `public/media/homepage/hero-h3-2.mp4` | **1.761.848** | `FC9DE024…BD421` | `assetLocks.test.ts` + `check-public-boundary.mjs` (pinned) |
| `public/media/homepage/hero-h3-2-poster.png` | **866.844** | `98F88281…CC69` | `assetLocks.test.ts` |
| `public/logo/logo.png` | 246.326 | `226AB6F1…6ACD2` | `assetLocks.test.ts` |
| `public/logo/logo-compact.png` | 11.451 | `424A28BF…8176125` | `assetLocks.test.ts` |
| `public/models/eds-g01.glb` (gốc, không sửa) | 660.192 | `A9A1226D…8325` | tồn tại, **không** dùng cho artwork |
| `source-assets/models/model-b/model-b-eds-optimized-v1.glb` | 2.120.816 | `2D009166…610A2` | khớp hash đóng băng; DEV-only; **quyền thương mại/derivative BLOCKED** |
| Quarantine EDS-G01 artwork | **52 file / 3.271.860 B** | per-file | **52/52** SHA-256 khớp manifest; 0 runtime ref `/images/p4/` |

#### F. Performance / Web Vitals

Lab local của Stage D vẫn là số liệu hợp lệ gần nhất: LCP **176–604 ms**; CLS Results VI **0 / 0,00195 / 0,00180**, EN **0,02343**, Home VI **0,00224**, Home EN 1440 **0,00685**. Stage E **không** chạy lại Lighthouse, axe, INP field hay thiết bị thật ⇒ **G-3 vẫn PARTIAL**; không tuyên bố đạt target field.

#### G. Deployment boundary

- **Chưa có production deployment** — trạng thái **PENDING / NOT RUN**. Không có commit/push/CI run trong vòng này.
- Preview 4173 là local production build; DEV 5173 là Vite dev. “Production thực tế” **chưa được xác minh**.
- Hai nguồn dữ liệu tự động (AGENTS.md Stage 9) **NOT VERIFIED** trong vòng này vì không có push/CI run; 429 Jolpica ở trên là upstream trực tiếp, không phải pipeline theo lịch của project.

#### H. Gate status sau Stage E

| Gate | Trạng thái | Ghi chú |
|---|---|---|
| Homepage video | **RESTORED (local production preview)** | bytes/hash khớp; 12/12 playback; poster-only fallback; deployment **PENDING** |
| D-P4-11 / D-P4-12 | **CLOSED (lab)** | CLS 0–0,00195; count `—` → **86** |
| Home 400% | **CLOSED (browser)** | 48/48 zoom matrix 0 overflow |
| Home 200% (mới) | **CLOSED — D-P4-13** | 394 → **390**, schedule inner 0 |
| CSP font | **CLOSED** | 0 warning toàn bộ 24-case smoke + 48-case matrix |
| G-1 Layout/UX | **PASS** | 24-case smoke + 16 ảnh + keyboard/focus |
| G-2 Imagery | **PARTIAL** | vẫn schematic-only; chờ owner chọn A/B/C ở §13.29C |
| G-3 Web Vitals/field | **PARTIAL** | Lighthouse/axe/INP field/thiết bị thật **NOT RUN** |
| G-4 Engineering QA | **PASS** | lint/typecheck/**440** test/build/security/browser PASS |
| P5 | **LOCKED** | chưa mở |

#### I. Owner gate — việc cần owner quyết định

1. **Imagery P4** (§13.29C): chọn **A** (giữ schematic), **B** (duyệt project-authored vector artwork — đề xuất chính), **C** (cung cấp/duyệt asset có licence), **D** (Model B — **BLOCKED**), **E** (abstract helmet SVG — không khuyến nghị).
2. **Gate 4**: chấp nhận phạm vi Race Center + Calendar + Home hero hiện tại, hay yêu cầu changes.
3. **Deployment**: chỉ thực hiện ở vòng sau, sau khi có CI + xác minh **cả hai** pipeline dữ liệu.

**Quyết định của Stage E: HOLD — `HOMEPAGE VIDEO RESTORED + P4 FINAL OWNER REVIEW`.** Không thể là GO vì **G-2 PARTIAL** và deployment/pipelines **NOT RUN**. Không cleanup, commit, push, merge, deploy; P5 khóa.

## 13.31 P4 STAGE A — TEMPLATE-FIRST BLUEPRINT (01/11/2026)

**Status: BLUEPRINT RECORDED — no implementation change made when this section was written.** Source of truth: `references/ignition/PODIUM_EDS_IGNITION_All_Page_Mockups/PODIUM_EDS_IGNITION_Review/02_Race_Center.png` and `07_Calendar_Circuits.png` (both 1672×941). Each sheet is a three-frame review board: a desktop frame at x 0–843, a second desktop/tablet frame at x 855–1405, and a mobile frame at x 1415–1672 (Race Center only). Measurements below are taken from the desktop frame in sheet pixels and converted at **×1.71** to logical CSS pixels for a 1440-wide runtime. The mockup is a design target, not a data source: every figure, team, driver, weather value and result shown in it is illustrative and must never be copied into the runtime.

### A. Race Center (`02_Race_Center.png`) — section decomposition

| # | Section | Sheet geometry → logical | Composition, typography, colour | Mobile frame rule |
|---|---|---|---|---|
| RC-1 | Global nav | y 0–39 → 0–64 | Owned by global chrome; no P4 change | Existing mobile nav |
| RC-2 | Cinematic hero | y 39–248 → ~357 px tall, full width | Full-bleed sunset circuit photograph; left-to-right dark gradient for text; eyebrow mono 600 ~12 px tracking .22em amber; H2 Barlow Condensed 700 uppercase ~96–110 px, ivory + ignition accent; 2-line lede ~15 px; right-edge vertical caps “MORE THAN RACING / IT’S A LIFESTYLE”; car occupies right 55 % and must never be cropped to a corner badge | Photo remains full-width ~220 px tall; title ~44–52 px; vertical label hidden; lede clamps to 3 lines |
| RC-3 | Season + round rail | y 248–290 → 72 px; chips 78×42 → 133×72 | Rail sits on carbon with a hairline; left season control 2026 SEASON; 8 visible round chips, each R## / country / GP name / date, active R18 has ignition border, warm tint and 2 px underline; horizontal scroll, centre snap | Season select becomes full-width control; 3 chips visible; same 3-line content at 12/10/10 px; 44 px minimum target |
| RC-4 | Status legend | y 290–310 → 34 px | Completed / Current / Upcoming with small state glyphs; decorative colour never the only signal | Legend wraps under the rail |
| RC-5 | Round hero | y 310–470 → ~273 px; ivory spec rail 214 px wide | Photographic band of the venue atmosphere with dark left gradient; flag + ROUND 18 + race name 44 px; circuit name/country/date; white circuit outline over the right photo; ivory spec panel (#F4F0E8) with CIRCUIT LENGTH / TURNS / RACE DISTANCE / LAP RECORD in carbon text | Hero stacks: photo 150–170 px, copy below, outline inset, four specs in 2×2 grid; no ivory panel overlapping text |
| RC-6 | Session + view tabs | y 470–555 → 145 px total | Session tabs FP1…RACE in one scroll row, active = solid ignition, inactive = carbon; secondary view row underneath with RESULTS active outlined in ignition; both remain readable at 200 % | Session row scrolls with visible active tab; secondary view row only for views that exist |
| RC-7 | Classification | y 555–941+ → rows ~41 px | Section title in italic condensed “RACE RESULT”, subline “FINAL CLASSIFICATION · N LAPS”; right-side metadata chips only when verified; table: POS / # / DRIVER / TEAM / plus session-specific columns; top-3 position blocks gold-silver-bronze; circular driver tile; solid team-colour chip with readable text; tyre letter badge; tabular mono times | 5-row compact set (POS, #, DRIVER, TIME/GAP) inside its own scroll panel; “VIEW FULL RESULTS” style CTA pushes focus to the full table rather than hiding data |

### B. Calendar (`07_Calendar_Circuits.png`) — section decomposition

The right-hand frame (x 855–1405) is a **Circuit Explorer** concept. The directive forbids adding that route without owner approval, so it is excluded from scope; only its visual language (technical panel, corner photography, ivory data surfaces) may inform the calendar cards.

| # | Section | Sheet geometry → logical | Composition, typography, colour | Mobile rule |
|---|---|---|---|---|
| CL-1 | Cinematic hero | y 39–250 → ~360 px | Night street-circuit photograph, city skyline, left dark gradient; eyebrow “CHAMPIONSHIP 2026”; H2 “RACE CALENDAR” ivory + ignition, ~100 px; 2-line lede; season pills 2026 SEASON (solid ignition) / 2025 / 2024; “23 ROUNDS · MAR—DEC 2026” badge at the pill row’s right | Photo 220–250 px; title 44–52 px; pills wrap; round badge moves below pills |
| CL-2 | Body split | left 233 → 398 px; gap 22 px; main 943 px | Left rail and main column begin at the same top edge; rail is a bordered dark panel, main is a stack of bordered panels | Single column: Next Race → filters → round list |
| CL-3 | Filter row | 3 chips in one row | ALL (solid ignition with count) / COMPLETED / UPCOMING; 44 px targets; pressed state uses fill, not colour alone | Filters stay above the list, horizontally scrollable if needed |
| CL-4 | Round list | 23 rows × 53 px | Status dot, flag, GP name 15 px, date right-aligned mono; current row ignition left border + warm tint; completed rows de-emphasised; each row expands to schedule detail | Compact 48–56 px rows; same order and deep-link anchors |
| CL-5 | Next Race feature | y 250–500 → ~427 px | Venue photograph with left gradient; NEXT RACE eyebrow; R## + flag + country; race name Barlow 34 px; circuit + date; ignition CTA + outline secondary; right countdown panel “NEXT RACE STARTS IN” with 4 ivory/dark tiles (DAYS / HRS / MINS / SECS, tabular mono) | Image 180 px; copy over gradient; countdown 4 cells below copy; CTAs full width |
| CL-6 | Weekend schedule | y 500–650 → ~256 px; 5 equal cards | Header “RACE WEEKEND SCHEDULE” + “ALL TIMES LOCAL” style note (we use the user timezone); each card: session code, day/date, time range, state. **Weather is not in verified data and must not be invented** — replace weather icons with schedule state and timezone | 2×2 + 1 grid, then single column at 375 if labels wrap |
| CL-7 | Technical / ivory / editorial band | y 650–790; 3 columns | (a) circuit outline card with signal-coloured CTA; (b) ivory spec card: length / turns / distance / lap record; (c) editorial night-race photograph with copy and a link to the round | Stack: outline, ivory specs, editorial; editorial image 160 px |
| CL-8 | Previous / upcoming cards | y 790–941; 2 cards | Previous: race identity + top-3 verified rows + results CTA; Upcoming: race identity + date + status. Photographic crops distinguish completed from upcoming without changing data | Stacked; previous card keeps three verified rows only |

### C. Typography, colour and control-state contract

| Role | Token | Runtime rule |
|---|---|---|
| Display | Barlow Condensed 700, uppercase, line-height 0.92–1.0, tracking −0.015em | Hero, race names, section titles; italic only for the classification title |
| UI | Space Grotesk 600–700 | Tabs, buttons, chips, filters; minimum 12 px rendered at 100 % |
| Body | Manrope 400–500 | Ledes and descriptions; 15–17 px, line-height 1.55–1.6 |
| Numeric | IBM Plex Mono 500–600, tabular | Times, gaps, dates in the rail, countdown, spec values |
| Surfaces | carbon #0A0C10, graphite #0D1219, panel #121925, line #2F3947, ivory #F4F0E8 | No flat black blocks; each panel has a lit edge or gradient |
| Accents | ignition #FF4A18, racing red #E51B37, brake amber #FFB347, signal #B7FF37 (sparingly) | Active controls use ignition fill; focus ring remains amber and 2 px |
| Team identity | team palette via `getTeamIdentityStyle` | Solid or graded team chip with the team name always present; colour is supplementary (G-4) |
| Podium | gold #D6B25E, silver #C9CDD4, bronze #C98A5A | Position blocks for P1–P3 only; text contrast tested |
| States | default / hover / focus-visible / pressed / disabled / loading / empty / unavailable | Every state documented in CSS and exercised in Stage F; reduced motion removes transforms but not state colour |

### D. Mapping — `TEMPLATE ELEMENT → EXISTING COMPONENT → REQUIRED CHANGE → REQUIRED ASSET → QA EVIDENCE`

| Template element | Existing component | Required change | Required asset | QA evidence |
|---|---|---|---|---|
| RC hero photograph + oversized title | `WeekendResults.tsx` `.rc-hero` / `.rc-hero-copy` | Replace gradient-only panel with layered `<picture>` background; raise H2 scale; move stats into a bottom glass strip; keep copy max 46 ch | ART-RC-HERO (21:9 + 4:5) | F-RC-01 hero at 6 viewports × VI/EN |
| Round chip identity | `.rc-round-chip` | Add GP short name + date lines; widen to 7.5–8.5 rem; keep 44 px target, scroll snap, edge fades | none | F-RC-02 rail overflow 0, active chip visible on load |
| Round hero photograph + ivory specs | `.rc-round-hero`, `.rc-round-visual`, `.rc-round-facts` | Add atmosphere photo layer + gradient; move circuit outline over photo; convert facts to ivory panel on desktop and 2×2 grid on mobile | ART-RC-VENUE-* (one plate per circuit archetype) | F-RC-03 round switch, mobile stack, 0 overlap |
| Session tabs | `.c11-session-tabs` | Keep behaviour; active solid ignition; sticky stack unchanged | none | F-RC-04 keyboard Arrow/Home/End + focus ring |
| Classification header | `.c11-classification-meta` | Italic display title, laps/description subline, provenance chips; no weather chips | none | F-RC-05 source/provenance labels visible |
| Classification rows | `.c11-table` | Podium blocks; driver monogram tile; team chip; tyre badge; mono alignment; sticky first columns on mobile | none (monograms generated from initials, not portraits) | F-RC-06 22 rows, contrast, horizontal scroll, 400 % |
| Calendar hero photograph | `ChampionshipCalendar.tsx` `.cal-hero` | Replace schematic card with cinematic night plate; title/pills/round badge overlays | ART-CAL-HERO (21:9 + 4:5) | F-CAL-01 6 viewports × VI/EN |
| Filter + round rail | `.cal-filters`, `.c1-rounds` | Keep routes/filters; compact rows with status dot/flag/name/date; current row ignition edge | none | F-CAL-02 `?view=` deep link, counts 23/18/5 |
| Next Race feature | `.cal-next` | Photo background, left copy, right countdown, dual CTA; no fabricated weather | ART-CAL-NEXT (3:2) | F-CAL-03 countdown/timer, CTA route |
| Weekend schedule | `.c1-session-list` | Promote to five cards with session code, day/date, time range, timezone note, state | none | F-CAL-04 five cards, VI/EN, 200 % |
| Technical band | `.cal-detail-top`, `.cal-detail-specs` | Add ivory spec surface + atmosphere editorial card; outline stays labelled illustrative | ART-CAL-EDITORIAL (4:3) | F-CAL-05 illustrative caption present |
| Previous / upcoming | none | New verified cards built from `calendar` and `getRaceResults`; previous shows three real rows only | ART-RC-VENUE-* reuse | F-CAL-06 no fabricated rows |

### E. Asset system (Stage B target)

| Slot | Subject | Aspect / widths | Source rule | Failure mode |
|---|---|---|---|---|
| ART-RC-HERO | Generic open-wheel race car, sunset permanent circuit, no logos/text/real team livery | 21:9 → 2560/1920/1280 AVIF+WebP; 4:5 crop for mobile | Generated for this project in-session; model-free; no EDS-G01 or Model B | Dark ignition gradient remains legible |
| ART-CAL-HERO | Generic night street circuit, skyline, light trails | 21:9 → same ladder; 4:5 mobile | Same | Same |
| ART-RC-VENUE-FOREST / STREET / DESERT / MODERN | Venue-atmosphere plates without identifiable circuit branding | 16:9 → 1600/1080/720 | Same | Panel keeps carbon gradient + outline |
| ART-CAL-NEXT | Night city/waterfront atmosphere for the Next Race feature | 3:2 → 1200/800 | Same | Countdown panel remains readable |
| ART-CAL-EDITORIAL | Night race detail, sparks/brake glow, no car identity | 4:3 → 1000/640 | Same | Editorial card keeps text layout |

Every asset carries `alt=""` + `aria-hidden` when purely atmospheric, sits behind a gradient with no text baked in, and is labelled “Editorial artwork · illustrative” where it could be mistaken for the real venue. No image is required to understand data.

### F. Motion map (Stage E target)

| Moment | Motion | Duration / easing | Guard |
|---|---|---|---|
| Hero entrance | copy 0.35→1 + 18 px rise; image 1.04→1 scale | 560 ms, out(4), 60 ms stagger | reduced motion = static |
| Rail entry | chip 0.4→1 + 10 px rise, 30 ms stagger, capped at 12 chips | 380 ms | no animation on later scrolls |
| Round/session change | outgoing/incoming copy 240 ms fade; circuit dash 900 ms | createScope revert before replay | skip if hidden tab |
| Classification rows | 24 ms stagger, max 12 rows, opacity + 6 px rise | 420 ms | tabular layout never animates width |
| Calendar reveals | hero, Next Race, rail rows in three groups | 480–560 ms | IntersectionObserver optional; no scroll-jacking |
| Hover/focus | border/underline/translate 1 px; CTA arrow 2 px | 120–160 ms CSS | focus-visible always instant ring |
| Loading → verified | countdown `—` → value, state chip cross-fade | 200 ms | aria-busy preserved |

No continuous loop, no WebGL, no animated blur/box-shadow on large surfaces; at most two scopes alive; every scope reverts on unmount.

### G. Explicit exclusions and anti-fabrication rules for this round

1. No **Circuit Explorer route**, tabs or track-map page: the right-hand calendar frame is reference only.
2. No **weather chips** (Dry/28 °C etc.), lap-chart or stint data: these are not in the verified payload. Calendar cards show session time and state instead.
3. No **driver portraits**, team logos or sponsor marks: classification uses monograms and team-name chips; this is a rights-driven difference from the mockup and will be reported in Stage F.
4. No **official track map** claim: every circuit outline keeps the “illustrative, not an official FIA map” caption.
5. No **fabricated classifications** for upcoming rounds; previous-race cards render only verified rows and otherwise show a truthful empty state.
6. No **EDS-G01, Model B or derivative artwork**; all imagery is independent, model-free and generated for this project with a provenance record.
7. Homepage video, official logo, ITM animation, Results Engine, routes/deep links and F1 data stay untouched.

**Blueprint result: READY for Stage B.** Implementation may only begin after this section exists, and no item may be marked complete until Stage F shows it in a real browser screenshot.

## 13.32 P4 STAGE B–H — TEMPLATE-FIRST EXECUTION, VISUAL MATCH VÀ OWNER REVIEW (01/11/2026)

**Status: `QA_READY / OWNER_REVIEW / HOLD` — Gate 4 chưa APPROVED.** Section này thay thế mọi ghi chú rời rạc của Stage F–H; §13.31 vẫn là blueprint gốc. Toàn bộ số đo dưới đây lấy từ bản build cuối cùng sau hai fix CSS của vòng này, không phải từ log cũ.

### A. Đã thực thi trong vòng này

| Stage | Nội dung | Bằng chứng |
|---|---|---|
| B | 8 role artwork độc lập, model-free (không EDS-G01, không Model B), AVIF q52 + WebP q80, nhiều width | `docs/asset-manifests/p4-template-artwork.json`; `apps/web/public/images/p4/template/` — **44 file / 3.653.197 B** |
| C | Race Center: hero photographic + H2 105,6 px, rail 23 round, round hero + ivory spec rail, 22 hàng classification, team chip có tên đội | `WeekendResults.tsx`, `championshipC11.css` |
| D | Calendar: hero night plate, Next Race R19 + countdown, 5 session card, technical/ivory/editorial band, previous/upcoming card | `ChampionshipCalendar.tsx`, `championshipC1.css` |
| E | Anime.js **4.5.0** `createScope`: `data-rc-reveal` (8 node) và `data-cal-group` (6 nhóm), reduced-motion → static | `WeekendResults.tsx:485`, `ChampionshipCalendar.tsx:427` |
| F | 24 capture VI/EN × 6 viewport + crop từng section | `scratch/ignition/p4/shots/stage-f/` — **165 PNG** |
| G | Toàn bộ gate kỹ thuật + browser + zoom + provenance + asset lock | `scratch/ignition/p4/logs/stage-g/`, `logs/stage-h/` |
| H | Cập nhật chính plan này, không tạo tài liệu song song | file này |

Không có route mới (`/circuits` vẫn không tồn tại), không đổi API, không đổi dữ liệu, không đụng Model B, ITM, Results Engine hay Homepage video.

### B. Stage F — ma trận capture

**24/24 case sạch**: 0 overflow ngang, 0 console error, 0 page error, 0 request lỗi, toàn bộ ảnh load xong, Race Center **22 hàng** ở cả 12 capture RC, Calendar **23 hàng rail** ở cả 12 capture CAL.

| Viewport | RC docH EN / VI | CAL docH EN / VI |
|---|---|---|
| 375×812 | 5.788 / 5.778 | 7.503 / 7.429 |
| 390×844 | 5.812 / 5.774 | 7.477 / 7.411 |
| 768×1024 | 4.636 / 4.619 | 6.920 / 6.883 |
| 1024×768 | 2.710 / 2.956 | 3.894 / 3.871 |
| 1440×900 | 2.701 / 2.771 | 2.502 / 2.506 |
| 1920×1080 | 2.701 / 2.771 | 2.508 / 2.512 |

### C. Fidelity từng section — `ORIGINAL TEMPLATE | ACTUAL RUNTIME | VISUAL DIFFERENCES`

Số template lấy từ §13.31 (đã quy đổi ×1,71 về px CSS ở 1440); số runtime đo trên production preview (`127.0.0.1:4176`) ở 1440×900 nếu không ghi khác.

| # | ORIGINAL TEMPLATE | ACTUAL RUNTIME | VISUAL DIFFERENCES |
|---|---|---|---|
| RC-2 | Band ảnh sunset cao ~357 px, H2 96–110 px, xe chiếm 55 % phải, nhãn dọc mép phải | Band **392 px**, H2 **105,6 px** (1 dòng EN, **2 dòng VI = 182 px → hero 462 px**), ảnh 1336×399 (`rc-hero-1792.avif`), nhãn dọc không dựng | Ảnh là artwork độc lập không có xe/đội thật (rights); VI cao hơn EN **+70 px** nhưng 0 overflow; mobile hero 397 px, H2 43,5 px |
| RC-3 | Rail 72 px, chip 133×72, 8 chip, active ignition + underline 2 px | Rail **94 px**, chip **134×74**, 23 chip trong rail cuộn, active ignition + underline | Chip cao hơn 2 px do 3 dòng GP/date; mobile chip 118×74; scroll-snap giữ nguyên |
| RC-4 | Legend 34 px | Legend trạng thái đầy đủ dưới rail | Không khác biệt đáng kể |
| RC-5 | Round hero 273 px, panel spec ivory 214 px | **273 px** ở 1440 (483 px @768, 407/393 px @390), ivory rail 4 spec, outline đè ảnh | Rail ivory hẹp hơn template ở 1024–1280 → label/value xếp dọc (D-P4-19); mobile không còn panel chồng chữ |
| RC-6 | Session + view tab ~145 px | Sticky block **149 / 146 / 136 px** (1440 / 768 / 390) | Sticky ở 100 %, trở thành static ở 200/400 % để tránh chiếm viewport (chủ ý) |
| RC-7 | Hàng ~41 px, top-3 podium, tile tài xế, chip đội, badge lốp | Hàng **49 / 59 / 82 px** (1440/768/390), **22 hàng**, **3 podium**, **44 team chip**, **0 badge lốp** | Không có portrait/tile mặt người (rights) → dùng monogram; **không có badge lốp** vì payload không có dữ liệu lốp (không bịa); mobile xếp card thay vì 5 hàng compact |
| CL-1 | Hero đêm ~360 px, H2 ~100 px, pill mùa + badge 23 rounds | Hero **366 px** (372 @1920), H2 **81,2 px** (83,7 @1920; 52,8 @768; 43,2 @390) | Title nhỏ hơn template ~19 %; pill/badge giữ đủ; mobile hero 698 px do stack ảnh + copy |
| CL-2 | Rail trái 398 px + main 943 px | Rail **392 px** + main **857 px** ở 1440 | Lệch 6/86 px so với blueprint, cùng top edge; mobile đơn cột |
| CL-3 | 3 filter chip, ALL solid ignition | ALL / COMPLETED / UPCOMING = **23 / 18 / 5**, `?view=` deep link | Không khác biệt |
| CL-4 | 23 hàng × 53 px | **23 article** `.c1-round` trong rail cuộn (đo 23/23 ở cả 12 capture CAL) | Hàng gọn hơn template; current row có viền ignition |
| CL-5 | Next Race ~427 px, countdown 4 ô ivory | **430 px** (648 @768, 679 @390), 4 ô countdown, CTA kép | Không khác biệt; countdown là dữ liệu thật |
| CL-6 | 5 card đều nhau ~256 px, **có weather** | **5 card** trong block 180 px (398 @768, 643 @390), **không weather** | Thiếu hàng thời tiết theo §13.31G.2 → block thấp hơn ~76 px; state/time/timezone thay thế |
| CL-7 | 3 cột: outline / ivory spec / editorial | Band 295 px: outline + ivory spec + editorial **359×293** (`cal-editorial-640.avif`) | Editorial là artwork độc lập, có caption “illustrative”; outline vẫn ghi không phải bản đồ FIA |
| CL-8 | 2 card previous/upcoming | **2 card**, 241 px (647 px khi stack @768/390) | Card previous chỉ render hàng đã xác minh, nếu không có thì empty state trung thực (O-P4-05) |

**Kết luận fidelity:** cấu trúc, phân cấp typography, surface ivory và photographic layer đã đạt template; các khác biệt còn lại đều thuộc ba nhóm có lý do: (1) rights — không portrait/logo/sponsor/venue thật; (2) dữ liệu — không weather/lốp/lap chart; (3) mobile — bảng đầy đủ thay vì 5 hàng compact. Không có section nào còn là “dark panel + viền cam + SVG line” thuần schematic.

### D. Stage G — engineering gates (chạy lại trên source cuối)

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| ESLint | **PASS** — 0 error, 15 warning tồn tại từ trước | `logs/stage-h/lint.log` |
| TypeScript | **PASS** — 0 error toàn workspace | `logs/stage-h/typecheck.log` |
| Unit/integration | **PASS — 444 test** (426 web / 73 file + 16 API + 2 security) | `logs/stage-h/tests.log` |
| Build production | **PASS** — 7,67 s; `index-D6VPtg8P.js` **629,49 kB** (gzip **91,12 kB**); `index-DrTsZVlq.css` 183,86 kB (gzip 29,29 kB) | `logs/stage-h/build.log` |
| SEO / prerender | 72 route, `indexing=false`, 4 Engineering article prerender | cùng log build |
| Commercial isolation | **PASS** — 114 artifact file, 73 EDS asset gốc | cùng log build |
| Cloudflare build output | **PASS** (`dist/client`) | cùng log build |
| Secret scan | **PASS** | `logs/stage-h/secrets.log` |
| Public asset boundary | **PASS** | `logs/stage-h/assets.log` |
| Dependency audit | 0 high/critical, **12 moderate** (dev tooling) | `logs/stage-h/audit.log` |
| Wrangler dry-run | **PASS** | `logs/stage-h/dry-run.log` |

### E. Stage G — browser evidence

| Hạng mục | Kết quả |
|---|---|
| Zoom matrix preview | **10 page case × 3 mức = 30 phép đo** (RC/CAL × 1440/768/390 × EN/VI, 100/200/400 %): 0 overflow trang, 0 phần tử bị cắt, 0 console/page error, 0 request lỗi. Tab `nowrap` + scroll nội bộ ở 100/200 %, wrap ở 400 % nhưng trang vẫn 0 overflow; sticky → static ở 200/400 % |
| Ivory spec rail | **7 view × 3 mức = 21 phép đo**: nền `rgb(244,240,232)` ở mọi view, 0 overflow/clip/error; rail cao 173 px (1440), 225 px (1280/1024), 183 px (768/390) |
| Contrast ivory | carbon `#0A0C10` trên `#F4F0E8` = **17,22:1**; label `#4A5563` = **6,67:1**; span `#39424E` = **8,95:1** |
| Fixed width 1024–1280 | `dt` **161 / 167 px**, `wrap: normal`, **1 dòng** (trước fix: 21–52 px, `anywhere`, 3 dòng); 1440/1920 không đổi |
| Keyboard / focus | Right → Qualifying, End → FP1, Home → Race; ring `rgb(255,179,71) solid 2px`, offset 3 px |
| Reduced motion | transition `1e-05s`, scroll `auto`, toàn bộ group tĩnh (opacity 1, transform none) |
| Lab Web Vitals (preview) | RC 1440 CLS **0,0044** / LCP 412 ms; CAL 1440 0,0054 / 200 ms; RC 390 **0,0276** / 324 ms; CAL 390 0,001 / 336 ms → CLS max **0,0276**, LCP **156–412 ms** |
| Provenance ảnh | Chỉ `/images/p4/template/*` và `/logo/*`; 0 host ảnh ngoài; 0 tham chiếu `/images/p4/cinematic` |
| Route smoke | 6 route trả 200, 0 console/page error |

### F. Asset lock — xác minh lại sau toàn bộ thay đổi

| Asset | Kích thước | SHA-256 | Trạng thái |
|---|---|---|---|
| Homepage video `hero-h3-2.mp4` | 1.761.848 B | `FC9DE024…BD421` | Không đổi byte |
| Homepage poster | 866.844 B | `98F88281…CC69` | Không đổi byte |
| Logo chính | 246.326 B | `226AB6F1…36ACD2` | Không đổi |
| Logo compact | 11.451 B | `424A28BF…8176125` | Không đổi |
| EDS-G01 gốc (quarantine-source) | 660.192 B | `A9A1226D…8325` | Không đổi |
| Model B optimized | 2.120.816 B | `2D009166…610A2` | Không đổi, vẫn DEV-only |
| Quarantine EDS-G01 artwork | **52 file / 3.271.860 B** | manifest per-file | **52/52 khớp**, chưa xoá |

Artwork mới **không** phải derivative: không dùng EDS-G01, không dùng Model B, không ảnh bên thứ ba — manifest ghi rõ origin và từng output.

### G. Defect ledger của vòng template-first

| ID | Severity | Mô tả | Trạng thái |
|---|---|---|---|
| D-P4-14 | P4 | Nhánh fallback của weekend card (`ChampionshipCalendar.tsx:748-753`) có thể render chuỗi chỉ gồm dấu `·` nếu session thiếu `dateStr`/`timeStr` | **OPEN (thấp, phụ thuộc dữ liệu)** — payload R19 hiện tại điền đủ **5/5** card ở EN và VI; không tái hiện trong 24 capture |
| D-P4-15 | P4 | `rc-round-copy h3` dùng italic 800 + uppercase, trong khi contract §13.31C dành italic cho tiêu đề classification | **OPEN (quyết định thẩm mỹ)** — giữ theo ngôn ngữ display của mockup; chờ owner chốt |
| D-P4-16 | P3 | `typographyContract.test.ts` bắt nhầm `data-compound="inter"` (hợp chất lốp) như font Inter cũ | **FIXED** — regex chỉ còn khớp trong khai báo `font`/`font-family`; 444 test PASS |
| D-P4-17 | P3 | Test `sessionCountSettling` vỡ khi khối khởi tạo bị re-indent | **FIXED** — khôi phục đúng indent dự định, không nới lỏng assertion |
| D-P4-18 | P2 | Spec rail của round hero dùng panel tối thay vì surface ivory như template | **FIXED + VERIFIED** — ivory `#F4F0E8`, 17,22:1, 21 phép đo 0 overflow |
| D-P4-19 | P2 | Ở 1024–1280 px, cột rail ~192–198 px làm label gãy giữa từ (“RACE DISTANC/E”, “LAP REC/ORD”) | **FIXED + VERIFIED** — container query 46–80 em xếp label/value dọc, `dt` 161/167 px 1 dòng, có contract test |

### H. Observations (không phải defect, cần owner biết)

| ID | Nội dung |
|---|---|
| O-P4-01 | Khối round + session tab sticky nằm trên round hero khi cuộn — chủ ý để đổi chặng/phiên luôn với tới; ở 200/400 % tự chuyển static |
| O-P4-02 | Hero VI “TRUNG TÂM KẾT QUẢ.” xuống **2 dòng**: hero 462 px vs EN 392 px tại 1440 và 1920; 0 overflow, 0 cắt chữ; ở 390 px hai ngôn ngữ đều 397 px |
| O-P4-03 | Không có weather chip, badge lốp, chế độ xem hay portrait — do dữ liệu/rights, đúng exclusions §13.31G |
| O-P4-04 | Mobile giữ **đủ 22 hàng** classification (card xếp dọc) thay vì 5 hàng compact; bảng 768 px rộng 851 px trong khung cuộn ngang 702 px |
| O-P4-05 | Card previous-race hiển thị empty state trung thực khi chặng chưa có phân hạng đã xác minh |
| O-P4-06 | Ở 390 px, full-page capture có thêm block “PODIUM EDS / Home” cao 633 px — đó là `.r1-mobile-hub__placeholder` của kiến trúc mobile all-in-one; viewport tự cuộn tới `#giai-dau` nên người dùng không thấy |
| O-P4-07 | Production preview không có backend → snapshot **85** session kèm notice stale; DEV settle **86**. Đây là hành vi đã thiết kế, không phải sai lệch dữ liệu |

### I. Gate 4 matrix

| Gate | Kết quả | Ghi chú |
|---|---|---|
| G-1 Layout/UX | **PASS** | 24/24 capture + 30 phép đo zoom + keyboard/focus/reduced motion |
| G-2 Imagery | **PASS** | 8 role / 44 file artwork độc lập, manifest provenance, caption illustrative, contrast đạt |
| G-3 Web Vitals/field | **PARTIAL** | Lab CLS ≤ 0,0276 và LCP ≤ 412 ms đạt; **Lighthouse, axe scan, INP field, thiết bị thật: NOT RUN** |
| G-4 Engineering QA | **PASS** | lint/typecheck/444 test/build/security/audit/dry-run PASS |
| Deployment | **NOT RUN** | Chưa commit/push/merge/deploy |
| Data pipeline 1 & 2 | **NOT RUN** | Chưa kiểm tra sau release |
| D-P1-02 CSP | **CLOSED** (từ §13.29) | 0 CSP warning trong toàn bộ lượt đo của vòng này |
| Home 400 % (P3) | **CLOSED** (từ §13.29) | 0 overflow ở 390/1440 × EN/VI |

### J. Owner cần quyết định

1. **Gate 4**: chấp nhận hướng template-first hiện tại (Race Center + Calendar + artwork độc lập) hay yêu cầu changes — cụ thể là hero VI 2 dòng (O-P4-02), round hero italic/uppercase (D-P4-15) và mobile giữ đủ 22 hàng (O-P4-04).
2. **Artwork baseline**: duyệt 8 role / 44 file model-free trong `docs/asset-manifests/p4-template-artwork.json` làm chuẩn P4, hoặc yêu cầu thay plate.
3. **Phạm vi đo còn thiếu**: có cần chạy Lighthouse/axe/INP/thiết bị thật trước khi bàn giao hay chấp nhận để ở vòng deployment.
4. **Deployment**: vẫn khoá cho tới khi có CI và xác minh **cả hai** pipeline dữ liệu.

**Quyết định của Stage G/H: HOLD — `P4 TEMPLATE-FIRST VISUAL + FUNCTIONAL OWNER REVIEW`.** Không thể GO vì **G-3 PARTIAL** và deployment/pipelines **NOT RUN**. Không cleanup, commit, push, merge, deploy; P5 khoá.

## 13.33 P4 STAGE I — OWNER ACCEPTANCE SET, LOCAL MEASUREMENT VÀ `P4 READY FOR OWNER APPROVAL` (01/11/2026)

**Status: `P4 READY FOR OWNER APPROVAL` — đây là bản trình owner, KHÔNG phải owner approval.** Vòng này thi hành đúng REVISION 1.4.8: không redesign, không tạo artwork mới, không đụng logo / Homepage video / Model B / EDS-G01 / Inside the Machine. Mọi thay đổi source chỉ để đóng lỗi đo được.

### A. Đối chiếu yêu cầu owner (1.4.8)

| Mục | Yêu cầu | Kết quả |
|---|---|---|
| A1 | Giữ **8 role / 44 file** artwork hiện tại làm baseline ứng viên | **Không tạo file artwork nào.** Manifest `docs/asset-manifests/p4-template-artwork.json` vẫn **44 file / 3.653.197 B**, cùng role/use/origin; 0 file bị thay hay xoá |
| A2 | Hero VI được phép 2 dòng khi phù hợp; mobile reflow theo nội dung | VI 1440: heading **2 dòng / 182 px**, hero **462 px**; EN 1440: **1 dòng**, hero **392 px**; 390: cả hai **397 px / 1 dòng / 43,5 px**; 0 cắt chữ, 0 overflow. Giữ nguyên, không ép 1 dòng |
| A3 | Round Hero phải theo phân cấp/viết hoa của `02_Race_Center.png`; không sửa cho đẹp contract | Đối chiếu mockup: “ROUND 18 / **SPA-FRANCORCHAMPS**” là uppercase, condensed, italic. UI hiện tại `.rc-round-copy h3` **52,8 px (1440) / 28,8 px (390), italic, uppercase, 800** → **giữ nguyên**; D-P4-15 đóng theo hướng *mockup thắng contract*, không sửa UI |
| A4 | Kiểm D-P4-14: không còn dấu `·` lẻ khi thiếu ngày/giờ | **Đã sửa + xác minh.** Rail mở rộng R17: 5/5 session có giờ định dạng, `dots=0`, `isolatedDot=0`, overflow 0 ở VI và EN (`logs/stage-i/cal-detail.json`) |
| A5 | Không đổi logo, Homepage video, Model B, EDS-G01, core ITM | 0 file asset bị sửa. Hash kiểm lại trong `assetLocks.test.ts` (pass trong 445 test) và tại §13.32F; không có commit/deploy |

### B. Thay đổi source trong vòng này

| File | Thay đổi | Lỗi đóng |
|---|---|---|
| `ChampionshipCalendar.tsx` | Thay nội suy `${dateStr} · ${timeStr}` bằng `fallbackTime` có `.trim().filter(Boolean).join(' · ')`; nếu rỗng → “Chưa có giờ xác nhận / Time to be confirmed” | D-P4-14 |
| `championshipC1.test.tsx` | Contract test bổ sung `fallbackTime`, cấm lại hai mẫu nội suy cũ | D-P4-14 |
| `championshipC11.css` | `.c11-session-tabs button { position: relative }` trong block ≤760 px (comment nêu rõ containing block) | D-P4-21 |
| `index.css` | Thêm mặt italic cho hai fallback font với `size-adjust: 83%` / `70.5%` (không đổi font chính, không đổi CSP) | D-P4-22 |
| `cspFontContract.test.ts` | Assert mặt italic mới để không bị xoá âm thầm | D-P4-22 |
| `WeekendResults.tsx` | Tab phiên dùng `aria-label` = mã hiển thị + tên đầy đủ (`Q — Qualifying`, `FP1 — Practice 1`, `Race`) để accessible name không lặp; round chip không đặt `aria-label`, tên lấy từ text + `sr-only` | D-P4-20 |
| `championshipC1.css` | Bỏ `opacity: 0.72` trên số đếm filter đang chọn | D-P4-23 |

Không đổi route, API, dữ liệu, Model B, ITM, Results Engine; không thêm dependency.

### C. Acceptance set (owner mục B)

| Thành phần | Nội dung | Đường dẫn |
|---|---|---|
| Runtime screenshots | **60 ảnh**: 4 run (1440×900 và 390×844 × VI/EN) × 15 (viewport, full-page, 5 crop RC, 6 crop CAL) | `scratch/ignition/p4/shots/stage-i/runtime/` |
| Crop từng section | **48 file** (hero, rail, round hero, spec rail, classification, table, next race, weekend, band, editorial, cards) | cùng thư mục, index `logs/stage-i/stage-i-crops.json` |
| Comparison sheets | **6**: RC desktop EN/VI, RC mobile EN/VI, CAL desktop EN/VI | `shots/stage-i/compare/` |
| Calendar mobile comparison | **NOT AVAILABLE** — mockup chỉ có frame mobile cho `02_Race_Center.png`; không dựng frame giả | — |
| Motion video | `stage-i-interaction.webm` — **17,00 s, 1280×720, 5.146.328 B**, WebM/EBML | `shots/stage-i/video/` |
| Mockup nguồn | `02_Race_Center.png`, `07_Calendar_Circuits.png` (crop, chỉ dùng ở cột trái) | `shots/stage-i/mockup/` |

**Build của acceptance set:** ảnh/video chụp trên bundle `index-uPFVBEKM.js` (22:24); source sau đó chỉ đổi `aria-label` của tab phiên và reflow whitespace, rebuild ra `index-DEoggqlp.js` với CSS không đổi — pixel giống hệt. Axe và probe accessible name được chạy lại trên build cuối `index-DEoggqlp.js`.

**Phương pháp chụp:** ảnh tĩnh dùng `animations: "disabled"` để lấy **trạng thái cuối**; nếu không, full-page capture rơi vào giữa reveal của Anime.js và làm tối cả section (đã phát hiện, đã chụp lại toàn bộ). Chuyển động được đánh giá bằng video, không bằng ảnh tĩnh. **Ảnh mockup không được dùng làm ảnh runtime**; mỗi composite ghi rõ nhãn trái/phải và kích thước runtime.

### D. Fidelity theo từng khu vực — `ORIGINAL TEMPLATE | ACTUAL RUNTIME | DIFFERENCES`

**Race Center (`02_Race_Center.png`, 1440):**

| Khu vực | Template | Runtime (đo) | Khác biệt còn lại |
|---|---|---|---|
| Hero | Band ảnh sunset, H2 ~96–110 px, xe chiếm phải | Hero **392 px EN / 462 px VI**, H2 **105,6 px**, artwork độc lập + scrim, tagline phải | Không có xe/đội thật (rights); VI 2 dòng → cao hơn 70 px (A2 chấp nhận) |
| Round rail | 8 chip + season pill | **23 chip** trong rail cuộn, chip **134×74**, active ignition + underline | Nhiều chip hơn mockup (đủ mùa), chip cao +2 px do 3 dòng |
| Round hero | Ảnh đường đua + bản đồ + spec panel tối | **273 px**, outline schematic + ivory spec rail **228×173**, 4 spec | Không có ảnh venue/bản đồ FIA thật; ivory theo D-P4-18 |
| Session tab | 7 tab | 5 tab theo dữ liệu (FP1–Race), sticky **149 px** | Số tab theo dữ liệu thật |
| Classification | Race result ~20 hàng, podium, ảnh tài xế, lốp | **22 hàng** (Qualifying mặc định trên route acceptance), **22 team chip**, **0 tyre badge**, không portrait | Không portrait/lốp (rights + không có dữ liệu lốp); race tab trong preview chỉ có **3 hàng verified** kèm notice — xem O-P4-08 |
| Footer | — | Giữ nguyên footer toàn site | Không thuộc P4 |

**Calendar (`07_Calendar_Circuits.png`, 1440):**

| Khu vực | Template | Runtime (đo) | Khác biệt còn lại |
|---|---|---|---|
| Hero | Ảnh đêm, H2 ~100 px, pill mùa + badge 23 rounds | Hero **366 px**, H2 **81,2 px**, pill 2026/2025/2024 + “23 ROUNDS · MAR–DEC 2026” | H2 nhỏ hơn ~19 %; thêm hàng timezone/R19 (chức năng) |
| Rail | 398 px + main 943 px | Rail **392 px** + main **857 px**, **23 hàng**, filter **23/18/5** | Lệch 6/86 px; hàng gọn hơn template |
| Next Race | Ảnh Singapore + countdown 4 ô | Card **857×430**, R19 Mexico City + countdown thật + CTA kép | Ảnh venue thật không có (rights) → editorial artwork có caption “illustrative, not the venue” |
| Weekend | 5 card **có weather** | **5 card**, block 295 px band / card 180 px, **không weather** | Không có dữ liệu thời tiết → bỏ hẳn, không bịa; block thấp hơn ~76 px |
| Band | Bản đồ + spec + editorial | Outline + ivory spec (4.304 km / 17 turns) + editorial **359×293** | Outline ghi rõ “not an official FIA map”; spec theo dữ liệu verified |
| Previous/Upcoming | 2 card có recap podium | **2 card**, previous hiển thị empty state verified-podium | Trung thực theo dữ liệu (O-P4-05) |

**Mobile (390):** hero RC 397 px, rail chip 118×74, full 22 hàng dạng card, spec rail 183 px; Calendar hero **675–698 px** do stack artwork + copy, Next Race 679 px, weekend 643 px, band 632 px, 0 overflow. Mockup mobile chỉ có cho RC; **không tự đánh dấu 100 % fidelity** — các khác biệt trên đều thuộc rights / dữ liệu / kiến trúc (Championship Hub header) / mật độ mobile.

### E. Đo lường local (owner mục C)

**Lighthouse 12.8.2, Chromium 1243, gzip preview `127.0.0.1:4177`, preset desktop/mobile mặc định — chạy lần cuối trên build `index-DEoggqlp.js` (`lh5-*.json`):**

| Run | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| RC 1440 | **97** | 97 | 100 | 66 | **1,2 s** | **0,001** | 90 ms |
| RC 390 | 73 | 97 | 100 | 66 | **5,0 s** | 0,092 | 290 ms |
| CAL 1440 | **97** | 97 | 100 | 66 | **1,2 s** | **0,001** | 90 ms |
| CAL 390 | 65 | 97 | 100 | 66 | **5,7 s** | **0,001** | 560 ms |

- **LCP desktop PASS**; **LCP mobile FAIL so với mục tiêu ≤2,5 s** — hero render client-side + artwork lớn trên CPU throttling 4×; không có regression so baseline 5,8–6,0 s nhưng **không được ghi PASS**. Perf mobile 73 (RC) / 65 (CAL) là **đo local, không phải cam kết field**; không có field INP, không thiết bị thật → **NOT RUN**.
- CLS đạt ngưỡng ≤0,1 ở cả 4 run; bộ đo riêng (`cls-after.json`) cho CLS max **0,0281**, LCP 152–756 ms, long task max **332 ms**, 0 overflow ở 10 tổ hợp đo.
- **SEO 66** là do local build đặt `indexing=false` (SEO artifacts 72 route), không phải lỗi metadata P4.
- A11y 97: audit fail còn lại là **toàn cục, có từ trước** — `label-content-name-mismatch` trên 2 nút ngôn ngữ header (`VI`/`EN` với aria-label “Tiếng Việt/English”) và `color-contrast` **3,73:1** trên CTA “Open 3D Showroom” (`#fff` trên `#ff2a2a`, 14 px bold) của mobile hub.

**axe-core 4.10.2 (8 trang: RC/CAL × desktop/mobile × VI/EN):** mobile **0 violation**; desktop **3 `target-size`** trên chevron điều hướng header (21×64 px) — ngoài bề mặt P4; `color-contrast` trả **incomplete** vì nền gradient nên không tự động kết luận.

**Zoom text 200 % / 400 %:** **24/24 tổ hợp** (1440/1024/390 × VI/EN × RC/CAL) có `scrollWidth == innerWidth`, 0 phần tử bị cắt do layout; rail/tab giữ scroll nội bộ, sticky chuyển static ở 200/400 %. D-P4-21 là lỗi duy nhất phát hiện: 390/200 % rộng **544 px**, gốc là 5 span `sr-only` absolute thoát khỏi scroll container của tab; sửa bằng positioned ancestor, về đúng **390 px**.

**Keyboard / focus:** 18 bước tab trên RC, ring `rgb(255,179,71) solid 2px`, offset 3 px, không có bẫy focus; tab phiên chuyển bằng Arrow/Home/End; filter Calendar đổi `aria-pressed` + số hàng **5/18/23** và giữ focus; Escape đóng classification modal (1 → 0). Focus sau khi đóng deep-linked modal là `BODY` vì không có trigger — ghi O-P4-09.

**Reduced motion:** `data-motion-engine="static"`, 0 group/reveal ở trạng thái ẩn, transition ~0 s, scroll `auto`.

**Asset loading / kích thước:** 4–5 ảnh mỗi trang, **0 ảnh lỗi/chưa load**; hero `rc-hero-1792.avif` natural **1440×822** render **1310×391** (không upscale, đúng tỉ lệ), `venue-street-1600.avif` 1440×822 → 1310×272, logo 800×298 → 97×36 / 118×44.

**Hydration:** Qualifying **22 hàng**, 22 team chip, 0 tyre badge, nguồn “OpenF1 API /v1/session_result snapshot”; Race **3 hàng** + 2 notice (summary-only và refresh-failed snapshot) — dữ liệu thật, UI công bố rõ, không bịa.

### F. Defect ledger cập nhật

| ID | Severity | Mô tả | Trạng thái |
|---|---|---|---|
| D-P4-14 | P4 | Chuỗi `·` lẻ khi session thiếu ngày/giờ | **CLOSED** — guard `fallbackTime` + contract test; runtime 0 isolated dot VI/EN |
| D-P4-15 | P4 | `rc-round-copy h3` italic/uppercase khác “contract” §13.31C | **CLOSED (quyết định)** — mockup 02 là chuẩn; giữ UI, hạ ràng buộc contract, không sửa để đẹp checklist |
| D-P4-20 | P2 (a11y) | `label-content-name-mismatch` / tên accessible lặp trên tab phiên & round chip | **FIXED** — chip bỏ override; tab dùng `aria-label` chứa mã hiển thị + tên đầy đủ; axe mobile **0**, probe `ariaSnapshot` sạch (`Race`, `Q — Qualifying`, …) |
| D-P4-21 | P2 | 390/200 % tràn ngang **154 px** do sr-only absolute thoát scroller | **FIXED + VERIFIED** — `position: relative`; 24/24 zoom sạch, doc 544 → 390 |
| D-P4-22 | P2 | VI RC desktop CLS **0,1479** do fallback italic không khớp metric | **FIXED + VERIFIED** — mặt italic `size-adjust` 83/70,5 %; CLS 0,0066; contract test |
| D-P4-23 | P3 | Số đếm filter active chỉ **4,11:1** do `opacity: 0.72` | **FIXED** — bỏ opacity; **5,82:1** trên `#ff4a18` |
| D-P4-24 | P3 | Prettier reflow dòng khởi tạo `sessionCountSettled` làm guard `sessionCountSettling.test.ts` fail (test đọc source string) | **CLOSED** — khôi phục layout gốc, không sửa test; full suite **445/445** trên source cuối |

**Observations mới:**

| ID | Nội dung |
|---|---|
| O-P4-08 | Trong production preview (không backend), tab **Race** chỉ có **3 hàng** verified + notice “verified summary only / refresh failed”, trong khi **Qualifying** có 22 hàng. Là giới hạn snapshot dữ liệu, UI công bố trung thực; không sửa dữ liệu, không suy diễn thêm hàng |
| O-P4-09 | Đóng classification modal mở bằng deep-link trả focus về `BODY` (không có trigger để trả về). Cần xử lý nếu owner muốn focus về heading/tab khi đóng |
| O-P4-10 | Lỗi a11y toàn cục ngoài P4: 2 nút ngôn ngữ header (label-in-name) và CTA mobile hub 3,73:1; 3 chevron header 21 px. Không sửa trong P4 để giữ scope, chờ owner quyết |
| O-P4-11 | Full-page screenshot phải chụp với `animations: "disabled"`; nếu không, trạng thái giữa reveal làm ảnh trông tối và **không đại diện** runtime |
| O-P4-12 | Nhãn filter Calendar là **11,52 px** (700, uppercase, letter-spacing 0.05 em) — dưới mốc 12 px đã áp cho nhãn Explore ở P3; tương phản đạt 5,82:1 và không có ngưỡng WCAG về cỡ chữ, nhưng nếu owner muốn đồng nhất 12 px thì đây là thay đổi CSS 1 dòng |

### G. Gate 4 matrix (cập nhật)

| Gate | Kết quả | Ghi chú |
|---|---|---|
| G-1 Layout/UX | **PASS** | 60 ảnh + 6 composite + 24 phép đo zoom + keyboard/focus/reduced motion; 0 overflow/cắt |
| G-2 Imagery | **PASS** | 8 role / 44 file model-free, provenance, caption illustrative, không dùng mockup làm runtime |
| G-3 Web Vitals/field | **PARTIAL** | Lab desktop PASS (LCP 1,2 s, CLS ≤0,092); **LCP mobile 5,0–5,7 s FAIL mục tiêu**; field INP/thiết bị thật **NOT RUN** |
| G-4 Engineering QA | **PASS** | Xem §H — lint/typecheck/**445 test**/build/security/audit/dry-run trên source cuối |
| Deployment | **NOT RUN** | Không commit/push/merge/deploy |
| Data pipeline 1 & 2 | **NOT RUN** | Chưa chạy sau release |

### H. Re-run kỹ thuật trên source cuối (01/11/2026)

| Gate | Kết quả | Log |
|---|---|---|
| ESLint | **PASS** — 0 error, **15 warning tồn tại từ trước** | `logs/stage-i/final/lint.log` |
| TypeScript | **PASS** — 0 error toàn workspace | `final/typecheck.log` |
| Unit/integration | **PASS — 445 test** (427 web/73 file + 16 API + 2 security) | `final/tests.log` |
| Build | **PASS** — **8,44 s**; `index-DEoggqlp.js` **629,49 kB** (gzip **91,12 kB**); `index-XPn6YxVT.css` **184,16 kB** (gzip 29,30 kB); SEO 72 route; commercial isolation PASS; Cloudflare output PASS | `final/build.log` |
| Secret / asset boundary | **PASS** | `final/secrets.log`, `final/assets.log` |
| Dependency audit | 0 high/critical, **12 moderate** (dev tooling) | `final/audit.log` |
| Wrangler dry-run | **PASS** | `final/dry-run.log` |

### I. Quyết định của Stage I

**`P4 READY FOR OWNER APPROVAL`.** Visual review không còn lỗi thiết kế đáng kể nào chưa xử lý; các khác biệt còn lại đều có lý do rights / dữ liệu / mobile / kiến trúc và đã ghi rõ. **Không tự đánh dấu 100 % fidelity**, **không coi đây là owner approval**, **không tự đánh dấu `P4 CLEANUP_VERIFIED`**, **không commit, push, merge, deploy, không mở P5**.

**Owner cần quyết định:** (1) `APPROVED P4` hay changes — đặc biệt O-P4-08 (race 3 hàng trong preview), O-P4-10 (a11y toàn cục), hero VI 2 dòng; (2) có chấp nhận G-3 PARTIAL với LCP mobile 5,0–5,7 s ở local P4 gate hay buộc tối ưu trước; (3) duyệt baseline 8 role / 44 file.

**Sau khi owner nói `APPROVED P4`:** lập CLEANUP_MANIFEST cho artifact tạm, bảo vệ source/logo/video/model/baseline, xoá phần được phép, chạy lại QA, rồi mới ghi `P4 CLEANUP_VERIFIED` và mở P5.

## 13.34 P4 DESIGN FIRST — TEMPLATE-FIDELITY CORRECTIONS, ACCEPTANCE IMAGERY VÀ `P4 DESIGN OWNER REVIEW` (01/11/2026)

**Status: `P4 DESIGN OWNER REVIEW` — đây là bản trình owner để đánh giá thiết kế, KHÔNG phải `APPROVED P4`, KHÔNG phải release approval.** Vòng này thi hành owner override **“PODIUM EDS — OWNER OVERRIDE: DESIGN FIRST”**: ưu tiên số 1 là tái tạo 7 template IGNITION (cinematic imagery, bảng màu carbon/orange/red/ivory, typography/hierarchy/composition, desktop/mobile, motion/hover, 3D khi phù hợp), **không thay ảnh chất lượng cao bằng schematic để tối ưu performance**, và **không mở vòng Lighthouse/LCP/CLS/INP/bundle size mới trong P4–P7**.

### A. Đối chiếu chỉ đạo owner (DESIGN FIRST)

| # | Chỉ đạo | Cách thi hành trong vòng này |
|---|---|---|
| A1 | **HIGHEST PRIORITY — STOP PERFORMANCE-DRIVEN DEVELOPMENT** | Không chạy Lighthouse/Web Vitals mới, không đổi asset để đạt điểm; chỉ lint/typecheck/test/build/browser smoke cơ bản. Các số Lighthouse Stage I (§13.33E) giữ nguyên là **lịch sử đo**, không tái chuẩn hóa và không dùng để chặn nghiệm thu thiết kế |
| A2 | So sánh runtime với `02_Race_Center.png` và `07_Calendar_Circuits.png`; sửa hình ảnh, màu sắc, tỷ lệ, typography, composition | Đối chiếu pixel/ảnh mockup → sửa spec rail, scrim/grade ảnh, classification, composition Calendar (§B–C) |
| A3 | Hoàn thiện animation và hover states | Ken Burns có gate `data-motion-engine="animejs"` + `prefers-reduced-motion`; hover scale ảnh editorial/racecard, hover session card, trace glow, row hover; video tương tác 17,60 s |
| A4 | Kiểm tra desktop/mobile bằng ảnh thật; chuẩn bị bộ ảnh nghiệm thu | **62 PNG** (60 acceptance + 2 reduced-motion), **6 composite** mockup-vs-runtime, 1 video; mockup không dùng làm ảnh runtime |
| A5 | Không thay ảnh chất lượng cao bằng schematic; giữ artwork model-free hiện có | Không tạo/thay/xóa file artwork; manifest vẫn **44 file / 3.653.197 B**; không dùng EDS-G01, Model B, ảnh/logo đội hay F1 |
| A6 | Bảo vệ logo, Homepage video, Model B optimized, Inside the Machine | 0 file asset bị sửa trong vòng này; `assetLocks.test.ts` pass trong 445 test; không có thay đổi ITM/showroom |
| A7 | Cập nhật chỉ `docs/IGNITION_MASTER_PLAN.md`; không commit/push/merge/deploy/chuyển phase | Chỉ file này được sửa trong docs; source thay đổi giới hạn ở P4 CSS/tooling; dừng tại `P4 DESIGN OWNER REVIEW`, P5 khóa |

### B. Thay đổi source trong vòng này

| File | Thay đổi | Lý do thiết kế |
|---|---|---|
| `apps/web/src/components/championship/ChampionshipView.tsx` | Thêm class `c1-calendar-active` vào root khi tab Calendar đang chọn | Cho phép ẩn phần intro “Championship Hub” trên Calendar giống mockup 07 mà **vẫn giữ h1 trong DOM** cho screenreader/SEO |
| `.../championshipC11.css` | **Round spec rail → dark carbon glass**: `linear-gradient(180deg, rgb(23 33 42 / .9), rgb(10 16 22 / .92))` trên `#0f1920`, border ivory 16 %, `backdrop-filter: blur(5px)`; dt `#93a1b0`, dd ivory; scrim venue nhẹ hơn + radial warm; `.rc-round-img` `object-position: center 64%`, `filter: saturate(1.12) contrast(1.04) brightness(1.12)`; classification rows `#0c1219`/`#0a0f15` với team edge/chip; rank plate vàng/bạc/đồng `[data-podium="1/2/3"]`; hover team-tinted | Mockup 02 dùng panel kính carbon tối, không phải ivory; ảnh venue cần lộ skyline/mặt đường ướt; table mockup là carbon + team chip + plate kim loại, không phải full-row wash |
| `.../championshipC1.css` | Hero/next-race `filter` sáng hơn, scrim nhẹ hơn + radial warm; `.cal-hero-img` grade; spec cells `linear-gradient(180deg, #18222c, #0e151d)` trên `#1d2732`; session card hierarchy (time 1.35 rem, meta rõ), hover `#141e2a` + ring; hover scale ảnh editorial/racecard; trace glow; Ken Burns gated cho hero + next-race | Mockup 07 dùng ảnh đêm sáng, spec cell tối, card session rõ thứ bậc; tăng cảm giác cinematic mà không đổi dữ liệu |
| `.../championshipC11.test.tsx` | Contract test của spec rail đổi từ **ivory** sang **dark glass** (assert `rgb(23 33 42 / 0.9)`, cấm ivory trên nền rail, vẫn assert dd ivory) | Test cũ mã hóa premise sai của D-P4-18; **sửa kỳ vọng theo mockup**, không xóa/không hạ coverage |
| `scratch/ignition/p4/stage-i-acceptance.cjs` | Ảnh tĩnh dùng `reducedMotion: "reduce"`; mobile viewport focus đúng section; crop ẩn fixed chrome + unstick controls; đo `podium`, spec background, motion engine | Ảnh nghiệm thu phải là **trạng thái cuối**, không dính overlay/giữa reveal; tránh artifact của element crop dài hơn viewport |
| `scratch/ignition/p4/stage-i-composites.cjs` | Xuất composite sang `shots/design-review/compare/` | Tách bộ ảnh owner review khỏi evidence cũ |
| `scratch/ignition/p4/stage-i-responsive-smoke.cjs` | Mới: smoke 375/768/1440 × EN/VI × RC/CAL, 200 % text zoom, keyboard tab | Bằng chứng responsive/keyboard cơ bản, lưu JSON |

Không đổi route, API, dữ liệu, Results Engine, Model B, ITM, dependency hay asset. Không có `git add/commit/push/merge/deploy`.

### C. Sửa fidelity theo mockup (trước → sau)

| Khu vực | Mockup 02/07 | Trước vòng này | Sau vòng này | Khác biệt còn lại |
|---|---|---|---|---|
| RC spec rail | Panel kính carbon tối, số liệu ivory | Nền ivory (D-P4-18) | Nền `rgb(15,25,32)` + blur 5 px; đo **228×181** desktop / **149×183** mobile; dd ivory | Chữ dt/dd đúng hướng mockup; không có bản đồ FIA thật |
| RC round hero | Ảnh venue đêm + schematic | Ảnh bị tối, crop cao, khó thấy phố | Crop `center 64%`, sáng hơn (saturate 1.12/contrast 1.04/brightness 1.12); skyline Singapore + phản chiếu đường ướt rõ; round hero **273 px** desktop / **393–407 px** mobile | Không dùng ảnh venue thật/FIA map (rights) — schematic ghi rõ “not an official FIA map” |
| RC classification | Hàng carbon, team chip, plate podium kim loại | Full-row team wash 15–23 % gây nhiễu | Hàng `#0c1219`/`#0a0f15`, team edge + chip, plate 1/2/3 vàng-bạc-đồng, hover team-tinted; đo **22 hàng**, **3 podium**, **22 chip**, **0 tyre badge** | Không portrait tay đua/lốp (rights + không có dữ liệu lốp); Race tab preview chỉ 3 hàng verified (O-P4-08) |
| Calendar composition | Không có intro “Championship Hub” | Intro hiển thị trên Calendar | h1 **1×1 px** (visually hidden, vẫn trong DOM) khi `c1-calendar-active` | Không đổi nội dung/heading, chỉ composition |
| Calendar hero / Next Race | Ảnh đêm sáng, gradient ấm | Scrim tối, ảnh chìm | Grade sáng hơn, scrim nhẹ + radial `rgb(255 96 32 / .16)`; hero **366 px** desktop / **675–698 px** mobile; Next Race **857×430** / **324×679** | Next race R19 Mexico theo dữ liệu 01/11/2026, mockup minh họa Singapore; không có weather (không có dữ liệu) |
| Calendar spec cells | Ô tối, số ivory | Nền tối thiếu tương phản | `linear-gradient(rgb(24,34,44), rgb(14,21,29))`, dt `#93a1af`, dd ivory | Giữ metric thật 4.304 km / 17 turns |
| Session cards | 5 card có thứ bậc giờ/ngày/trạng thái | Card mờ, meta nhỏ | Time 1.35 rem, meta `#a9b5c2`, day `#d4dde7`, hover `#141e2a` + ring, live glow; 5 card | Mockup có weather; repo không có dữ liệu nên không bịa |
| Motion/hover | Chuyển động nhẹ, hover rõ | Chỉ reveal cơ bản | Ken Burns 28–30 s alternate **chỉ** khi `data-motion-engine="animejs"` và `no-preference`; hover scale 1.035; trace glow; row hover | Giảm chuyển động: static, 0 group/reveal ẩn (đo được) |

**Correction record:** **D-P4-18 (ivory spec rail) bị đảo theo bằng chứng mockup.** Pixel sampling panel spec trong `02_Race_Center.png` là `rgb(15,25,32)`, `rgb(34,46,50)`, `rgb(19,20,21)`; mockup cũng dùng table carbon. Vì vậy D-P4-18 được ghi **CORRECTED — mockup thắng premise cũ**; test contract được viết lại có chủ đích, không xóa test.

### D. Bộ ảnh nghiệm thu

| Thành phần | Nội dung | Đường dẫn |
|---|---|---|
| Runtime screenshots | **62 PNG**: 60 acceptance shot (4 run × 15 = 4 × [viewport + full-page + 5 crop RC + 6 crop CAL]) + 2 reduced-motion still | `scratch/ignition/p4/shots/design-review/runtime/` |
| Element crops | **44 PNG** trong 60 shot: RC hero/rail/round hero/classification/spec rail; CAL hero/next/weekend/band/editorial/cards; VI + EN, desktop + mobile | cùng thư mục |
| Comparison sheets | **6 composite**: RC desktop EN/VI, CAL desktop EN/VI, RC mobile EN/VI; cột trái mockup, cột phải runtime có nhãn | `scratch/ignition/p4/shots/design-review/compare/` |
| Calendar mobile comparison | **NOT AVAILABLE** — `07_Calendar_Circuits.png` không có mobile frame; không dựng frame giả | — |
| Motion video | `p4-design-interaction.webm` — **17,60 s, 1280×720, 5.895.487 B**, WebM/EBML; click filter Calendar + đổi round/session RC | `scratch/ignition/p4/shots/design-review/video/` |
| Measurement logs | `design-review-acceptance.json` (4 run, overflow, spec style, podium, motion engine), `final/` (lint, typecheck, tests, build, secrets, assets, responsive-smoke) | `scratch/ignition/p4/logs/design-review/` |

**Phương pháp chụp:** ảnh tĩnh dùng context **reduced-motion** để lấy trạng thái cuối (static engine), không chụp giữa reveal; video dùng motion mặc định để đánh giá animation. Với **element crop**, harness ẩn fixed header/scroll-progress và chuyển sticky controls sang static **chỉ trong phạm vi crop** để không dính chrome vào pixel; **full-page shot giữ nguyên chrome thật**. Mobile full-page vẫn chứa `r1-mobile-hub__placeholder` có sẵn ở đầu route `/season/2026` (P2/P3, ngoài P4); vì vậy ảnh **viewport mobile** được focus đúng section P4 và là ảnh đại diện. Không dùng mockup làm ảnh runtime, không tuyên bố 100 % fidelity.

### E. QA cơ bản (đúng phạm vi owner duyệt)

| Gate | Kết quả | Log |
|---|---|---|
| ESLint | **PASS** — 0 error, **15 warning tồn tại từ trước** | `logs/design-review/final/lint.log` |
| TypeScript | **PASS** — 0 error toàn workspace | `final/typecheck.log` |
| Unit/integration | **PASS — 445/445 test** (427 web/73 file + 16 API/3 + 2 security/1; 77 file) | `final/tests.log` |
| Build | **PASS — 7,91 s**; entry `index-CN9SQfcd.js` **629,49 kB** (gzip **91,13 kB**); CSS `index-XPn6YxVT.css` **184,16 kB** (gzip **29,30 kB**); commercial isolation PASS; Cloudflare output PASS | `final/build.log` |
| Secret / asset boundary | **PASS** | `final/secrets.log`, `final/assets.log` |
| Responsive smoke | **12/12 tổ hợp** (375×812, 768×1024, 1440×900 × EN/VI × RC/CAL): **0 overflow**, **0 console/page error**, đủ section chính, 22 hàng RC / 5 card CAL; **200 % text zoom 0 overflow**; keyboard `QUALIFYING → SPRINT RACE` bằng ArrowRight | `final/responsive-smoke.json` |
| Acceptance runs | **4/4 run, 60 shot**: overflowX **0**, 0 page/console/request error, motion engine `static`, **0** reveal/group ẩn, podium `["1","2","3"]` | `design-review-acceptance.json` |
| Lighthouse / axe / Web Vitals | **NOT RE-RUN** theo owner override — không mở vòng performance mới; số Stage I (§13.33E) chỉ là lịch sử, mobile LCP 5,0–5,7 s **vẫn không phải PASS** | — |
| Deployment / data pipelines / cleanup | **NOT RUN** | — |

### F. Gate 4 matrix dưới DESIGN FIRST

| Gate | Kết quả | Ghi chú |
|---|---|---|
| Template fidelity / composition | **PASS (review)** | 6 composite + 62 ảnh; các khác biệt còn lại là rights/dữ liệu/kiến trúc, đã liệt kê ở §C |
| Image quality | **PASS** | Artwork model-free hiện có, không thay bằng schematic, không tạo asset mới; 0 ảnh lỗi trong 4 run |
| Colour / typography / hierarchy | **PASS (review)** | Carbon/orange/red/ivory; H2 RC **105,6 px**, CAL **81,22 px** desktop; mobile **43,5/43,2 px**; round h3 **52,8/28,8 px** giữ theo mockup |
| Animation / hover | **PASS** | Video 17,60 s + hover CSS; reduced-motion static, 0 ẩn |
| Mobile visual quality | **PASS (review)** | 390/375: 0 overflow, 200 % zoom 0, ảnh viewport focus section; mockup chỉ có frame mobile cho RC |
| G-3 Web Vitals | **NOT RE-RUN** | Theo owner override không chặn nghiệm thu thiết kế khi site dùng bình thường; **release vẫn HOLD** |
| G-4 Engineering cơ bản | **PASS** | Lint/typecheck/445 test/build/secret/assets/smoke |
| Deployment + pipelines | **NOT RUN** | Không commit/push/merge/deploy |
| Cleanup | **NOT RUN** | Chờ `APPROVED P4` |

### G. Quyết định và bước tiếp theo

**Quyết định của vòng này: `HOLD` tại `P4 DESIGN OWNER REVIEW` — chờ owner đánh giá thiết kế.** Đây không phải GO, không phải owner approval, không phải `P4 CLEANUP_VERIFIED`, không mở P5. Các khác biệt còn lại (portrait/lốp/venue thật/FIA map/weather/Circuit Explorer/R19 Mexico vs concept Singapore) đều có lý do rights, dữ liệu hoặc scope và **không được tự đánh dấu 100 % fidelity**.

**Owner cần quyết định:** (1) `APPROVED P4` hay changes cho Race Center/Calendar; (2) xác nhận correction **D-P4-18** (dark glass thay ivory); (3) có chấp nhận các khác biệt rights/dữ liệu ở §C hay yêu cầu thay artwork; (4) sau approval: cleanup an toàn + basic re-QA, rồi mới ghi `P4 CLEANUP_VERIFIED` và mở P5.

**Observation mới:**

| ID | Nội dung |
|---|---|
| O-P4-13 | Element crop dài hơn viewport từng dính fixed chrome/scroll-progress và sticky controls vào pixel; harness đã ẩn/unstick **chỉ cho crop**, full-page giữ chrome thật. Không phải lỗi runtime |
| O-P4-14 | Mobile full-page `/season/2026` chứa `r1-mobile-hub__placeholder` (“Home / Open homepage”) ở đầu route — thành phần hub có sẵn từ P2/P3, ngoài scope P4; ảnh viewport đã focus đúng section |

## 13.35 RACE CENTER VENUE HERO — ẢNH ĐỊA ĐIỂM THEO GRAND PRIX, `RACE CENTER VENUE HERO OWNER REVIEW` (02/11/2026)

**Status: `RACE CENTER VENUE HERO OWNER REVIEW` — bản trình owner để đánh giá thiết kế, KHÔNG phải `APPROVED P4`, KHÔNG phải release approval, KHÔNG phải `P4 CLEANUP_VERIFIED`.** Vòng này thi hành owner correction ngày 02/11/2026: **nền hero Race Center phải là ảnh địa điểm/venue gắn với Grand Prix đang chọn**, không phải nền tối trừu tượng, đường sáng minh họa hay texture chung. Ảnh trở thành **nền tảng thị giác**; title, round/country metadata, verified status, circuit outline và spec panel tiếp tục nằm **trên** ảnh. Không mở vòng tối ưu performance; không đổi Homepage video, logo, model rules, Results Engine hay hành vi sticky/classification.

### A. Đối chiếu chỉ đạo owner

| # | Chỉ đạo | Cách thi hành |
|---|---|---|
| A1 | Map mỗi race/round được hỗ trợ sang ảnh venue phù hợp | Registry **23/23** circuit của calendar 2026; runtime capture xác nhận **23/23** round có ảnh, `data-venue-photo="true"`, 0 ảnh lỗi |
| A2 | Ảnh phải là motorsport destination thật, cinematic editorial; không phải glowing road/abstract/dark texture | Toàn bộ 23 hero dùng ảnh chụp thật từ Wikimedia Commons (venue, circuit hoặc cảnh quan gắn trực tiếp); không dùng EDS-G01, Model B, ảnh AI, ảnh đội/sponsor, FIA map hay template plate làm nền |
| A3 | Giữ title, metadata, verified status, circuit outline, spec panel; ảnh là nền | `WeekendResults.tsx` chỉ thay lớp media của `.rc-round-hero`; title/kicker/meta/availability/trace/spec rail giữ nguyên cấu trúc và dữ liệu |
| A4 | Desktop + mobile crop | Desktop landscape **1600×900** (AVIF/WebP 960 + 1600); mobile portrait **900×1200** (AVIF/WebP 600 + 900); `<picture>` đổi nguồn tại `max-width: 46em` |
| A5 | Scrim giữ legibility nhưng không bóp ảnh về gần đen | Scrim 3 lớp chỉ ở vùng cần thiết; đo transmission **0,44–0,60** trên 4 state; ảnh Sepang ban ngày rõ ràng, Marina Bay ban đêm vẫn thấy skyline/mặt nước — state tối nhất được ghi risk để owner đánh giá |
| A6 | Không regress Homepage video, logo, protected model rules, Results Engine/verified data, sticky controls, classification | Video/poster/logo hash test PASS; 0 canvas/EDS-G01 trong homepage; 22 hàng + 3 podium R17; R16 giữ empty-state đúng dữ liệu; sticky wrapper đo **142 px** desktop / **64 px** mobile; 0 overflow/0 error |
| A7 | Chỉ cập nhật `docs/IGNITION_MASTER_PLAN.md`; dừng tại owner review, không commit/push/merge/deploy | Chỉ plan được sửa trong docs; source thay đổi giới hạn ở venue registry + hero markup + CSS + guard test; dừng tại **RACE CENTER VENUE HERO OWNER REVIEW**, P5 khóa |

### B. Nguồn ảnh, licence và provenance

- **23 ảnh / 184 file runtime / 25.619.187 B** tại `apps/web/public/images/p4/venues/`; mỗi venue có 8 output: landscape 1600/960 + portrait 900/600, mỗi kích thước AVIF + WebP. File lớn nhất **576.570 B** (`red-bull-ring-land-1600.webp`); desktop 1600 AVIF **34.076–320.772 B** (median 162.117 B), 1600 WebP **51.520–576.570 B** (median 291.376 B).
- Giấy phép: **9 CC BY-SA 4.0, 5 CC BY-SA 3.0, 2 CC BY-SA 2.0, 1 CC BY-SA 2.5, 3 CC BY 2.0, 1 CC0, 2 Public domain**. Nguồn: Wikimedia Commons; mỗi item lưu title, pageid/description, artist/credit, license + licenseUrl, source page/URL, master SHA-256 và SHA-256 từng output trong `scratch/ignition/p4/venue-heroes/venue-heroes.json`.
- Mỗi hero hiển thị dòng credit thật: `Photo: <tác giả> · <giấy phép> · Wikimedia Commons`; tác giả và giấy phép là link (source page + licence), `target="_blank" rel="noreferrer"`. Public-domain không có licenseUrl thì tên giấy phép là text, vẫn có link source. Credit dùng chung cho VI/EN (tiền tố `Ảnh`/`Photo`).
- Không thêm manifest vào `docs/` trong vòng này vì owner yêu cầu chỉ sửa master plan; provenance đầy đủ nằm trong scratch manifest nêu trên và được kiểm bằng test.
- Các ảnh tiêu biểu: **Sepang** — ảnh qualifying tại Sepang International Circuit (Craig, Public domain), thỏa ví dụ owner; **Marina Bay** — skyline vịnh Marina ban đêm (Ong Chi Hang, CC BY-SA 3.0), round mặc định R17; **COTA** — hoàng hôn tại Circuit of the Americas (Steve from Austin, CC BY-SA 2.0); **Madrid** — skyline Madrid (Barcex, CC BY-SA 3.0, không phải ảnh circuit); **Monaco, Baku, Las Vegas, Lusail** — cảnh đêm đô thị/venue.

### C. Thay đổi source

| File | Thay đổi |
|---|---|
| `apps/web/src/utils/venueHeroes.ts` | Registry 23 venue ↔ circuitId, place, credit, license/licenseUrl, sourcePage; helper `venueHeroFor` và `venueHeroSrcSet` cho AVIF/WebP landscape/portrait |
| `apps/web/src/components/championship/WeekendResults.tsx` | `.rc-round-hero` thêm `data-venue`/`data-venue-photo`; `<picture class="rc-round-media" aria-hidden="true">` với mobile/desktop sources; `<img class="rc-round-img" alt="" loading="eager" decoding="async" width=1600 height=900>`; credit block; fallback template plate giữ nguyên cho circuit không map |
| `apps/web/src/components/championship/championshipC11.css` | Ảnh `object-position: center`, grade nhẹ `saturate(1.02) contrast(1.02)`; scrim 3 lớp cho ảnh thật; scrim portrait mobile; credit grid + link focus-visible 2 px `#ff6a00`; fallback scrim nặng hơn chỉ khi `data-venue-photo="false"` |
| `apps/web/src/config/p4AssetCompliance.test.ts` | Guard cũ yêu cầu `public/images/p4` đúng `["template"]`; cập nhật có chủ đích thành `["template","venues"]` **và thêm test mới**: đúng 23 venue, credit/license/sourcePage hợp lệ, đúng 184 output theo registry, không tên `eds-g01`/`cinematic`. Không xóa/không hạ coverage; `p4AssetCompliance` **8/8** PASS |
| `scratch/ignition/p4/venue-heroes/*` | Script fetch/process/capture/verify/smoke + master images + manifest; không phải runtime |

Không đổi route, API, dữ liệu 2026, Results Engine, Model B/ITM, Homepage video/poster, logo, intro hay dependency. Không có `git add/commit/push/merge/deploy`.

### D. Bằng chứng runtime và độ hiện diện của ảnh

| Thành phần | Nội dung | Đường dẫn |
|---|---|---|
| Runtime acceptance | **8 state**: R17 Marina Bay (round đang chọn) + R16 Sepang (ví dụ owner); desktop 1440×900@1 và mobile 390×844@2; VI + EN; reduced-motion final state | `scratch/ignition/p4/shots/venue-hero-review/runtime/` |
| State shots | **20 ảnh** (viewport + hero crop × 8; EN thêm raw diagnostic × 4); title 1 dòng mọi state; hero **1310×273** desktop / **348×423–429** mobile | cùng thư mục |
| All-rounds | **23 ảnh** desktop EN `round-01…round-23` + contact sheet **669.936 B**; **23/23** `venuePhoto=true`, `complete=true`, overflowX 0, 0 lỗi | `venue-hero-all-rounds-desktop.jpg` |
| Before/after | Composite desktop **233.989 B** + mobile **634.604 B**: BEFORE là “night street atmosphere” minh họa/đường sáng; AFTER là ảnh venue thật | `venue-hero-before-after-desktop-en.jpg`, `venue-hero-before-after-mobile-en.jpg` |
| Visibility diagnostics | Scrim-only vs raw-full cho R17/R16 × desktop/mobile: transmission **0,60 / 0,60 / 0,49 / 0,44**; near-black thô trước scrim **1,7 % / 6,4 % / 0,3 % / 0,2 %** | `veh-*-scrim-only.png`, `veh-*-raw-full.png`, JSON |
| Zoom | 200 %: hero 1398×1001, title 1 dòng, credit không cắt, overflowX 0; 400 %: hero 1414×2041, title 1 dòng, credit không cắt, overflowX 0 | `veh-zoom200/400-R17-desktop-en*.png` |
| Sticky/classification smoke | **4/4 state** (R17/R16 × desktop/mobile × EN/VI): wrapper sticky top **142 px / 64 px** sau scroll; R17 **22 hàng + 3 podium**; R16 **0 hàng + empty-state đúng dữ liệu**; 0 overflow/0 console/page/request error | `veh-final-smoke-*.png`, `logs/venue-hero-review/venue-hero-final-smoke.json` |
| Homepage lock | 621 ms: 1 video, 0 canvas, 1920×1080, 1,517 s, muted, rate 1, no loop/autoplay; 3.039 ms: 0 video + poster opacity 0,507; 0 error; logo 800×298; no EDS-G01 mention | `home-video-lock-playing/ended-1440-en.png`, acceptance JSON |

**Đo “ảnh có thật sự hiện diện”:** vùng ảnh cuối (che UI) R17 desktop mean **29,9**, mobile **24,0**, near-black **35 % / 50 %**; Sepang desktop mean **54,9**, mobile **64,5**, near-black **5,1 % / 0,5 %**. Scrim-only so với raw cho thấy scrim chỉ truyền **44–60 %** độ sáng, không xóa nội dung. **R17 là ảnh đêm**: skyline, ánh đèn và mặt nước vẫn nhìn thấy trong ảnh hero, nhưng 50 % pixel gần đen trên mobile là đặc trưng ảnh đêm + scrim — **owner cần đánh giá độ tối này**, không được ghi PASS tuyệt đối. Sepang ban ngày là bằng chứng rõ nhất cho yêu cầu “real motorsport destination, not abstract dark background”.

**Phương pháp:** ảnh tĩnh dùng context reduced-motion để lấy trạng thái cuối; crop hero ẩn chrome chỉ trong phạm vi crop; viewport/full-page giữ chrome thật. Ảnh trước/sau lấy từ baseline design-review trước đó và runtime mới, không chỉnh nội dung ảnh. Không dùng mockup làm ảnh runtime, không tuyên bố 100 % fidelity.

### E. QA cuối trên source hiện tại

| Gate | Kết quả | Ghi chú |
|---|---|---|
| ESLint | **PASS** — 0 error, **15 warning tồn tại từ trước** | Chạy lại sau khi sửa guard test |
| TypeScript | **PASS** — 0 error toàn workspace | `tsc --noEmit` trong build |
| Unit/integration | **PASS — 446 test** (428 web/73 file + 16 API/3 + 2 security/1) | `p4AssetCompliance` **8/8**, `assetLocks` **3/3** |
| Build | **PASS — 8,29 s**; entry `index-BB-mRl5e.js` **629,49 kB** (gzip **91,13 kB**); CSS `index-XPn6YxVT.css` **184,16 kB** (gzip **29,30 kB**); SEO 72 route; commercial visual isolation PASS (32 module / 114 artifact); Cloudflare output PASS (4 Engineering article) | Local production preview `127.0.0.1:4176` |
| Secret / public boundary | **PASS** — secret scan + public asset boundary | Không có secret/asset vi phạm |
| Dependency audit | **PASS — 0 high/critical**; 12 moderate trong dev tooling (ESLint/typescript-eslint/minimatch) | Không thay dependency trong vòng này |
| Browser acceptance | **8/8 state**, **23/23 round**, 0 ảnh lỗi, 0 console/page/request error, 0 overflow | R17 + R16, VI/EN, desktop/mobile |
| Sticky + classification | **4/4 state PASS** — sticky 142/64 px; R17 22 hàng/3 podium; R16 empty-state | Wrapper `.c11-pinned-controls`, không đo nhầm `.c11-session-tabs` |
| A11y cơ bản | Credit link focus-visible **2 px** `rgb(255,179,71)`; ảnh decorative `alt=""` + `aria-hidden`; title một dòng; không cắt credit ở 200/400 % | Không chạy axe mới |
| SEO | Không đổi route/title/meta; ảnh decorative; credit visible; không re-audit SEO score | Theo owner override |
| Lighthouse/axe/Web Vitals | **NOT RE-RUN** — owner design-first override; các số Stage I chỉ là lịch sử, không dùng chặn nghiệm thu thiết kế | G-3 **NOT RE-RUN** |
| Homepage video/logo/model locks | **PASS** — hash test + lifecycle; 0 canvas; no EDS-G01 | Không sửa asset |
| Deployment / data pipelines / P4 cleanup gate | **NOT RUN** | Chưa có `APPROVED P4`; không commit/push/merge/deploy |

**Cleanup stray của vòng này:** **156 file / 40.006.690 B** output trùng hoặc phiên bản cũ do lỗi path (`scratch/scratch/**`, `scratch/apps/**`) đã được **di chuyển, không xóa**, tới `scratch/ignition/p4/quarantine/venue-duplicates-2026-11-02/`; manifest từng file bytes + SHA-256 tại `scratch/ignition/p4/logs/venue-hero-review/stray-cleanup-manifest.json`. 35/44 ảnh capture trùng byte-for-byte; 112 bản venue cũ không trùng byte và đã bị thay bởi runtime hiện tại; không có runtime reference. Đây là dọn artifact scratch, **không phải** `P4 CLEANUP_VERIFIED`.

### F. Rủi ro còn lại và mục chưa xác minh

| ID | Nội dung | Trạng thái |
|---|---|---|
| R-VH-01 | **R17 Marina Bay mobile tối**: 50 % pixel gần đen trong vùng ảnh cuối (ảnh đêm + scrim); skyline vẫn thấy nhưng owner có thể yêu cầu giảm scrim hoặc đổi ảnh sáng hơn | **OPEN — owner judgement** |
| R-VH-02 | **Madrid** dùng skyline thành phố, không phải ảnh MadRing/circuit (venue chưa có ảnh tự do phù hợp); **COTA** là silhouette hoàng hôn; **Hungaroring** aerial có haze | **OPEN — semantic/aesthetic risk** |
| R-VH-03 | 23 ảnh mới được owner-review đầy đủ ở R16/R17; 21 venue còn lại mới được kiểm desktop contact sheet + mapping, chưa review mobile crop từng venue | **PARTIAL REVIEW** |
| R-VH-04 | Nghĩa vụ licence: CC BY/BY-SA cần attribution + link (đã có); crop/grade ảnh BY-SA có thể là adaptation và phải ShareAlike; ảnh có thể còn quyền model/property/trademark của venue; chưa có legal clearance | **OPEN — legal review not performed** |
| R-VH-05 | Chưa test Safari/iOS AVIF→WebP fallback, thiết bị thật, screenreader thủ công; browser evidence là Chromium 1243 headless trên local static preview | **NOT RUN** |
| R-VH-06 | Tổng asset venue **25,6 MB**; mỗi lượt chỉ tải một orientation/format nhưng chưa đo LCP/INP mới; owner design-first override không cho mở vòng performance | **NOT MEASURED** |
| R-VH-07 | R16 không có phân hạng qualifying đã xác minh → empty-state là hành vi dữ liệu đúng, không phải lỗi; R17 có 22 hàng | **EXPECTED** |
| R-VH-08 | Các tồn tại cũ ngoài scope (Home 400 %, rail 400 %, O-P4-08, D-P1-02) không được tái kiểm trong vòng này | **NOT RE-RUN** |

### G. Quyết định

**Quyết định của vòng này: `HOLD` tại `RACE CENTER VENUE HERO OWNER REVIEW` — chờ owner đánh giá thiết kế.** Đây không phải GO, không phải `APPROVED P4`, không phải `P4 CLEANUP_VERIFIED`, không mở P5. **G-1 PASS (review), G-2 PASS** (ảnh venue có licence/provenance, credit hiển thị; template artwork model-free giữ nguyên cho Calendar/fallback), **G-4 PASS** (lint/typecheck/446 test/build/security/smoke), **G-3 NOT RE-RUN** theo owner override.

**Owner cần quyết định:** (1) chấp nhận mapping 23 venue và chất lượng ảnh Sepang/Marina Bay hay yêu cầu thay venue cụ thể; (2) chấp nhận độ tối R17 mobile (R-VH-01) và các ngoại lệ Madrid/COTA/Hungaroring (R-VH-02); (3) xác nhận nghĩa vụ attribution/ShareAlike của ảnh Wikimedia (R-VH-04); (4) nếu `APPROVED P4`: chạy cleanup gate + basic re-QA rồi mới ghi `P4 CLEANUP_VERIFIED` và mở P5. Không commit/push/merge/deploy trong vòng này.

## 13.36 P4 CLOSEOUT — `P4 DESIGN APPROVED — IMAGE POLISH DEFERRED`, `P4 CLEANUP_VERIFIED`, P5 OPEN (02/11/2026)

**Owner decision:** hướng thiết kế P4 được chấp nhận — **`P4 DESIGN APPROVED — IMAGE POLISH DEFERRED`**. Các điểm ảnh venue chưa hoàn hảo được chuyển vào **FINAL IMAGE POLISH BACKLOG**, không chặn P5 và không chỉnh trong vòng này. Đây là nghiệm thu thiết kế P4, không phải quyền deploy production.

### A. FINAL IMAGE POLISH BACKLOG (deferred, không phải PASS)

| ID | Nội dung | Nguồn | Trạng thái |
|---|---|---|---|
| IPB-01 | R17 Marina Bay mobile tối (ảnh đêm + scrim; 50 % pixel gần đen) | R-VH-01 | **DEFERRED — owner accepted design** |
| IPB-02 | Crop Sepang (portrait crop chưa tối ưu) | Owner review | **DEFERRED** |
| IPB-03 | Madrid skyline không phải MadRing; COTA silhouette hoàng hôn; Hungaroring aerial haze | R-VH-02 | **DEFERRED** |
| IPB-04 | ShareAlike/attribution và model/property/trademark clearance của ảnh Wikimedia | R-VH-04 | **DEFERRED — legal review not performed** |
| IPB-05 | 21 venue còn lại chưa review mobile crop từng ảnh | R-VH-03 | **DEFERRED** |

Không có mục nào trong backlog được ghi PASS. 23 ảnh venue, credit tác giả/licence/source và provenance hiện có được **giữ nguyên**.

### B. Cleanup manifest, backup và reference check

- Manifest: `scratch/ignition/p4/logs/p4-closeout-cleanup-manifest.json` — generated `2026-11-02T01:59:26.284Z`.
- **860 file / 186.935.795 B** candidate/preview venue images đã bị thay bởi 184 runtime outputs, 3 plan fragment và 2 empty log được **di chuyển, không xóa**, tới `scratch/ignition/p4/quarantine/p4-closeout-2026-11-02/`.
- **860/860** entry có `bytes` + SHA-256; quét lại quarantine đủ **860 file / 186.935.795 B**, 0 entry thiếu hash.
- **Reference check PASS** — không basename nào còn được tham chiếu từ `apps/web/src`, `apps/web/scripts`, `tools` hoặc master plan.
- Protected, verified intact: `scratch/ignition/p4/venue-heroes/masters`, `venue-heroes.json`, `scratch/ignition/p4/shots/venue-hero-review`, `quarantine/eds-g01-artwork` (52 ảnh + manifest + README), `quarantine/venue-duplicates-2026-11-02`, Homepage video/poster, logo, `source-assets/models`.
- Không dọn baseline P0–P4, evidence acceptance/venue hero, log gate hay bất kỳ source/runtime asset nào.

### C. Asset verification sau cleanup

| Asset | Kết quả |
|---|---|
| Venue runtime | **184 file / 25.619.187 B** trong `apps/web/public/images/p4/venues/` — khớp Stage venue hero |
| Homepage video | `hero-h3-2.mp4` **1.761.848 B**, SHA `FC9DE024…BD421` — OK |
| Homepage poster | `hero-h3-2-poster.png` **866.844 B**, SHA `98F88281…CC69` — OK |
| Official logo | `logo.png` **246.326 B**, SHA `226AB6F1…36ACD2` — OK |
| Compact logo | `logo-compact.png` **11.451 B**, SHA `424A28BF…8176125` — OK |
| EDS-G01 original | `eds-g01.glb` **660.192 B**, SHA `A9A1226D…8325` — OK |
| Model B frozen | `model-b-eds-optimized-v1.glb` **2.120.816 B**, SHA `2D009166…610A2` — OK |
| EDS-G01 quarantine | 52 ảnh + manifest + README; **3.271.860 B** ảnh — OK |
| Runtime refs | 0 tham chiếu tới file đã dời; `assetLocks` 3/3 và `p4AssetCompliance` 8/8 PASS |

### D. Re-QA tối thiểu trên source hiện tại

| Gate | Kết quả |
|---|---|
| ESLint | **PASS** — 0 error, **15 warning tồn tại từ trước** |
| TypeScript | **PASS** — 0 error toàn workspace |
| Unit/integration | **PASS — 446 test** (428 web/73 file + 16 API/3 + 2 security/1) |
| Build | **PASS — 11,07 s**; entry `index-BB-mRl5e.js` **629,49 kB** (gzip **91,13 kB**); CSS `index-XPn6YxVT.css` **184,16 kB** (gzip **29,30 kB**); SEO 72 route; commercial isolation + Cloudflare PASS |
| Secret / public boundary | **PASS** — secret scan + public asset boundary (chạy lại sau build) |
| Browser smoke | **PASS — 27/27** route×viewport (9 route × 375/768/1440, reduced motion): 0 HTTP failure, 0 overflow, 0 console/page error, 0 broken image, 0 failed request |
| Lighthouse/axe/Web Vitals | **NOT RE-RUN** — owner design-first override |
| Deployment / hai data pipeline | **NOT RUN** |

Browser smoke routes: `/`, `/races`, `/season/2026`, `/season/2026?tab=calendar&intro=false`, `/drivers`, `/drivers/antonelli`, `/teams`, `/teams/mercedes`, `/showroom`; evidence `scratch/ignition/p4/logs/closeout-smoke.json`.

### E. Quyết định

**`P4 DESIGN APPROVED — IMAGE POLISH DEFERRED` / `P4 CLEANUP_VERIFIED`** — owner đã chấp nhận hướng thiết kế P4; cleanup có manifest/backup/reference check; re-QA tối thiểu không regression; locks và evidence nguyên vẹn. **P5 OPEN**. Image polish backlog là **DEFERRED**, không phải PASS. Không commit/push/merge/deploy. G-3 vẫn **PARTIAL / NOT RE-RUN**; deployment và hai pipeline dữ liệu vẫn **NOT RUN**.

## 13.37 P5 VISUAL DESIGN — CINEMATIC STANDINGS, DRIVERS/TEAMS DIRECTORY, DRIVER/TEAM PROFILE (02/11/2026)

**Status:** `P5 VISUAL DESIGN — OWNER REVIEW` (HOLD). Owner brief P5 Stage A–H được thi hành trên baseline `d4838ad5be4c809dc020c52fe84ae47edcdb67c3` + working tree hiện tại; không commit/push/merge/deploy, không cleanup P5, không mở P6. P4 giữ nguyên `P4 DESIGN APPROVED — IMAGE POLISH DEFERRED / P4 CLEANUP_VERIFIED`; ba khóa MODEL / HOMEPAGE VIDEO / BRAND không bị chạm.

### A. Phạm vi đã triển khai

| Surface | Nội dung | File chính |
|---|---|---|
| Standings | Hero ảnh venue + mega headline, podium P1 giữa với portrait lớn/team tint, bảng đầy đủ 23 hàng, last-5 form lấy từ detailed results, wins/podiums/points, rank movement chỉ hiển thị khi có mốc so sánh đã xác minh; mobile chuyển bảng thành card list | `components/championship/ChampionshipStandings.tsx`, `utils/standingsMovement.ts`, `utils/p5Data.ts`, `components/p5/P5Portrait.tsx` |
| Drivers directory | 23 card portrait AVIF/WebP, số xe lớn, màu đội, rank/country/code, hover reveal; credit chân dung hiển thị | `components/championship/ChampionshipDirectory.tsx`, `components/p5/P5DirectorySurfaces.tsx` |
| Driver profile | Hero portrait lớn, number/name/team, stat vô địch lấy từ standings hiện có, season results, editorial section theo màu đội; **không** bịa DOB/career/signature/quote/highlight video không có nguồn | `components/pages/DriverDetailPage.tsx`, `components/pages/StandaloneProfileDirectory.tsx` |
| Teams directory / Team profile | 11 card đội với lineup + portrait duo; profile hero venue, team color surface, 2 driver card, statistics/season overview, car specification có nguồn; **không** bịa founding year/crew count | `components/pages/TeamDetailPage.tsx`, `components/p5/P5DirectorySurfaces.tsx` |
| Motion | Anime.js 4.5.0 qua `useP5Reveal` (opacity/translateY, stagger có giới hạn), gate `prefers-reduced-motion`; 7 video evidence | `components/p5/useP5Reveal.ts`, `components/p5/p5.css` |
| Localization | VI dùng “Podium” (không phải “Podiums”); EN giữ “Podiums” — sửa ở standings table và driver/team profile | `ChampionshipStandings.tsx`, `DriverDetailPage.tsx`, `TeamDetailPage.tsx` |

Không thay đổi route, API, Results Engine, dữ liệu nền, Homepage video/poster, ITM, 3D, logo, dependency hay CSP. Standings/directory/profile dùng chung nguồn `useP5SeasonData` (baseline + saved detailed results + sync 2026); movement chỉ xuất hiện khi baseline cutoff và kết quả detailed khớp tuyệt đối với engine — nếu không, hiển thị “No verified prior rank”, không suy diễn.

### B. Portrait asset provenance

- **23/23 driver**, ảnh gốc Wikimedia Commons: 18 CC BY-SA 4.0, 2 CC BY-SA 2.0, 1 CC BY 4.0, 1 CC BY 2.0, 1 CC0.
- **138 output** AVIF/WebP (480/720/960 × 2 format) = **7.636.479 B**, khớp byte-for-byte với manifest; tổng ảnh gốc **24.717.330 B**.
- Manifest: `docs/asset-manifests/p5-driver-portraits.json` (source page, artist, licence URL, crop, SHA-256 từng output). Registry: `apps/web/src/utils/driverPortraits.ts`. Credit hiển thị ở gallery/profile theo `attributionRequirement`.
- Không dùng EDS-G01, không dùng Model B, không thêm logo đội/chính thức. Venue hero tái sử dụng registry P4 hiện có (184 file, không đổi byte).

### C. Visual QA evidence

| Bộ | Kết quả |
|---|---|
| Capture matrix | **88 state**: desktop 30 (1024/1440/1920 × 5 route × EN/VI), mobile 30 (375/390/768 × 5 × EN/VI), VI label refresh 18, embedded 8, constructors 2 — **0 overflow, 0 missing portrait, 0 broken image, 0 console/page error, 0 failed request** |
| Ảnh | **140 JPG** runtime + **10 crop** + **8 contact sheet** (standings/constructors/driver/team × fold/full) tại `scratch/ignition/p5/qa/stage-h/` |
| Video | **7 WebM** (standings reveal/tabs, drivers hover/filter, teams hover/filter, driver scroll, team scroll, reduced motion, mobile touch) tổng **19.678.565 B** |
| Interaction | **83/83** check — keyboard focus, hover reveal, filter/tab, search, mobile card, VI/EN labels; 0 console/page/failed request (`interaction-qa.json`) |
| Production preview | **20/20** route×viewport×lang trên build tĩnh `127.0.0.1:4176` (`index-dEVfD1MN.js`), API Jolpica replay: standings **23 hàng**, drivers **23 card**, teams **11 card**, profile render đúng; 0 overflow/broken/console/page error, không có `.p5-warning` |
| API-unavailable fallback | **3/3** — block toàn bộ `/api/jolpica`: standings hiển thị warning “Update unavailable. Showing saved or baseline data.”, baseline **22 hàng/22 card**, profile vẫn render, 0 page error; chỉ có 3 console entry 503 đúng như kỳ vọng (`preview-api-offline.json`) |

Preview smoke phải replay API qua dev worker vì bản preview tĩnh không có serverless worker; đây là giới hạn của môi trường preview, không phải bằng chứng deployment. Không đánh dấu deployment là PASS.

### D. Template vs runtime — khác biệt đã biết

| Surface | Mockup | Runtime hiện tại | Lý do |
|---|---|---|---|
| Standings | Có points-progression chart; cột theo từng round | Không có chart; bảng last-5 + wins/podiums/points | Chart cần chuỗi điểm từng round đã xác minh; không dựng dữ liệu giả |
| Standings hero | Headline bản địa hóa | VI giữ display headline tiếng Anh “DRIVERS CHAMPIONSHIP”; kicker/copy đã VI | Giữ art direction mockup; chờ owner quyết định bản địa hóa toàn bộ |
| Constructors | Podium dùng ảnh xe/đội; cột top-5/top-10/round breakdown | Podium dùng portrait 2 driver; không có cột xu hướng | Không có ảnh xe đội được cấp phép; không bịa số liệu |
| Driver profile | Tab + DOB/career/signature/quote/highlight video | Section anchor; chỉ stat/season results có nguồn | Không có nguồn cho các trường bị lược |
| Team profile | Tab + founding year/crew count + ảnh xe | Section anchor; venue photography; car spec từ dữ liệu hiện có | Không có nguồn cho founding year/crew count |
| Mobile hub | — | Placeholder 75svh của P3 khi vào `/season/2026` mobile | Hành vi có trước P5; contact sheet crop phần placeholder, không sửa |

Không có mục nào ở trên được ghi PASS như “100% template fidelity”; đây là các khác biệt chờ owner chấp nhận hoặc yêu cầu chỉnh.

### E. Engineering gates trên source cuối

| Gate | Kết quả |
|---|---|
| ESLint toàn repo | **FAIL (exit 1) — 7 error**, tất cả trong `scratch/ignition/p6-design/live-showroom/src/main.tsx` (P6 scratch chưa track, ngoài phạm vi P5; không sửa) |
| ESLint `apps/web/src` | **PASS (exit 0)** — 0 error, 7 warning tồn tại từ trước |
| ESLint file P5 sở hữu | **PASS (exit 0)** — 0 error, 1 warning `'leader' is assigned a value but never used` (`ChampionshipStandings.tsx`) — non-blocking, để cleanup sau owner approval |
| TypeScript | **PASS** — 0 error, 4 workspace |
| Unit/integration | **PASS — 451 test**: 433 web/74 file + 16 API/3 + 2 security/1 |
| Test contract thay đổi có chủ đích | 2 test trong `championshipC1.test.tsx` được cập nhật theo contract P5: bảng standings mới + portrait directory có label; thay assertion cũ `.c1-points-track`/“không có `<img>`”. Không xóa test, không hạ tiêu chí — **owner cần review** |
| Build | **PASS — 13,25 s**; entry `index-dEVfD1MN.js` **629,77 kB** (gzip **91,20 kB**); CSS `index-XPn6YxVT.css` **184,16 kB** (gzip **29,30 kB**); SEO **72 route**, `indexing=false` |
| Secret / public boundary | **PASS** — secret scan + public asset boundary |
| Lighthouse / axe / Web Vitals | **NOT RE-RUN** — owner design-first override; G-3 vẫn **PARTIAL**, mobile LCP P4 Stage I từng FAIL không được ghi PASS, field INP/thiết bị thật **NOT RUN** |
| Deployment / hai pipeline dữ liệu | **NOT RUN** — không commit/push/merge/deploy |

Protected assets re-verified nguyên vẹn: mp4 `FC9DE024…BD421` 1.761.848 B; poster `98F88281…CC69` 866.844 B; logo `226AB6F1…36ACD2` 246.326 B; compact `424A28BF…8176125` 11.451 B; EDS-G01 `A9A1226D…8325` 660.192 B; Model B `2D009166…610A2` 2.120.816 B.

### F. Residual risks / unverified

- **Licence/legal:** ảnh chân dung là third-party (CC BY-SA chiếm đa số); credit + licence link đã hiển thị, nhưng nghĩa vụ ShareAlike cho crop/biến thể, quyền nhân thân/property và phạm vi portfolio phi thương mại **chưa được legal review** — ghi risk, không PASS.
- Ảnh chân dung có thể không trùng chính xác thời điểm/trang phục của mùa 2026; chưa có kiểm chứng từng ảnh với từng tay đua bởi owner.
- Khác biệt template ở §D chưa được owner nghiệm thu.
- Preview tĩnh yêu cầu replay API; production thật cần worker `/api/jolpica` (đã tồn tại trong `apps/api`) — chưa kiểm chứng trên deployment thật.
- P6 scratch còn 7 lint error ngoài phạm vi; 1 warning trong file P5; 2 test contract đã đổi.
- Không chạy Safari/Firefox/real devices/screen reader cho P5; 400%/200% zoom mới chỉ kiểm tra ở các vòng P4 trước, chưa lặp lại đầy đủ trên 5 surface P5 trong vòng này.

### G. Quyết định

**HOLD — `P5 VISUAL DESIGN — OWNER REVIEW`.** Không thể GO vì (1) owner chưa nghiệm thu hình ảnh/bố cục P5, (2) licence/legal review của portrait chưa chạy, (3) G-3 chưa đo lại và deployment/pipelines **NOT RUN**, (4) còn khác biệt template đã liệt kê. Đây không phải approval. **Không cleanup P5, không commit/push/merge/deploy, không mở P6.** Bước tiếp theo duy nhất: owner review bộ contact sheet/video/ảnh runtime và quyết định `APPROVED P5` hoặc danh sách chỉnh sửa.

---

### 13.38 P5 CINEMATIC PHOTOGRAPHY CHECKPOINT — OWNER REVIEW (2026-11-02)

Thi hành **P5 DRIVER CINEMATIC PHOTOGRAPHY DIRECTIVE** của owner: mỗi tay đua phải có ảnh thật (Serious Portrait / Race Mode / On-Track Action), registry theo `driverId + season`, không ảnh sai người, không AI giả, không silhouette placeholder; **không rebuild P5**, giữ nguyên dữ liệu/chức năng; dừng tại owner review. Checkpoint triển khai cho **3 tay đua đang dẫn đầu**: Antonelli (Mercedes, P1 380), Verstappen (Red Bull, P2 261), Hamilton (Ferrari, P3 259).

#### A. Registry và nguồn ảnh

| Driver | Race Mode (3:4) | On-Track Action (16:9 / 4:5) | Licence |
|---|---|---|---|
| Antonelli | 2026 Australian GP — Melbourne Walk · Yu Chu Chin | 2026 Chinese GP — Post Race Celebration · Liauzh | CC BY-SA 4.0 / CC BY 4.0 |
| Verstappen | 2026 Chinese GP — FP1 · Liauzh | 2026 Chinese GP — Qualifying · Liauzh | CC BY 4.0 |
| Hamilton | 2026 Dutch GP · Steffen Prößdorf | 2026 Japanese GP — Suzuka · Martin Lee (London, UK) | CC BY-SA 4.0 |

- Registry `apps/web/src/utils/driverCinematic.ts` khóa theo `driverId:season`; manifest `docs/asset-manifests/p5-driver-cinematic.json` ghi event, sourceTitle, artist, licence, licenseUrl, sourcePage, cropNote, width/height và SHA-256 từng output.
- **54 output AVIF/WebP = 3.825.982 B**: race 3:4 ở 480/720/960; action landscape 16:9 ở 960/1440/1920; action portrait 4:5 ở 480/720/960.
- Ảnh chân dung Serious Portrait lấy từ registry P5 hiện có (Wikimedia Commons, credit hiển thị); **không** dùng EDS-G01, Model B, render 3D, mockup hay ảnh AI. Không thêm logo đội giả.
- Chỉ **3/23** driver có cinematic registry. 20 driver còn lại giữ portrait hiện tại và **không** hiện nút Race mode — không gắn ảnh người khác để đủ số.

#### B. Tích hợp UI (không đổi route/API/dữ liệu)

- **Standings top 3**: podium dùng Serious Portrait đúng thứ hạng runtime (DOM order P2/P1/P3); hover/focus chuyển Race Mode bằng crossfade.
- **Drivers gallery**: portrait là trạng thái chính; nút “RACE MODE” chỉ xuất hiện trên 3 card có registry; desktop hover/focus, mobile và keyboard dùng nút thật (`aria-pressed`, Space/Enter); overlay link giữ nguyên `/drivers/:id?season=2026`.
- **Driver Profile**: sửa **D-P5-CP-01** — ảnh action trước đây nằm full-bleed phía sau gradient gần đục và gần như không nhìn thấy. Nay hero (portrait + race toggle) và **action editorial plate** nằm trong một `.p5-profile-stage` có border/radius chung: desktop grid 58/42, media 16:9; mobile stack, media 4:5; plate có ghost number, tên event, credit photographer + licence link. Đây là thay đổi source chính của checkpoint: `DriverDetailPage.tsx` + `p5Cinematic.css`.
- **Team profile**: duo Ferrari giữ hover race layer, không cắt mặt, không kéo giãn.
- Motion 240–260 ms crossfade; `prefers-reduced-motion` trả về trạng thái tĩnh; focus ring hiển thị; không flicker.

#### C. Evidence runtime

- Harness `scratch/ignition/p5/capture-cinematic-checkpoint.cjs` chạy **14 step** trên dev server `localhost:5173`; mỗi step ghi overflow, console error, pageerror, failed request và trạng thái ảnh.
- Kết quả: **0 horizontal overflow** ở mọi step đo được, **0 console error, 0 pageerror, 0 failed request** toàn bộ 14 step; navigation đúng `/drivers/antonelli?season=2026`.
- **3 profile × 3 trạng thái**: `04` Antonelli portrait, `04b` race, `04c` action; `04d`/`04db`/`04dc` Verstappen; `04g`/`04gb`/`04gc` Hamilton. Metrics mỗi profile: stage **1022 px**, hero **560 px**, action plate **460 px**, ảnh action `loaded=true`, đúng title/credit.
- Gallery: `02` portrait, `03` race mode desktop 1440, `03-crop-*` xác nhận card không có registry không có nút; `06`/`07` mobile 390; `10`/`10b` tablet 768; `09` standings top-3 mobile; `01`/`01b` standings desktop + hover; `05`/`05b` team duo + hover.
- Keyboard: Space trên nút Antonelli → portrait (`aria-pressed=false`, opacity race 0/portrait 1), Space lần hai → race (`true`, 1/0); link list giữ đúng 4 route đầu.
- Reduced motion: transition duration đo **1e-05 s** cho race/portrait/button, trạng thái cuối vẫn đúng.
- Tổng **35 PNG** trong `scratch/ignition/p5/checkpoint/` (gồm ảnh crop/diagnostic cũ; bộ review chính là 01–11b).

#### D. Engineering gates trên source cuối

| Gate | Kết quả |
|---|---|
| TypeScript | **PASS** — 0 error |
| ESLint file thay đổi | **PASS** — 0 error |
| ESLint toàn repo | **FAIL (exit 1)** — 8 error tồn tại trong `scratch/ignition/p6-design/live-showroom/src/{main.tsx,StudioCameraController.tsx}` (P6 scratch ngoài phạm vi, không sửa) + warning cũ |
| Unit/integration web | **PASS — 433 test/74 file** khi chạy serialized; lần chạy parallel có 3 test Results Engine timeout 5.000 ms do tải, chạy isolated **21/21 PASS** — không phải regression |
| API/security | **PASS — 16 API + 2 security** (tổng 451) |
| Build | **PASS** — entry `index-CWFBvCh7.js` **629.715 B** (gzip **91.177 B**); CSS `index-XPn6YxVT.css` **184.159 B** (gzip **29.304 B**); SEO 72 route |
| Lighthouse / axe / Web Vitals | **NOT RUN** — theo owner “không mở vòng Lighthouse mới” |
| Deployment / hai pipeline dữ liệu | **NOT RUN** — không commit/push/merge/deploy |

Locks nguyên vẹn: homepage video `FC9DE024…BD421` 1.761.848 B + poster `98F88281…CC69` 866.844 B; logo `226AB6F1…36ACD2`; compact `424A28BF…8176125`; EDS-G01 `A9A1226D…8325`; Model B `2D009166…610A2`; không đổi P6/Inside the Machine/Results Engine.

#### E. Residual risks / unverified

- **D-P5-CP-02 (design risk, OPEN):** Race Mode của Verstappen là góc sau/3-4 helmet trong cockpit, Hamilton là cockpit với visor che mắt — chưa đạt rõ “mắt/ánh nhìn/cảm xúc”; Antonelli race là pre-race walk (không helmet). Cần owner quyết định có đủ tính “quyết liệt” hay phải tìm ảnh khác.
- **D-P5-CP-03 (design risk, OPEN):** Portrait Hamilton đeo kính râm + hoodie, mắt bị che — không hoàn toàn khớp yêu cầu “clear face/eyes”.
- **D-P5-CP-04 (coverage, OPEN):** 20/23 driver chưa có cinematic imagery; gallery của họ không có Race mode. Rollout chỉ sau khi owner duyệt hướng.
- Crop race profile đặt `object-position: center 28%` để giữ cap/mắt nhưng vẫn là close-up chặt; có thể cắt bớt vai.
- Hai nguồn dùng thumbnail Commons 1920 px do API trả **HTTP 429**; Hamilton race 960 được tạo từ crop 700×933 (upscale) — cần kiểm tra chất lượng ở màn hình lớn.
- Portrait có thể lệch mùa/trang phục so với 2026 (Verstappen 2024, Hamilton 2025); chưa được owner xác nhận từng ảnh.
- **Legal review NOT RUN** (ShareAlike cho crop/biến thể, quyền nhân thân/property, phạm vi portfolio phi thương mại).
- Browser: chỉ Chromium; Safari/Firefox/real devices/screen reader **NOT RUN**; VI locale mới đo metrics, chưa recapture toàn bộ ảnh VI; mobile profile mới có Antonelli.
- Không chạy Lighthouse/axe/Web Vitals; deployment và hai pipeline dữ liệu **NOT RUN**.

#### F. Quyết định

**HOLD — `P5 CINEMATIC PHOTOGRAPHY — OWNER REVIEW`.** Không thể GO vì (1) owner chưa duyệt hướng hình ảnh/bố cục, (2) 20/23 driver chưa có imagery, (3) legal review chưa chạy, (4) còn design risk về crop/mắt ở race và portrait Hamilton. Đây **không phải** approval. Bước tiếp theo: owner review bộ ảnh checkpoint và trả `APPROVED DIRECTION` hoặc danh sách chỉnh (driver/ảnh/crop). **Không cleanup, không commit/push/merge/deploy, không mở P6.**

## 14. VERSION CONTROL CỦA PLAN — KHÔNG SINH RÁC DOCS

**Plan là living document có owner gate, không phải tài liệu khóa cứng.** Tại mỗi phase, nếu tài liệu local, screenshot, kết quả performance hoặc phản hồi owner cho thấy yêu cầu thay đổi:

1. Đề xuất `PLAN CHANGE REQUEST` ngay trong `docs/IGNITION_MASTER_PLAN.md`: lý do, bằng chứng, thay đổi scope/order/dependency, ảnh hưởng QA/license/performance, rủi ro và ảnh hưởng cleanup.
2. Không tự xáo lại thứ tự phase, đổi animation/3D behavior quan trọng hoặc giảm tiêu chí QA khi chưa được owner chấp thuận. Thay đổi nhỏ không ảnh hưởng scope vẫn phải ghi vào revision history.
3. Sau owner chấp thuận, cập nhật **chính master plan**, tăng revision và sửa acceptance/phase matrix liên quan. Không tạo `IGNITION_PLAN_FINAL_2.md` hoặc overwrite `PRODUCT.md`/`DESIGN.md` trái phép.
4. Ghi status một cách trung thực: `NOT_STARTED / IN_PROGRESS / QA_READY / OWNER_REVIEW / APPROVED / CLEANUP_VERIFIED / HOLD` cùng bằng chứng, không báo DONE khi chỉ đọc code.
5. Mỗi phase closeout chỉ để lại **một** summary trong kế hoạch và những artifact chủ đích; các snapshot/trace thử nghiệm cũ dọn có manifest sau approved. Không xóa baseline kiểm tra hoặc backup đang cần rollback.

### Revision history

| Rev | Date | Change | Gate |
|---|---|---|---|
| 1.0 | 2026-10-30 | Initial full roadmap and cross-phase QA/cleanup rules | Draft |
| **1.1** | 2026-10-30 | Start P0 remote preflight; add P0-A…E execution, phase outcomes, one-canonical-plan policy, change control; local 3 docs still pending | **P0 IN_PROGRESS / Gate 0 HOLD** |
| **1.2** | 2026-10-30 | P0 local execution complete: 3/3 docs + hashes; 129 real screenshots; intro/Model B/ITM baseline; visual gap + motion/3D + skills matrices; defects D-P0-01…07; decisions D1–D8; revised P1–P8 scope/acceptance; Gate 0 HOLD for owner | **P0 COMPLETE / OWNER REVIEW / Gate 0 HOLD** |
| **1.3** | 2026-10-30 | Gate 0 reconciliation: 7/7 mockup + Design Spec verified (hash/dimensions) and compared with P0 baseline; `VISUAL_GAP_MATRIX` rewritten page-by-page 01–07 + G1–G4; D1–D8 recorded with scope/constraints; P1 scope P1-A…P1-E + QA matrix; open conflicts C1–C8 (intro/tokens/routes/data/rights); no source change | **GATE 0 RECONCILED / OWNER APPROVAL PENDING / P1 LOCKED** |
| **1.3.1** | 2026-10-30 | P1 execution evidence (§13.14): P1-A…P1-E implemented; 96+96 screenshots; About 17.74:1; countdown visual=aria; intro ±1.04%; lint/typecheck/test/build/security/local preview PASS; findings D-P1-01…06; no scope/decision change | **P1 QA_READY / OWNER REVIEW / GATE 1 HOLD** |
| **1.3.2** | 2026-10-31 | P1 closeout (§13.15): owner APPROVED P1; CSP verified pre-existing and EN/VI unaffected; 6 debug artifacts removed with hash-verified off-tree backup; P0/P1 evidence and owner assets retained; re-QA 381 tests + build + security + 20/20 browser smoke PASS | **P1 APPROVED / CLEANUP_VERIFIED / GATE 1 GO / P2 OPEN** |
| **1.3.3** | 2026-10-31 | P2 execution (§13.16): P2.1–P2.5 implemented; 88 rows/125 screenshots/4 videos + contact sheet; intro unchanged (3× 3,38s, skip 100ms, session skip, reduced 0); lint/typecheck/388 tests/build/security/preview 36/36/ITM 6 chương 75 transform PASS; DEV Model B vs production EDS-G01; no package/route/data/API change; 3 harness fixes documented; Gate 2 owner decision pending | **P2 QA_READY — GATE 2 OWNER REVIEW / PHASE 3 LOCKED** |
| **1.3.4** | 2026-10-31 | P2 Gate 2 refinement (§13.17): typographic PODIUM/EDS wordmark, 1024 VI/EN typography + dropdown focus/ARIA, 3-source-file scope; 1024 metrics 13.0176px main / 13 sub / 12 CTA / 11 lang, 0 overlap; browser zoom 200% PASS; `D-P2-01` text-only 200% pre-existing P3; intro 3× 3347–3348ms vs 3350ms + synchronized video; dropdown video 12.08s 9/9; re-capture 88 rows/130 PNG + 12 states; 389 tests/lint/typecheck/build/security/preview 36/36/ITM PASS; no cleanup/commit/push/deploy | **P2 FINAL OWNER REVIEW / PHASE 3 LOCKED** |
| **1.3.5** | 2026-10-31 | Owner override — brand identity correction (§13.18): official PODIUM EDS logo restored in header, wordmark request cancelled, BRAND IDENTITY LOCK added to §3.1 + `DESIGN.md`; only display size/padding/container changed; logo 32px mobile / 36px desktop, aspect 0.3725, 10/10 checks across 6 viewports × VI/EN, 0 crop/distortion/upscale; re-recorded dropdown 12.16s 9/9 + intro 3351/3350/3347ms; re-capture 88 rows/130 PNG; 389 tests/lint/typecheck/build/security/preview/ITM PASS; no asset/route/API change, no commit/push/deploy | **P2 OWNER REVIEW / PHASE 3 LOCKED** |
| **1.3.6** | 2026-10-31 | P2 closeout (§13.19): owner `GATE 2 APPROVED`; CLEANUP_MANIFEST executed for 220 ignored scratch files/95.525.174 B with 220/220 SHA-256 off-tree backup; re-QA diffcheck/lint/typecheck/389 tests/build 8.90s/security/preview 36/36 13/13 PASS; D-P1-02 and D-P2-01 carried forward; no source/asset/route/API change, no commit/push/deploy | **P2 APPROVED / CLEANUP_VERIFIED / GATE 2 GO / P3 OPEN** |
| **1.3.7** | 2026-10-31 | P3 homepage execution (§13.20): hero hierarchy/EDS-G01 single stage, Latest GP + Race Intelligence from verified round, 6 existing-route Explore cards, motion map/media guards, production QA 46/46 + 12/12 visual rows; intro 3350 ms intact; lint/typecheck/392 tests/build/security PASS; bundle HomeView 35.53 kB JS / 34.47 kB CSS; no commit/push/deploy, no P3 cleanup | **P3 QA_READY — GATE 3 OWNER REVIEW / P4 LOCKED** |
| **1.3.8** | 2026-10-31 | P3 final visual polish (§13.21): P3-V01 six mobile Explore labels visible at 375/390 EN/VI (72 px card, 10.88 px, 9.79:1, routes intact); P3-V02 Race Intelligence localized (`PHÂN TÍCH CHẶNG ĐUA`, VI sr heads, source fallback) with proper nouns/data preserved; P3-V03 metrics stacked ≤479 (333/348 px, 10.88/16.8/11.52 px, contrast 7.99/15.34/7.99) and 200% text zoom overflow 119/104 → 0; polish QA 44/44, home QA 46/46, 395 tests, 8/8 focused, lint/typecheck/build/security PASS; intro default 3× 3352 ms; logo SHA-256 unchanged; 72 before/after PNG + 3 contact sheets; no cleanup/commit/push/merge/deploy, P4 locked | **P3 FINAL OWNER REVIEW / P4 LOCKED** |
| **1.3.9** | 2026-10-31 | P3 final acceptance (§13.22): mobile Explore/intel labels 10.88/11.52 → **12 px** with line-height 1.3/1.35, desktop unchanged; 6/6 labels at 375/390 EN/VI, 200% **24/31.2 px**, no overlap/clip; EN 200% page overflow 22/18 unchanged vs legacy labels, VI 0, Explore/Latest section overflow 0; **ESC keydown → removal 1.0–1.6 ms (median 1.4)** vs old 671 ms mount→remove; default 3× **3346–3353 ms**; 24 final PNG + 3 contact sheets; final capture 8/8, polish 44/44, home 46/46, focused 8/8, 395 tests, lint/typecheck/build/security PASS; logo/data/Model B/ITM/Results Engine untouched; no cleanup/commit/push/merge/deploy, P4 locked | **GATE 3 FINAL ACCEPTANCE / APPROVED P3 PENDING / P4 LOCKED** |
| **1.4.0** | 2026-10-31 | P3 closeout (§13.23): countdown 200% EN overflow **22/18 → 0** bằng auto-fit `4.2em` (2 × 135,5/143 px) + label wrap; normal vẫn 4 cột; reduced motion 8 giá trị tĩnh; 400% digits đủ (1 cột 215/230, overflow 0) nhưng page overflow 311/265/296/250 ngoài digits là residual ngoài phạm vi; Latest GP thêm trạng thái **syncing/error minh bạch** (Saved R15/R18 snapshot), cold pending 8,137 s / verified 11,826 s, height delta **0**, CLS **0,0038/0,0067**, warm/error/timeout 12,2 s; **84/84** browser + **41/41** preview + **4/4** VI timeout + **10/10** focused + **398** tests; lint/typecheck/build/security PASS; logo, intro 3×, Model B, ITM, data/API/Results Engine untouched; no cleanup/commit/push/deploy, P4 locked | **P3 CLOSEOUT OWNER REVIEW / GATE 3 APPROVAL PENDING / P4 LOCKED** |
| **1.4.1** | 2026-10-31 | P3 cleanup + Gate 3 GO (§13.24): owner `APPROVED P3`; CLEANUP_MANIFEST executed for **138 ignored scratch files / 57.955.303 B** with **138/138** SHA-256 off-tree backup; re-QA diffcheck/lint/typecheck/**398 tests**/build 9,63 s/security/preview **38/38** PASS; protected 9/9 hashes and 23+23 worktree scope unchanged; no orphan CSS; 400% overflow and CSP font subset remain **OPEN — not PASS**; no source/asset/route/API change, no commit/push/deploy; P4 opened | **P3 APPROVED / CLEANUP_VERIFIED / GATE 3 GO / P4 OPEN** |
| **1.4.2** | 2026-10-31 | P4 execution (§13.25): Race Center restructured with 23-round rail, sticky round/session controls (gap 0/0/1/0 px at 1440/1024/768/390), truthful session states, team-tinted 22-row R17 table with team text; Calendar filters All/Completed/Upcoming (23/18/5, `?view=`, keyboard, reload), Next Race R19 + countdown, 2025 Complete panel; no Circuit Explorer route. **46/46** browser QA on local production preview; 200% P4 surfaces 0 overflow; 400% non-countdown remains **OPEN — not PASS**; D-P4-01…04 fixed and retested; lint 0 error/15 pre-existing warnings, typecheck 0, **400 tests** (382 web + 16 API + 2 security) PASS, build 8,46 s PASS, secret/asset scans PASS; CSP D-P1-02 and 400% overflow remain OPEN; shared F4 controls 200% clipping recorded as pre-existing OPEN observation; logo SHA unchanged; no cleanup/commit/push/merge/deploy | **P4 QA_READY — OWNER REVIEW / P4 OPEN** |
| **1.4.3** | 2026-11-01 | Gate 4 visual direction (§3.2 + §13.26): added VISUAL DESIGN ACCEPTANCE CONTRACT (4 gates + 10 anti-fabrication rules) for P4–P8; closed F4 tab/season-switcher 200%/400% via behaviour-only `Tabs.tsx` change (signature + ResizeObserver on rail/selected tab/root, instant layout reveal, `focus({preventScroll:true})`) — **96/96** tab-zoom PASS, years all visible, keyboard End/Home/Left/Right; 400% P4 surfaces 0 px with intentional scroll containers, sticky static; Results regression suite + E2E **8/8**; re-ran gates on final source **lint 0 error/15 pre-existing warnings**, typecheck 0, **417 tests** (399 web/68 files + 16 API + 2 security), build 10,72 s entry `index-BGehobvu.js` 628,90 kB gzip 90,91 kB, secret/asset PASS; browser QA **46/46**; **86 before + 86 after** runtime PNG + 5 contact sheets + 20-state gallery; no new raster assets, logo SHA unchanged, no route/API/data/Model B/ITM change; **OPEN-GLOBAL-01** 63 px at 390/EN/400% traced to global header/footer; G-1/G-4 PASS, **G-2/G-3 PARTIAL** (no licensed imagery, Web Vitals not run) → no APPROVED; no cleanup/commit/push/merge/deploy, P5 locked | **P4 VISUAL + FUNCTIONAL OWNER REVIEW / GATE 4 PENDING / P4 OPEN** |
| **1.4.4** | 2026-11-01 | P4 cinematic visual acceptance (§13.27): owner `CHANGES REQUESTED` on imagery → **36 project-owned cinematic plates** rendered from `eds-g01.glb` (three.js scene + sharp grading; 637.185 B, largest 59.608 B; AVIF q52/WebP q80, 3 widths each) integrated via `<picture>` srcset with mobile source swap, lazy posters and illustrative captions; Race Center hero uses artwork as subject, round poster + circuit accent, 22/22 team-tinted rows; Calendar hero + Next GP editorial poster (R19 night) + countdown/CTA; no third-party imagery, no mockup/Model B, no fake race/weather/tyre data; fixed hero image distortion (missing `object-fit`) with 3 contract tests; closed global header/footer 390/400% (footer logo 373→≤64 px height, header mobile flow) and long-tab readability (6/6 labels 260 px, 20 px, 48 px min-height, `clipped:false`) — results/calendar 0 overflow at 100/200/400 EN/VI, Home 400% 228/153 remains OPEN; **12/12** acceptance (1440/768/390 × EN/VI, 0 broken images/failed requests/page errors), 18 zoom measurements, keyboard/reduced motion PASS; final gates **lint 0 error/15 warnings**, typecheck 0, **424 tests** (406 web/70 files + 16 API + 2 security), build 8,93 s entry `index-Dwl4qguP.js` 629,53 kB gzip 91,14 kB, commercial isolation PASS, Cloudflare PASS, secret/asset PASS, preview 200; lab vitals recorded (LCP median 192–612 ms; VI 390 CLS 0,1324 cold — **D-P4-11 OPEN**; verified sessions 85/86 inconsistency **D-P4-12 OPEN**); G-1/G-4 PASS, **G-2 PARTIAL** (circuit depth illustration not produced), **G-3 PARTIAL** (field/Lighthouse/INP not run); logo SHA unchanged, no route/API/data/3D change; **HOLD at owner review**, no cleanup/commit/push/merge/deploy, P5 locked | **P4 CINEMATIC VISUAL ACCEPTANCE — OWNER REVIEW / GATE 4 PENDING / P4 OPEN** |
| **1.4.5** | 2026-11-01 | **P4 asset compliance (§13.28) — CRITICAL owner override.** EDS-G01 is the owner's self-authored model: never use it as a source for cinematic imagery/derivative renders without permission; never auto-fallback to it when Model B fails; never modify the original. All **36 EDS-G01-derived plates (637.185 B)** and their runtime references were removed from Race Center hero/round feature and Calendar hero/Next GP; **52 files / 3.271.860 B** quarantined at `scratch/ignition/p4/quarantine/eds-g01-artwork/` with per-file SHA-256 (not deleted); `CinematicPlate.tsx`, `cinematicPlates.ts`, `cinematicArtContract.test.ts` deleted from source; cinematic CSS blocks (~289 + ~229 lines) removed while base schematic composition and every 400% rule stay; valid P4 work preserved (sticky controls, 22-row team-tinted table, filters, Next GP R19 + countdown, responsive, keyboard, reduced motion). Added **6-test** `p4AssetCompliance` guard. Homepage video unchanged byte-for-byte (mp4 `fc9de024…bd421`, poster `98f88281…cc69`, mtime 30/10; component untouched since 31/10 16:01, DEV-only, no `/__peds-review` or `*.mp4` in production); no owner-approved hash existed at P3, so the baseline is established now. Model B hash matches frozen `2D009166…610A2`, stays DEV-only, **commercial/derivative rights unresolved → BLOCKED for production artwork**. Permanent **MODEL / HOMEPAGE VIDEO / BRAND** locks written into this plan, `DESIGN.md` and `AGENTS.md`. QA: lint 0 error/15 warning, typecheck 0, **427 tests** (409 web/70 + 16 API + 2 security), build 9,03 s `index-BESGb1O6.js` 629,53 kB (gzip 91,15 kB), commercial isolation + Cloudflare + secret/asset PASS, **12/12** browser compliance (0 `/images/p4/` requests, 0 images in hero visual, 0 pageerror, 0 overflow), 100/200/400 zoom 0 overflow on results/calendar; logo SHA unchanged. G-1/G-4 PASS, **G-2 not met** (schematic only, no approved independent artwork), G-3 PARTIAL; D-P4-11, D-P4-12, Home 400% 228/153, D-P1-02 remain OPEN. No new EDS-G01 imagery, no cleanup/commit/push/merge/deploy, P5 locked | **P4 ASSET COMPLIANCE — OWNER REVIEW / GATE 4 PENDING / P4 OPEN** |
| **1.4.6** | 2026-11-01 | **P4 Stage A–D (§13.29).** A: owner-approved Homepage film restored as the production hero in `PodiumBrandHero.tsx` — exact pair `hero-h3-2.mp4` (1.761.848 B, `FC9DE024…BD421`) + poster (866.844 B, `98F88281…CC69`), no asset byte changed; DEV-only gate and the EDS-G01 3D scene removed; poster-only fallback on error/ended/reduced-motion/saveData/low-end; no loop/autoplay attr/playbackRate; production-preview evidence 12/12 viewport×lang (`videoCount=1`, `canvasCount=0`, `mentionsG01=false`, overflow 0) + reduced/abort/ended poster, 49 screenshots. B: new `assetLocks.test.ts` (3 hash/size guards) + hero contract in `commercialVisualIsolation.test.ts` + standings zoom contract. C: model-free imagery proposal (options A schematic, B project-authored vector art, C owner-licensed asset, D Model B BLOCKED, E helmet SVGs not recommended); **no asset integrated, G-2 stays PARTIAL**, baseline preview = current schematic screenshots. D: **D-P4-11 closed** via metric-matched fallback faces (CLS VI 0/0,00195/0,00180 vs 0,13296/0,12313; EN 0,02343; Home VI 0,00224); **D-P4-12 closed** (`—` → `86`, never 85); **Home 400% closed** (hero/cards + standings reflow: panel cw=sw=364 at 390 and 1414 at 1440, 0 overflow on 4 routes × EN/VI); **CSP font closed** by font-excluding `assetsInlineLimit` (CSP not widened, 0 warnings in 6 cold runs). No cleanup/commit/push/merge/deploy, P5 locked | **P4 STAGE A–D DONE / HOMEPAGE VIDEO RESTORED / G-2 PARTIAL / OWNER REVIEW** |
| **1.4.7** | 2026-11-01 | **P4 Stage E — final QA + owner gate (§13.30).** Found and closed **D-P4-13**: Home countdown schedule overflowed the viewport by **4 px at 390/EN/200%** (inner schedule +24 px; EN “Qualifying” 156 px in a 99 px text column because `1rem` padding doubles in the 2-column grid). Fix is CSS-only (`@media max-width:767px` + `[data-text-zoom="200"]`: stack to `minmax(0,1fr)`, card padding 16 px, `overflow-wrap:anywhere`) plus a new contract test; font sizes were **not** reduced. Final gates on final source: lint **0 error/15 pre-existing warnings**, typecheck 0, **440 tests** (422 web/73 files + 16 API + 2 security), build 8,84 s `index-BPCFNVq6.js` 629,49 kB gzip 91,12 kB, commercial isolation PASS (114 artifacts), Cloudflare PASS, secret/asset PASS (pinned mp4 allowlist), audit 0 high (12 moderate dev tooling). Browser: **24/24** preview smoke — 0 overflow, 0 CSP, 0 page error, 1 hero video playing/muted/no-loop/rate 1/0 canvas; reduced motion poster-only; blocked video poster-only (no EDS-G01 fallback); Race Center 22 rows; Calendar R19 + timer; **2 VI Results cases only** hit upstream Jolpica **429** (pass-through, focused retest 22 rows/count 86/0 errors at 100–400); **48/48** zoom matrix (390/1440 × EN/VI × 100/200/400 × 4 routes) 0 overflow / 0 inner overflow / 0 CSP / 0 console error; intro visible **3.351 ms**, Escape skip, keyboard hero pause/resume + 2 px ring, results tabs, calendar filters/season/R19/timer; DEV 5173 video plays with 0 canvas/errors. Assets re-verified: mp4 1.761.848 B `FC9DE024…BD421`, poster 866.844 B `98F88281…CC69`, logo hashes, EDS-G01 original 660.192 B `A9A1226D…8325`, Model B frozen `2D009166…610A2`, quarantine **52/52** **3.271.860 B**, 0 `/images/p4/` refs. **G-1/G-4 PASS, G-2/G-3 PARTIAL**, deployment + both data pipelines **NOT RUN** → **HOLD at owner review**, no cleanup/commit/push/merge/deploy, P5 locked | **P4 STAGE A–E DONE / HOMEPAGE VIDEO RESTORED + P4 FINAL OWNER REVIEW / GATE 4 PENDING / P4 OPEN** |
| **1.4.8** | 2026-11-01 | **P4 template-first execution, Stage B–H (§13.32).** Blueprint §13.31 turned into running UI: **8 role / 44 file** model-free artwork (AVIF q52 + WebP q80, multi-width) with `docs/asset-manifests/p4-template-artwork.json` provenance — no EDS-G01, no Model B, no third-party imagery; Race Center hero 105,6 px + 23-round rail + round hero with **ivory** spec rail + 22-row classification (3 podium blocks, 44 team chips, 0 tyre badges — no tyre data); Calendar night hero + Next Race R19 countdown + 5 session cards + outline/ivory/editorial band + previous/upcoming cards; Anime.js **4.5.0** `createScope` with `data-rc-reveal`/`data-cal-group`, reduced motion static. Stage F **24/24** captures (6 viewports × 2 pages × EN/VI, **165 PNG**): 0 overflow, 0 console/page error, 0 failed request, 22 rows / 23 rail rows every case. Stage G re-run on final source: lint **0 error/15 pre-existing warnings**, typecheck 0, **444 tests** (426 web/73 files + 16 API + 2 security), build 7,67 s `index-D6VPtg8P.js` 629,49 kB gzip 91,12 kB, commercial isolation + Cloudflare + secret/asset + dry-run PASS, audit 0 high (12 moderate dev tooling); **30** zoom measurements 0 overflow/clip/error, **21** ivory measurements 0 overflow with contrast 17,22/6,67/8,95:1, keyboard/focus/reduced motion PASS, CLS max **0,0276** / LCP 156–412 ms, provenance limited to `/images/p4/template/`. Closed **D-P4-18** (ivory rail) and **D-P4-19** (labels splitting mid-word at 1024–1280, container query 46–80 em + contract test), fixed D-P4-16/D-P4-17, recorded D-P4-14/D-P4-15 as low open items and O-P4-01…07. Asset locks unchanged (mp4 `FC9DE024…BD421` 1.761.848 B, poster `98F88281…CC69`, logo `226AB6F1…36ACD2`, compact `424A28BF…8176125`, EDS-G01 `A9A1226D…8325`, Model B `2D009166…610A2`, quarantine **52/52** 3.271.860 B). G-1/G-2/G-4 **PASS**, **G-3 PARTIAL** (Lighthouse/axe/INP field/real devices NOT RUN), deployment + both pipelines **NOT RUN** → **HOLD**; no cleanup/commit/push/merge/deploy, P5 locked | **P4 TEMPLATE-FIRST VISUAL + FUNCTIONAL OWNER REVIEW / GATE 4 PENDING / P4 OPEN** |
| **1.4.9** | 2026-11-01 | **P4 Stage I — owner acceptance set + local measurement (§13.33) → `P4 READY FOR OWNER APPROVAL`.** Thi hành REVISION 1.4.8, không redesign/không artwork mới (manifest vẫn 44 file / 3.653.197 B). Acceptance: **60 ảnh runtime** (4 run × 15), **48 crop**, **6 composite** (Calendar mobile NOT AVAILABLE vì mockup không có frame mobile), **video 17,00 s / 1280×720 / 5.146.328 B** WebM — chụp tĩnh bằng `animations:"disabled"` để lấy trạng thái cuối, mockup không dùng làm runtime. A3: giữ `.rc-round-copy h3` italic/uppercase **52,8 px / 28,8 px** theo mockup 02 (D-P4-15 đóng theo mockup). A4: D-P4-14 **CLOSED** (`fallbackTime` + contract test; runtime 0 isolated dot, 5/5 giờ VI/EN). Đóng thêm **D-P4-21** (390/200 % tràn 154 px do sr-only absolute thoát scroller → `position:relative`, 544→390; **24/24** zoom sạch), **D-P4-22** (VI RC CLS **0,1479 → 0,0066** bằng mặt italic `size-adjust` 83/70,5 % + test), **D-P4-20** (tab dùng `aria-label` chứa mã hiển thị + tên đầy đủ → axe mobile **0 violation**, accessible name không lặp), **D-P4-23** (filter count **4,11 → 5,82:1**). Đo: Lighthouse RC/CAL desktop **97/97/100**, LCP **1,2 s**, CLS **0,001**; mobile RC 73 / CAL 65 với **LCP 5,0–5,7 s → FAIL mục tiêu ≤2,5 s (không ghi PASS)**; SEO 66 do `indexing=false`; CLS max **0,0281**; axe desktop 3 `target-size` + mobile 0; keyboard/focus/reduced motion PASS; hydration 22 hàng Qualifying, Race 3 hàng + notice (O-P4-08). Source cuối: lint **0 error/15 warning**, typecheck 0, **445/445 test** (D-P4-24 tự bắt và đóng trong stage), build **8,44 s** `index-DEoggqlp.js` 629,49 kB (gzip 91,12 kB) / `index-XPn6YxVT.css` 184,16 kB, secret/asset/audit/dry-run PASS. G-1/G-2/G-4 **PASS**, **G-3 PARTIAL** (LCP mobile fail, field INP + thiết bị thật NOT RUN), deployment + pipelines **NOT RUN** → **READY FOR OWNER APPROVAL, không phải approval**; no cleanup/commit/push/merge/deploy, P5 locked | **P4 READY FOR OWNER APPROVAL / GATE 4 PENDING / P4 OPEN** |
| **1.5.0** | 2026-11-01 | **P4 DESIGN FIRST — owner override (§13.34) → `P4 DESIGN OWNER REVIEW`.** Dừng vòng tối ưu performance; sửa fidelity RC/CAL theo mockup 02/07: spec rail **dark carbon glass** (correction **D-P4-18** — ivory là premise sai; contract test viết lại theo mockup, không xóa), grade ảnh venue/hero sáng hơn (RC crop `center 64%`, saturate/contrast/brightness), classification carbon `#0c1219/#0a0f15` + team edge/chip + plate vàng/bạc/đồng (**22 hàng / 3 podium / 22 chip / 0 tyre**), Calendar ẩn intro (h1 vẫn trong DOM), spec cell tối, session card hierarchy + hover, Ken Burns/hover có gate `animejs` + `no-preference`. Evidence: **62 PNG** (60 acceptance + 2 reduced-motion), **44 crop**, **6 composite** (CAL mobile NOT AVAILABLE), video **17,60 s / 1280×720 / 5.895.487 B**; ảnh tĩnh chụp reduced-motion final state, crop ẩn chrome **chỉ trong crop**. QA cơ bản: lint **0 error/15 warning cũ**, typecheck 0, **445/445 test** (427 web/73 + 16 API + 2 security), build **7,91 s** `index-CN9SQfcd.js` 629,49 kB gzip 91,13 kB / `index-XPn6YxVT.css` 184,16 kB gzip 29,30 kB, secret/asset PASS, **12/12** responsive smoke (375/768/1440 × EN/VI × RC/CAL) 0 overflow/0 error, **200 % zoom 0 overflow**, keyboard ArrowRight PASS. **Không chạy Lighthouse/axe mới** theo owner override; mobile LCP Stage I vẫn FAIL — không ghi PASS. Không đổi asset/route/API/dữ liệu/3D; locks nguyên vẹn; không commit/push/merge/deploy; G-3 NOT RE-RUN, deployment/pipelines/cleanup NOT RUN → **HOLD tại P4 DESIGN OWNER REVIEW**, P5 khóa | **P4 DESIGN OWNER REVIEW / GATE 4 PENDING / P5 LOCKED** |
| **1.6.0** | 2026-11-02 | **RACE CENTER VENUE HERO — owner correction (§13.35) → `RACE CENTER VENUE HERO OWNER REVIEW`.** Nền hero Race Center chuyển từ minh họa/đường sáng sang **ảnh địa điểm thật theo Grand Prix**: registry **23/23** circuit (`venueHeroes.ts`), ảnh Wikimedia Commons có licence/provenance, **184 file AVIF/WebP** (landscape 1600×900 + portrait 900×1200, 2 width mỗi orientation) **25.619.187 B**, credit tác giả + licence + source link hiển thị trên hero; `WeekendResults.tsx` giữ nguyên title/kicker/meta/availability/trace/spec rail, chỉ thay lớp media `.rc-round-hero`; scrim 3 lớp giữ legibility, transmission đo **0,44–0,60**. Guard `p4AssetCompliance` cập nhật có chủ đích (`template` + `venues`) và thêm test 23 venue/184 output → **8/8** PASS. Evidence: **8 state** (R17 Marina Bay đang chọn + R16 Sepang; desktop 1440×900@1 / mobile 390×844@2; VI/EN) — **20** state shot, **23/23** round desktop, contact sheet **669.936 B**, before/after **233.989 B** desktop + **634.604 B** mobile, zoom 200/400 sạch, **4/4** sticky/classification smoke (142/64 px; R17 22 hàng/3 podium; R16 empty-state đúng dữ liệu), homepage video 1 video/0 canvas, 0 overflow/0 error. QA: lint 0 error/15 warning cũ, typecheck 0, **446 test** (428 web/73 + 16 API + 2 security), build **8,29 s** `index-BB-mRl5e.js` 629,49 kB gzip 91,13 kB / `index-XPn6YxVT.css` 184,16 kB gzip 29,30 kB, SEO 72 route, commercial isolation + Cloudflare + secret/asset PASS, audit 0 high (12 moderate dev tooling). **156 file / 40.006.690 B** artifact scratch trùng/phiên bản cũ được quarantine có manifest, không xóa. Locks nguyên vẹn; không đổi route/API/dữ liệu/Results Engine/3D/dependency; **Lighthouse/axe/Web Vitals NOT RE-RUN**, thiết bị thật/Safari **NOT RUN**, mobile R17 tối và Madrid/COTA/Hungaroring ghi risk; deployment/pipelines/P4 cleanup gate **NOT RUN** → **HOLD tại owner review**, P5 khóa | **RACE CENTER VENUE HERO OWNER REVIEW / GATE 4 PENDING / P5 LOCKED** |
| **1.6.1** | 2026-11-02 | **P4 CLOSEOUT + P5 OPEN (§13.36).** Owner chấp nhận hướng thiết kế P4 — **`P4 DESIGN APPROVED — IMAGE POLISH DEFERRED`**; R17 mobile tối, crop Sepang, Madrid/COTA/Hungaroring và nghĩa vụ ShareAlike chuyển **FINAL IMAGE POLISH BACKLOG** (IPB-01…05, **DEFERRED — không PASS**), không chỉnh ảnh P4. Cleanup: **860 file / 186.935.795 B** candidate/preview venue + 3 plan fragment + 2 empty log **di chuyển, không xóa** tới `scratch/ignition/p4/quarantine/p4-closeout-2026-11-02/`; manifest `scratch/ignition/p4/logs/p4-closeout-cleanup-manifest.json` đủ **860/860** bytes + SHA-256; reference check **PASS**; masters, venue review evidence, EDS-G01 quarantine **52 ảnh**, logo, video/poster, Model B protected. Re-QA: lint **0 error/15 warning cũ**, typecheck 0, **446 test** (428 web/73 + 16 API + 2 security), build **11,07 s** `index-BB-mRl5e.js` 629,49 kB (gzip 91,13 kB) / `index-XPn6YxVT.css` 184,16 kB (gzip 29,30 kB), secret/public boundary PASS, **27/27** browser smoke (9 route × 375/768/1440) 0 overflow/0 error/0 broken image/0 failed request. Assets verified: venue **184 file / 25.619.187 B**, mp4 `FC9DE024…BD421` 1.761.848 B, poster `98F88281…CC69` 866.844 B, logo `226AB6F1…36ACD2`, compact `424A28BF…8176125`, EDS-G01 `A9A1226D…8325` 660.192 B, Model B `2D009166…610A2` 2.120.816 B. **Lighthouse/axe NOT RE-RUN**, deployment + hai pipeline dữ liệu **NOT RUN**; không commit/push/merge/deploy | **P4 DESIGN APPROVED — IMAGE POLISH DEFERRED / P4 CLEANUP_VERIFIED / P5 OPEN** |

| **1.7.0** | 2026-11-02 | **P5 VISUAL DESIGN (§13.37) → `P5 VISUAL DESIGN — OWNER REVIEW`.** Standings cinematic (podium P1 giữa, 23 hàng, last-5/wins/podiums/points, movement chỉ khi verified), Drivers/Teams directory (23/11 card), Driver/Team profile editorial, Anime.js `useP5Reveal` + reduced motion; VI “Podium” singular. Ảnh chân dung: **23/23 Wikimedia Commons** (18 CC BY-SA 4.0, 2 CC BY-SA 2.0, 1 CC BY 4.0, 1 CC BY 2.0, 1 CC0), **138 AVIF/WebP = 7.636.479 B**, manifest + credit hiển thị; không EDS-G01/Model B. Evidence: **88 state** capture (6 viewport × 5 route × EN/VI + refresh/embedded) **0 overflow/0 missing/0 broken/0 console/page/failed**; **140 JPG + 10 crop + 8 contact sheet**; **7 WebM = 19.678.565 B**; interaction **83/83**; preview **20/20** (23 hàng/23 card/11 team, live API replay, 0 warning); API-offline **3/3** (baseline 22 + warning, không crash). Gates: lint toàn repo **7 error P6 scratch ngoài phạm vi**, `apps/web/src` 0 error/7 warning cũ, file P5 0 error/1 warning; typecheck 0; **451 test** (2 test contract P5 cập nhật có chủ đích — owner review); build 13,25 s `index-dEVfD1MN.js` 629,77 kB gzip 91,20 kB; secret/public boundary PASS. Locks/hash nguyên vẹn. Khác biệt template ghi rõ (không points chart, không ảnh xe đội, không tab/DOB/career/founding year, VI display headline EN). **Lighthouse/axe NOT RE-RUN**, legal review portrait **NOT RUN**, deployment/pipelines **NOT RUN** → **HOLD tại P5 OWNER REVIEW**, không cleanup/commit/push/merge/deploy, P6 khóa | **P5 VISUAL DESIGN — OWNER REVIEW / P6 LOCKED** |
| **1.7.1** | 2026-11-02 | **P5 CINEMATIC PHOTOGRAPHY CHECKPOINT (§13.38) → `P5 CINEMATIC PHOTOGRAPHY — OWNER REVIEW`.** 3 driver mẫu (Antonelli/Verstappen/Hamilton) có đủ Serious Portrait + Race Mode + On-Track Action; registry khóa `driverId:season`, **54 output AVIF/WebP = 3.825.982 B**, provenance event/artist/licence/sourcePage/cropNote/SHA-256, credit hiển thị; không EDS-G01/Model B/ảnh AI. Sửa **D-P5-CP-01**: action plate trước đây gần vô hình sau gradient → hero + action editorial plate trong một `.p5-profile-stage` (desktop 58/42 16:9, mobile 4:5, ghost number, event + credit), source `DriverDetailPage.tsx` + `p5Cinematic.css`. Gallery: RACE MODE chỉ trên 3 card có registry, keyboard Space/`aria-pressed`, overlay link nguyên; standings podium hover race; team duo hover; crossfade 240–260 ms, reduced-motion **1e-05 s**. Evidence: checkpoint **14 step** — 0 overflow/console/pageerror/failed request; **3 profile × 3 trạng thái** (`04/04b/04c`, `04d/04db/04dc`, `04g/04gb/04gc`, stage 1022 px, action 460 px loaded) + gallery/standings/team/mobile/tablet PNG (tổng 35 PNG trong checkpoint). Gates: typecheck 0; ESLint file đổi 0 error; **repo lint FAIL 8 error P6 scratch ngoài phạm vi**; **433 test web/74 file serialized** (parallel 3 timeout môi trường, isolated 21/21) + 16 API + 2 security = **451**; build `index-CWFBvCh7.js` 629.715 B gzip 91.177 B / CSS 184.159 B; **Lighthouse/axe NOT RUN** theo owner. **D-P5-CP-02…04 OPEN** (race crop car-dominant/visor, Hamilton portrait kính râm, 20/23 driver chưa có imagery); legal review, VI full capture, Safari/Firefox/real devices **NOT RUN**; deployment/pipelines **NOT RUN** → **HOLD tại owner review**, không cleanup/commit/push/merge/deploy, P6 khóa | **P5 CINEMATIC PHOTOGRAPHY — OWNER REVIEW / P6 LOCKED** |

## 15. LOCAL AGENT — COPY/PASTE EXECUTION PROMPT (CHỈ P0)

```text
You are Codex/Antigravity operating on the owner's Windows local checkout
E:\Formula 1\Podium-Effet-De-Sol, repository DB-Ducbao113/Podium-Effet-De-Sol.

TASK: Execute ONLY Phase 0 (P0-A through P0-E) of docs/IGNITION_MASTER_PLAN.md.
No feature implementation, no UI edits, no dependency/skill installs, no asset deletion.
Never stage, commit, push, merge, deploy, reset, stash, or git clean.

1. Read the master plan, AGENTS.md if present, README.md, PRODUCT.md, DESIGN.md,
   docs/PODIUM_EDS_MASTER_SUMMARY.md, docs/architecture.md, docs/security.md,
   docs/asset-licenses.md, applicable QA reports.
2. Inspect `git status --short --branch`, `git rev-parse HEAD`, tracked files in docs,
   and untracked/new local docs. IDENTIFY AND READ ALL THREE NEW DOCUMENTS the owner
   added locally; list exact filenames/paths + sha256; if you cannot identify 3, STOP
   and mark P0-A HOLD without claiming completion. Extract only supported requirements.
3. Verify current routes, component hierarchy, library versions, real agent skills
   present on disk (not assumed installed); examine refs/mockup screenshots and
   source/rights. Map each requirement to route/component/test.
4. Take BEFORE screenshots of the REAL local app at 375, 390, 768, 1024,
   1440, 1920 widths, English and Vietnamese, consistent state. Use existing
   Playwright tooling where possible. Store screenshots/videos/logs only under
   ignored scratch/ignition/p0-baseline/. If unavailable mark NOT RUN; do not
   substitute mockup or static preview as runtime QA.
5. Inventory existing intro/animejs animations, actual timelines, 3D model B,
   Inside the Machine 6 chapters and adaptive quality; measure performance only
   when a suitable local browser/device is available, include context and metrics.
6. Update docs/IGNITION_MASTER_PLAN.md IN PLACE with exact 3-doc register,
   priority/conflict matrix, verified code baseline, P1-P8 scope amendments and
   decisions that need owner approval. Do not create alternative plan files.
7. Return concise P0 Owner Review: evidence, findings, before screenshots path,
   skill/library decision matrix, risks, unknowns, suggested revised phases,
   expected cleanup candidate inventory. STOP; ask for Owner Gate 0 approval.

HARD REQUIREMENTS: protect all owner files and model source; no changes to Model B,
ITM, results engine, APIs, navigation or production build; no cleanup in P0.
Ensure the distinction between DEV and production remains explicit.
```

**Prompt trên là bản P0 đã chạy; không dùng lại cho P1.** P1 đã được owner mở sau `GATE 0 APPROVED` và hiện ở trạng thái QA_READY tại §13.14; Gate 1 chờ owner xác nhận.

**End state:** Gate 0, Gate 1, Gate 2 và Gate 3 đã hoàn tất; P1 được owner phê duyệt và cleanup verified tại §13.15; P2 được owner phê duyệt, cleanup verified và re-QA tại §13.19; P3 hoàn tất tại §13.20–§13.24 và được owner phê duyệt tại Gate 3. P4 đã triển khai Race Center + Calendar (§13.25), vòng Gate 4 visual + functional (§13.26), vòng cinematic acceptance bị owner từ chối hình ảnh (§13.27), và vòng **asset compliance** tại §13.28: owner ra **CRITICAL OWNER OVERRIDE** xác lập **MODEL LOCK / HOMEPAGE VIDEO LOCK / BRAND LOCK**; toàn bộ **36 plate dẫn xuất từ EDS-G01 đã bị gỡ** khỏi UI, public tree và build, được bảo quản ngoài production tại `scratch/ignition/p4/quarantine/eds-g01-artwork/` (**52 file, 3.271.860 B**, SHA-256 per file). Stage A–D (§13.29) đã **khôi phục Homepage video đã duyệt làm hero production** (mp4 `fc9de024…bd421` 1.761.848 B + poster `98f88281…cc69` 866.844 B, không đổi byte; không 3D/canvas; poster-only fallback), thêm guard `assetLocks`, và đóng **D-P4-11** (CLS VI 0/0,00195/0,00180), **D-P4-12** (`—` → 86), **Home 400%** (0 overflow 390/1440 × EN/VI) cùng **CSP font** (không mở rộng CSP); Dept P4 vẫn giữ sticky controls, bảng 22 hàng tint đội, filters, Next GP R19 + countdown, responsive, keyboard, reduced motion. Logo SHA-256 không đổi; Model B ngoài production, frozen hash khớp, **commercial/derivative rights chưa xác minh → BLOCKED cho artwork production**; imagery P4 vẫn **schematic-only** nên **G-2 PARTIAL** cho tới khi owner chọn phương án ở §13.29C; **G-3 PARTIAL** (Lighthouse/axe/INP field/thiết bị thật NOT RUN). Stage E (§13.30) chạy final QA trên cùng local production build, phát hiện và đóng **D-P4-13** (Home countdown tràn 4 px tại 390/EN/200% — fix CSS-only + contract test, font size không bị hạ), và xác minh lại toàn bộ: **440** test, build 8,84 s `index-BPCFNVq6.js` 629,49 kB (gzip 91,12 kB), **24/24** preview smoke với 0 overflow/0 CSP/0 page error, **48/48** zoom matrix 0 overflow, hero video phát 12/12 tổ hợp, reduced-motion và video-blocked chỉ dùng poster (không EDS-G01), intro 3.351 ms, keyboard/focus PASS, asset locks + **52/52** quarantine còn nguyên. Hai case VI Results chỉ gặp **429 upstream Jolpica** (pass-through, retest sạch 22 hàng/count 86). **Deployment và hai pipeline dữ liệu NOT RUN**; G-2/G-3 vẫn PARTIAL.

**End state (cập nhật 01/11/2026 — Stage F–H, §13.32):** blueprint §13.31 đã được triển khai thành UI thật: **8 role / 44 file** artwork độc lập model-free (**3.653.197 B**, provenance tại `docs/asset-manifests/p4-template-artwork.json`), Race Center với hero photographic + H2 105,6 px + rail 23 round + round hero ivory spec rail + **22 hàng** classification, Calendar với hero night plate + Next Race R19 countdown + 5 session card + band outline/ivory/editorial + 2 card previous/upcoming, motion Anime.js **4.5.0** `createScope` và reduced-motion tĩnh. Stage F **24/24** capture VI/EN × 6 viewport (165 PNG) sạch; Stage G trên source cuối: lint 0 error/15 warning cũ, typecheck 0, **444 test**, build 7,67 s `index-D6VPtg8P.js` 629,49 kB (gzip 91,12 kB), commercial isolation + Cloudflare + secret/asset + dry-run PASS, audit 0 high, **30** phép đo zoom và **21** phép đo ivory 0 overflow, CLS max 0,0276 / LCP 156–412 ms. **G-2 chuyển từ PARTIAL sang PASS**; **G-1/G-4 PASS**, **G-3 PARTIAL** (Lighthouse/axe/INP field/thiết bị thật NOT RUN). Asset locks nguyên vẹn (mp4, poster, logo, EDS-G01, Model B, quarantine **52/52**). Trạng thái hiện tại là **`P3 APPROVED / CLEANUP_VERIFIED / GATE 3 GO / P4 TEMPLATE-FIRST VISUAL + FUNCTIONAL OWNER REVIEW / GATE 4 PENDING / HOLD`**. Commit, push, merge và deploy đều bị khóa.

**End state (cập nhật 01/11/2026 — Stage I, §13.33):** acceptance set theo REVISION 1.4.8 đã hoàn tất trên **source cuối**: **60 ảnh runtime** (4 run × 15), **48 crop**, **6 composite** (Calendar mobile không có frame mockup → **NOT AVAILABLE**), **video 17,00 s / 1280×720 / 5.146.328 B**; ảnh tĩnh chụp `animations:"disabled"`, mockup không dùng làm runtime, không đánh dấu 100 % fidelity. Không redesign, không artwork mới (**44 file / 3.653.197 B** giữ nguyên). Đóng **D-P4-14** (guard `fallbackTime` + test; 5/5 giờ, 0 isolated dot), **D-P4-15** (giữ round hero italic/uppercase theo mockup 02), **D-P4-20** (axe mobile 0), **D-P4-21** (390/200 % 544 → **390 px**; **24/24** zoom sạch), **D-P4-22** (VI RC CLS **0,1479 → 0,0066**), **D-P4-23** (filter count **5,82:1**), **D-P4-24** (guard `sessionCountSettling` fail do Prettier reflow → khôi phục layout, không sửa test). Đo local: Lighthouse desktop **97/97/100** (LCP 1,2 s, CLS 0,001), mobile 73/65 với **LCP 5,0–5,7 s → FAIL mục tiêu, không ghi PASS**; SEO 66 do `indexing=false`; CLS max **0,0281**; axe desktop 3 `target-size` (header) + mobile 0; keyboard/focus/reduced-motion PASS; hydration 22 hàng Qualifying, Race 3 hàng + notice (O-P4-08). Source cuối: lint 0 error/15 warning cũ, typecheck 0, **445/445 test**, build 8,44 s `index-DEoggqlp.js` 629,49 kB (gzip 91,12 kB) / `index-XPn6YxVT.css` 184,16 kB, secret/asset/audit/dry-run PASS; asset locks và quarantine **52/52** nguyên vẹn. Trạng thái: **`P3 APPROVED / CLEANUP_VERIFIED / GATE 3 GO / P4 READY FOR OWNER APPROVAL / GATE 4 PENDING / P4 OPEN`** — **chưa phải owner approval**. G-3 còn PARTIAL; deployment và hai pipeline dữ liệu NOT RUN. Không cleanup/commit/push/merge/deploy; P5 khoá tới khi có `APPROVED P4` và `P4 CLEANUP_VERIFIED`.

**End state (cập nhật 01/11/2026 — P4 DESIGN FIRST, §13.34):** owner override **DESIGN FIRST** được thi hành: dừng vòng tối ưu performance, không mở Lighthouse/LCP/CLS mới; sửa fidelity Race Center/Calendar theo **mockup 02/07** — spec rail chuyển sang **dark carbon glass** (correction **D-P4-18**, contract test viết lại theo mockup), ảnh venue/hero sáng và crop thấp hơn, classification carbon + plate podium vàng/bạc/đồng, Calendar ẩn intro (h1 vẫn trong DOM), spec cell tối, session card rõ thứ bậc, Ken Burns/hover có gate motion. Bộ nghiệm thu: **62 PNG** (60 acceptance + 2 reduced-motion), **44 crop**, **6 composite** (Calendar mobile **NOT AVAILABLE**), video **17,60 s / 1280×720 / 5.895.487 B**; ảnh tĩnh ở trạng thái cuối, mockup không dùng làm runtime, không tuyên bố 100 % fidelity. QA cơ bản: lint **0 error/15 warning cũ**, typecheck 0, **445/445 test**, build **7,91 s** `index-CN9SQfcd.js` 629,49 kB (gzip 91,13 kB) / `index-XPn6YxVT.css` 184,16 kB (gzip 29,30 kB), secret/asset PASS, **12/12** responsive smoke 0 overflow/0 error, **200 % zoom** 0 overflow, keyboard PASS. Artwork/tài sản khoá nguyên vẹn (44 file / 3.653.197 B; mp4, poster, logo, EDS-G01, Model B, quarantine **52/52**). **Lighthouse/axe NOT RE-RUN**, G-3 không tái đo; deployment, hai pipeline dữ liệu và cleanup **NOT RUN**. Trạng thái: **`P3 APPROVED / CLEANUP_VERIFIED / GATE 3 GO / P4 DESIGN OWNER REVIEW / GATE 4 PENDING / P5 LOCKED`** — **chưa phải owner approval**. Không commit/push/merge/deploy; P5 khoá tới khi có `APPROVED P4` và `P4 CLEANUP_VERIFIED`.

**End state (cập nhật 02/11/2026 — RACE CENTER VENUE HERO, §13.35):** owner correction “hero phải là ảnh địa điểm thật theo Grand Prix” đã được thi hành trên source hiện tại: registry **23/23** circuit, **23 ảnh** Wikimedia Commons có licence/provenance (9 CC BY-SA 4.0, 5 CC BY-SA 3.0, 2 CC BY-SA 2.0, 1 CC BY-SA 2.5, 3 CC BY 2.0, 1 CC0, 2 Public domain), **184 output AVIF/WebP** (landscape 1600/960 + portrait 900/600) tổng **25.619.187 B**, credit tác giả/licence/source hiển thị trên hero. `WeekendResults.tsx` chỉ thay lớp media; title/kicker/meta/availability/trace/spec rail và dữ liệu giữ nguyên. Guard `p4AssetCompliance` được cập nhật **có chủ đích** (`template` + `venues`) và bổ sung test 23 venue/184 file → **8/8** PASS. Evidence: **8 state** runtime (R17 Marina Bay đang chọn + R16 Sepang; desktop/mobile; VI/EN), **23/23** round desktop, contact sheet **669.936 B**, before/after **233.989 B** desktop + **634.604 B** mobile; transmission **0,44–0,60** chứng minh ảnh không bị scrim xóa; zoom 200/400 sạch; **4/4** sticky/classification smoke (142/64 px, R17 22 hàng/3 podium, R16 empty-state); homepage video 1 video/0 canvas, poster-only khi ended; 0 overflow/0 console/page/request error. QA: lint **0 error/15 warning cũ**, typecheck 0, **446 test** (428 web/73 + 16 API + 2 security), build **8,29 s** `index-BB-mRl5e.js` 629,49 kB gzip 91,13 kB / `index-XPn6YxVT.css` 184,16 kB gzip 29,30 kB, SEO 72 route, commercial isolation + Cloudflare + secret/public boundary PASS, audit 0 high (12 moderate dev tooling). **156 file / 40.006.690 B** artifact scratch trùng/phiên bản cũ đã quarantine có manifest, không xóa. Locks (video/poster/logo/EDS-G01/Model B/quarantine 52/52) nguyên vẹn; không đổi route/API/dữ liệu/Results Engine/3D/dependency. **Lighthouse/axe/Web Vitals NOT RE-RUN**, thiết bị thật/Safari/screenreader **NOT RUN**, R17 mobile tối + Madrid/COTA/Hungaroring + nghĩa vụ ShareAlike ghi thành risk chờ owner; deployment, hai pipeline dữ liệu và P4 cleanup gate **NOT RUN**. Trạng thái: **`P3 APPROVED / CLEANUP_VERIFIED / GATE 3 GO / P4 RACE CENTER VENUE HERO OWNER REVIEW / GATE 4 PENDING / P5 LOCKED`** — **chưa phải owner approval**. Không commit/push/merge/deploy; P5 khoá tới khi có `APPROVED P4` và `P4 CLEANUP_VERIFIED`.

**End state (cập nhật 02/11/2026 — P4 CLOSEOUT, §13.36):** owner chấp nhận hướng thiết kế P4 — **`P4 DESIGN APPROVED — IMAGE POLISH DEFERRED`**. R17 mobile tối, crop Sepang, Madrid/COTA/Hungaroring, nghĩa vụ ShareAlike và 21 venue chưa review mobile crop được ghi thành **FINAL IMAGE POLISH BACKLOG IPB-01…05** — **DEFERRED, không phải PASS**, không chỉnh ảnh P4 trong vòng này. Cleanup an toàn: **860 file / 186.935.795 B** candidate/preview venue đã bị thay bởi runtime outputs + 3 plan fragment + 2 empty log được **di chuyển, không xóa** tới `scratch/ignition/p4/quarantine/p4-closeout-2026-11-02/`; manifest `scratch/ignition/p4/logs/p4-closeout-cleanup-manifest.json` có **860/860** bytes + SHA-256; reference check **PASS**; masters/evidence/logo/video/poster/EDS-G01/Model B/quarantine được bảo vệ. Re-QA: lint **0 error/15 warning cũ**, typecheck 0, **446 test**, build **11,07 s** `index-BB-mRl5e.js` 629,49 kB / `index-XPn6YxVT.css` 184,16 kB, secret/public boundary PASS, **27/27** browser smoke 0 overflow/0 error/0 broken image/0 failed request. Venue **184 file / 25.619.187 B** và toàn bộ hash khoá khớp. **Lighthouse/axe NOT RE-RUN**, G-3 **PARTIAL / NOT RE-RUN**; deployment, hai pipeline dữ liệu và P4 production cleanup **NOT RUN**. Trạng thái: **`P4 DESIGN APPROVED — IMAGE POLISH DEFERRED / P4 CLEANUP_VERIFIED / P5 OPEN`**; không commit/push/merge/deploy.

**END — P1 APPROVED / CLEANUP_VERIFIED / GATE 1 GO; P2 APPROVED / CLEANUP_VERIFIED / GATE 2 GO; P3 APPROVED / CLEANUP_VERIFIED / GATE 3 GO; P4 DESIGN APPROVED — IMAGE POLISH DEFERRED / CLEANUP_VERIFIED / GATE 4 PENDING; P5 VISUAL DESIGN — OWNER REVIEW (§13.37) / HOLD. No commit/push/merge/deploy. P5 cleanup locked; P6 locked.**
