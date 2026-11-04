# PODIUM EDS — IGNITION | Visual Design Review v1

> Trạng thái: **Concept / chưa áp dụng vào repo / chưa triển khai production.** Các dữ liệu tay đua, điểm số, lịch đua, đội, thông số, tên chương, ngày giờ trong ảnh là **minh họa** (không phải API chính thức).

## 1. Hệ thống giao diện chung

- Cảm giác: Cinematic Motorsport + Racing Editorial + Telemetry Dashboard; nổi bật tốc độ nhưng vẫn tối giản khi thao tác dữ liệu.
- Màu: Carbon `#0A0C10`, Ignition `#FF4A18`, Racing Red `#E51B37`, Ivory `#F4F0E8`, Signal `#B7FF37`.
- Typography đề xuất: Barlow Condensed / Bebas Neue cho display; Manrope cho UI; IBM Plex Mono cho số liệu (kiểm tra giấy phép và self-host trước triển khai).
- Header chung, breadcrumb, title lớn; active tab màu cam; trạng thái chưa có dữ liệu là trung tính, không bịa kết quả.
- Team identity: dùng màu phủ có kiểm soát (tint/gradient và contrast), không chỉ vệt màu. Màu không phải dấu hiệu nhận biết duy nhất.
- Mobile: giảm mật độ, ưu tiên nội dung và truy cập; horizontal session tabs có thể cuộn, luôn thấy tab đang chọn.

## 2. Template theo trang và tab

### 01 — HOME / OVERVIEW
- Hero với Model B Optimized nếu máy đáp ứng; poster ảnh thay thế khi máy yếu; không bắt người dùng chờ video/intro mới vào trang.
- CTA Race Center, Showroom; cards dẫn Drivers, Teams, Standings, Engineering.
- Motion: split-text reveal, controlled parallax và CTA hover; tránh looping particle toàn màn hình.

### 02 — RACE CENTER / COMPETITION
- Round selector theo mùa; bộ lọc Completed / Live / Upcoming; tất cả vòng đua có lịch có thể thấy trong lịch, nhưng **Results chỉ hiển thị vòng có kết quả hợp lệ**.
- Session tabs: FP1, FP2, FP3, Qualifying (Q1/Q2/Q3), Sprint (nếu có), Race; session absent/unavailable có trạng thái riêng, không hiển thị kết quả giả.
- Nội dung của mỗi tab: bảng phân loại; metadata (vòng, thời gian, thời tiết nếu API hỗ trợ), và các phân tích có dữ liệu thật.
- Sticky session navigation (không cuộn lên đầu khi đổi chặng); reset/giữ scroll có chủ đích.
- Race secondary tabs: Results, Lap Chart, Stints, Tyre Strategy (chỉ hiển thị khi dữ liệu/cơ sở quyền cho phép).

### 03 — STANDINGS / DRIVERS
- Top tabs: Drivers Championship / Constructors Championship; filter season, search.
- Bảng tay đua: rank, driver, team, points, từng round; chart điểm mùa giải; team-colored row backdrop đủ contrast.
- Driver profile: Overview, Results, Season, Career, Stats; CTA chuyển team; số liệu từ API.
- Mobile: cards cho top 3 + compact table; sticky filters, horizontal scroll data table có dấu hiệu trực quan.

### 04 — TEAMS / CONSTRUCTORS
- Constructors: bảng điểm, điểm round, so sánh 2 tay đua, xu hướng mùa giải.
- Team profile: Overview, Drivers, Car, Season/Results, History; team color chiếm vùng hero/bề mặt chính; logo độc quyền chỉ dùng khi đã kiểm chứng quyền.
- 'View car in 3D' liên kết đến Showroom với livery lấy cảm hứng màu, không sao chép nhận diện đã bảo hộ.

### 05 — ENGINEERING
- Inside the Machine: chapter navigation Aerodynamics, Power Unit, Chassis, Suspension, Tyres, Safety; 3D storytelling tiết chế và có ảnh tĩnh thay thế.
- Car Anatomy: chọn bộ phận bằng label/hotspot, mở panel thông tin, exploded view có lựa chọn tắt hiệu ứng; giữ vị trí context.
- Engineering Insights: All / Aerodynamics / Power Unit / Chassis / Suspension / Tyres / Safety; list cards, search, article reader.
- Không giả định mọi chương đã được triển khai; ưu tiên cấu trúc đang có trong repo khi làm thật.

### 06 — 3D SHOWROOM
- Xe làm trung tâm; loại panel trái dư thừa và các control trùng lặp; các chế độ camera dưới canvas; Zoom trong vùng canvas.
- Bên phải: Paint, Camera, Lighting; dưới là Advanced Settings dạng accordion (không bị cắt ở 768/900px chiều cao).
- Team-inspired paint swatches không logo; chọn Glossy/Matte/Satin/Carbon; preset và reset.
- Model B Optimized; Adaptive Quality Auto/Balanced/Eco, giảm pixel ratio, shadow, post-processing khi cần; fallback ảnh.

### 07 — CALENDAR / CIRCUITS / STORIES (màn hình concept bổ trợ)
- Calendar: All / Completed / Upcoming; list round và schedule sessions đúng múi giờ user; trạng thái không có dữ liệu rõ ràng.
- Circuits: Overview / Track Map / Race History; map/hotspots, đoạn cua, sector, DRS chỉ khi có dữ liệu đáng tin cậy.
- Stories: Index / Category / Article; layout editorial, in-page table of contents cho bài dài.
- Các route này cần đối chiếu với repo thực tế trước khi đưa vào scope phát triển.

## 3. Motion & hiệu năng

- Intro (mục tiêu thiết kế, chưa đo): 0.8–1.2 giây, có skip và không chặn tương tác chính.
- Page transition (mục tiêu): 250–450 ms; content reveal: 400–650 ms, reduced-motion có full access.
- Microinteractions: sliding underline, active rail, edge glow có tiết chế, spring ngắn.
- Ưu tiên CSS transform/opacity; lazy-load WebGL; tránh overdraw, animate box-shadow/blur diện rộng; giới hạn animation đồng thời.
- QA tương lai: 375, 768, 1024, 1440, 1920px; keyboard, contrast, reduced motion, LCP/CLS/INP, browsers, low-end GPUs.

## 4. Reference mapping

- animejs.com — timeline / reveals / scroll choreography.
- microkit.co — microinteraction, sliding tabs, CTA hover.
- kinetics.colorion.co — spring motion principles.
- threejs.org — WebGL scene and material controls.
- gsap.com — reference for scroll timelines (avoid stacking animation frameworks without reason).
- github.com/zanwei/design-dna — tokens, style and effects extraction.
- uiverse.io/elements, liquidglassdesign.com — decorative control references, selectively.
- 3dicons.co, kitbitz.art — icon inspiration subject to license verification.
- getdesign.md/mobbin/design-md — information hierarchy inspiration.
- mapen — interactive circuit-map inspiration (exact project/source and license still to verify).

## 5. Owner review / guardrails

- Đây là visual exploration: hình ảnh dựng có thể không phản ánh cấu trúc chi tiết/độ chính xác vật lý hoặc lịch giải thật.
- Kiểm tra quyền dùng font, logo, ảnh, model, dữ liệu F1 trước thương mại hóa.
- Giữ QA/release gates của Podium EDS: **không tự ý stage, commit, push, merge hoặc deploy** trong giai đoạn duyệt thiết kế.
