# Inside the Machine V2 — Component-by-component execution backlog

Repository: `DB-Ducbao113/Podium-Effet-De-Sol`  
Base: `migration/clean-architecture`  
Feature branch: `feat/engineering-inside-machine-v2`  
Scope: **Engineering ONLY**, DEV first; release HOLD.

## Contract

- Source of IDs: user-supplied `inside-the-machine.zip`, `exports/assembly-manifest-r4-5.json`.
- R4.5: 10 external assemblies + 3 internal systems = **13 systems**; **65 components** + 10 external control objects = 75 semantic transform controls.
- REV4.2 runtime has a verified 75-transform story with 6 chapters; **do not overwrite it with the earlier F1-Overview prototype**. Add design incrementally behind the existing DEV-only Engineering entry.
- R4.5 manifest: `animation.reassemblyPass=false`, `shaftHubMechanicalEngagementProven=false`. These are open gates. The R4.5 GLBs are **not** yet an accepted replacement for the verified REV4.2 runtime.
- Model B reference geometry is not a confirmed 2026 F1 car; r4.3 internal systems are author-illustrated educational examples. Never imply accurate team engineering or true CFD/telemetry data.
- Visual direction: graphite `#080D15`, ignition orange `#FF5635`, telemetry cyan `#56D4E9` only for actual technical data, blueprint `#EEF3F5`.
- No team branding without commercial-rights proof. No merge or deploy without owner review.

## Mandatory microsteps, repeated for every one of the 65 parts

1. **M0 / Inventory:** verify the semantic ID and GLB node, record authored/source provenance, original local/world matrices, bounds, normals.
2. **M1 / Geometry:** inspect mesh islands, nonmanifold edges, UV seams, hard edges, fastener anchors; repair in a copied Blender source, preserve original files.
3. **M2 / Materials:** author a roughness/metalness reference and 3 stills (macro, isometric, attachment). One real body-paint tone per car across all angles.
4. **M3 / Motion:** animate from immutable baseline using authored offset + converted axes (Z-up → GLB Y-up), staged mechanical ordering, pause, reverse and direct seeking.
5. **M4 / Camera:** record focus pivot, shot framing, unclipped label anchor, blueprint/solid transitions, touch-friendly mobile composition.
6. **M5 / QA:** sample 0/25/50/75/100% and reverse; compare world matrices; no interpenetration/ghost duplicate; profile HIGH/BALANCED/PERFORMANCE.
7. **M6 / Accessibility:** keyboard, reduced motion, labelled controls, overlay readability and non-WebGL fallback.
8. **M7 / Evidence:** 3 reference renders, before/after sheet, short clip, transform diff, provenance record, triangle/draw-call deltas and owner decision.

Per-part statuses: `TODO → IN_PROGRESS → REVIEW → PASS / BLOCKED`. Work on one module at a time. No silent skip.

## Execution waves

- **W0:** baseline screenshots, mesh inventory, source provenance, transform contract, design tokens.
- **W1:** front-left corner 7/7. Owner review before propagating material/motion rules to mirrored corners.
- **W2:** front-right and two rear wheels 21/21; mirror validation and wheel-first reassembly.
- **W3:** front/rear wings 8/8; aerodynamic visual correctness and sharp linework.
- **W4:** cockpit/halo, sidepods and underfloor 14/14; visible aero architecture without invented internals.
- **W5:** twin cooling packages and powertrain 15/15; illustrative labels and technical cutaways.
- **W6:** combined scene choreography, UI fit, browser QA, CPU/GPU performance and all release gates.

## Individual component design tickets

### 01 · Bánh trước trái — `FRONT_LEFT_WHEEL` (7 components)

**Camera/geometry requirement:** Góc front-left, macro hub, mở ra theo +Y nguồn, không xuyên mặt đĩa.

| Ticket | Exact semantic ID | Visual / movement / inspection deliverable | Status |
|---|---|---|---|
| V2-01-01 | `FRONT_LEFT_WHEEL.CENTER_LOCK_NUT` | Titanium satin · xoay nhả có giới hạn + tịnh tiến đúng trục · không xuyên wheel face | TODO |
| V2-01-02 | `FRONT_LEFT_WHEEL.WHEEL_OUTER` | Rubber + metallic rim · tách thẳng trục, giữ silhouette · hai phía nhất quán | TODO |
| V2-01-03 | `FRONT_LEFT_WHEEL.WHEEL_HUB` | Gunmetal/titanium · lộ chốt, giữ trục tâm · kiểm chứng mating với shaft | TODO |
| V2-01-04 | `FRONT_LEFT_WHEEL.BRAKE_DISC` | Carbon-brake · đọc được mặt đĩa và vent · vật liệu matte chịu sáng | TODO |
| V2-01-05 | `FRONT_LEFT_WHEEL.BRAKE_CALIPER` | Satin gunmetal · tách khỏi disc không va chạm · giữ cấu trúc clamp | TODO |
| V2-01-06 | `FRONT_LEFT_WHEEL.SUSPENSION_LINKS` | Carbon composite + metal joints · tháo cuối · pivot và góc khớp đúng | TODO |
| V2-01-07 | `FRONT_LEFT_WHEEL.HUB_MOUNT_INTERFACE` | Titanium join · lộ mặt gá · chưa thể claim shaft-hub engagement | TODO |

**Module acceptance:** every ticket M0–M7 PASS, no missing semantic nodes, three review angles, deterministic roundtrip, no material inconsistency; publish a dedicated QA/evidence folder before unblocking the next wave.

### 02 · Bánh trước phải — `FRONT_RIGHT_WHEEL` (7 components)

**Camera/geometry requirement:** Đối xứng với bánh trước trái, offset theo -Y nguồn.

| Ticket | Exact semantic ID | Visual / movement / inspection deliverable | Status |
|---|---|---|---|
| V2-02-01 | `FRONT_RIGHT_WHEEL.CENTER_LOCK_NUT` | Titanium satin · xoay nhả có giới hạn + tịnh tiến đúng trục · không xuyên wheel face | TODO |
| V2-02-02 | `FRONT_RIGHT_WHEEL.WHEEL_OUTER` | Rubber + metallic rim · tách thẳng trục, giữ silhouette · hai phía nhất quán | TODO |
| V2-02-03 | `FRONT_RIGHT_WHEEL.WHEEL_HUB` | Gunmetal/titanium · lộ chốt, giữ trục tâm · kiểm chứng mating với shaft | TODO |
| V2-02-04 | `FRONT_RIGHT_WHEEL.BRAKE_DISC` | Carbon-brake · đọc được mặt đĩa và vent · vật liệu matte chịu sáng | TODO |
| V2-02-05 | `FRONT_RIGHT_WHEEL.BRAKE_CALIPER` | Satin gunmetal · tách khỏi disc không va chạm · giữ cấu trúc clamp | TODO |
| V2-02-06 | `FRONT_RIGHT_WHEEL.SUSPENSION_LINKS` | Carbon composite + metal joints · tháo cuối · pivot và góc khớp đúng | TODO |
| V2-02-07 | `FRONT_RIGHT_WHEEL.HUB_MOUNT_INTERFACE` | Titanium join · lộ mặt gá · chưa thể claim shaft-hub engagement | TODO |

**Module acceptance:** every ticket M0–M7 PASS, no missing semantic nodes, three review angles, deterministic roundtrip, no material inconsistency; publish a dedicated QA/evidence folder before unblocking the next wave.

### 03 · Bánh sau trái — `REAR_LEFT_WHEEL` (7 components)

**Camera/geometry requirement:** Rear-quarter macro, tách riêng liên kết cầu sau.

| Ticket | Exact semantic ID | Visual / movement / inspection deliverable | Status |
|---|---|---|---|
| V2-03-01 | `REAR_LEFT_WHEEL.CENTER_LOCK_NUT` | Titanium satin · xoay nhả có giới hạn + tịnh tiến đúng trục · không xuyên wheel face | TODO |
| V2-03-02 | `REAR_LEFT_WHEEL.WHEEL_OUTER` | Rubber + metallic rim · tách thẳng trục, giữ silhouette · hai phía nhất quán | TODO |
| V2-03-03 | `REAR_LEFT_WHEEL.WHEEL_HUB` | Gunmetal/titanium · lộ chốt, giữ trục tâm · kiểm chứng mating với shaft | TODO |
| V2-03-04 | `REAR_LEFT_WHEEL.BRAKE_DISC` | Carbon-brake · đọc được mặt đĩa và vent · vật liệu matte chịu sáng | TODO |
| V2-03-05 | `REAR_LEFT_WHEEL.BRAKE_CALIPER` | Satin gunmetal · tách khỏi disc không va chạm · giữ cấu trúc clamp | TODO |
| V2-03-06 | `REAR_LEFT_WHEEL.SUSPENSION_LINKS` | Carbon composite + metal joints · tháo cuối · pivot và góc khớp đúng | TODO |
| V2-03-07 | `REAR_LEFT_WHEEL.HUB_MOUNT_INTERFACE` | Titanium join · lộ mặt gá · chưa thể claim shaft-hub engagement | TODO |

**Module acceptance:** every ticket M0–M7 PASS, no missing semantic nodes, three review angles, deterministic roundtrip, no material inconsistency; publish a dedicated QA/evidence folder before unblocking the next wave.

### 04 · Bánh sau phải — `REAR_RIGHT_WHEEL` (7 components)

**Camera/geometry requirement:** Rear-quarter phải, kiểm tra phản chiếu đúng hệ tọa độ.

| Ticket | Exact semantic ID | Visual / movement / inspection deliverable | Status |
|---|---|---|---|
| V2-04-01 | `REAR_RIGHT_WHEEL.CENTER_LOCK_NUT` | Titanium satin · xoay nhả có giới hạn + tịnh tiến đúng trục · không xuyên wheel face | TODO |
| V2-04-02 | `REAR_RIGHT_WHEEL.WHEEL_OUTER` | Rubber + metallic rim · tách thẳng trục, giữ silhouette · hai phía nhất quán | TODO |
| V2-04-03 | `REAR_RIGHT_WHEEL.WHEEL_HUB` | Gunmetal/titanium · lộ chốt, giữ trục tâm · kiểm chứng mating với shaft | TODO |
| V2-04-04 | `REAR_RIGHT_WHEEL.BRAKE_DISC` | Carbon-brake · đọc được mặt đĩa và vent · vật liệu matte chịu sáng | TODO |
| V2-04-05 | `REAR_RIGHT_WHEEL.BRAKE_CALIPER` | Satin gunmetal · tách khỏi disc không va chạm · giữ cấu trúc clamp | TODO |
| V2-04-06 | `REAR_RIGHT_WHEEL.SUSPENSION_LINKS` | Carbon composite + metal joints · tháo cuối · pivot và góc khớp đúng | TODO |
| V2-04-07 | `REAR_RIGHT_WHEEL.HUB_MOUNT_INTERFACE` | Titanium join · lộ mặt gá · chưa thể claim shaft-hub engagement | TODO |

**Module acceptance:** every ticket M0–M7 PASS, no missing semantic nodes, three review angles, deterministic roundtrip, no material inconsistency; publish a dedicated QA/evidence folder before unblocking the next wave.

### 05 · Cánh trước — `FRONT_WING` (4 components)

**Camera/geometry requirement:** Low-angle / plan view, đậm đường biên cánh, không giả cơ cấu active aero.

| Ticket | Exact semantic ID | Visual / movement / inspection deliverable | Status |
|---|---|---|---|
| V2-05-01 | `FRONT_WING.MAIN_PLANE` | Satin carbon · phô biên dạng cánh · edge thickness phải sạch | TODO |
| V2-05-02 | `FRONT_WING.FLAP_ELEMENTS` | Carbon/clearcoat nhẹ · stagger theo lớp · không mô phỏng aero chủ động giả | TODO |
| V2-05-03 | `FRONT_WING.ENDPLATES` | Matte carbon · tách đôi bên · no fake sponsor | TODO |
| V2-05-04 | `FRONT_WING.MOUNTING_POINTS` | Titanium + carbon · lộ neo chính xác · test mặt cắt | TODO |

**Module acceptance:** every ticket M0–M7 PASS, no missing semantic nodes, three review angles, deterministic roundtrip, no material inconsistency; publish a dedicated QA/evidence folder before unblocking the next wave.

### 06 · Cánh sau — `REAR_WING` (4 components)

**Camera/geometry requirement:** Rear 3/4, tách từng lớp, không thêm logo chưa có quyền.

| Ticket | Exact semantic ID | Visual / movement / inspection deliverable | Status |
|---|---|---|---|
| V2-06-01 | `REAR_WING.MAIN_PLANE` | Satin carbon · phô biên dạng cánh · edge thickness phải sạch | TODO |
| V2-06-02 | `REAR_WING.UPPER_ELEMENT` | Carbon clearcoat · tách theo lớp · test khoảng hở | TODO |
| V2-06-03 | `REAR_WING.ENDPLATES` | Matte carbon · tách đôi bên · no fake sponsor | TODO |
| V2-06-04 | `REAR_WING.SUPPORT_STRUCTURE` | Titanium carbon · lộ trụ đỡ và attachment · test assembly | TODO |

**Module acceptance:** every ticket M0–M7 PASS, no missing semantic nodes, three review angles, deterministic roundtrip, no material inconsistency; publish a dedicated QA/evidence folder before unblocking the next wave.

### 07 · Cockpit và Halo — `COCKPIT_HALO` (4 components)

**Camera/geometry requirement:** Top 3/4, giữ nguyên hình học bảo vệ, không suy diễn crash safety.

| Ticket | Exact semantic ID | Visual / movement / inspection deliverable | Status |
|---|---|---|---|
| V2-07-01 | `COCKPIT_HALO.HALO_UPPER_STRUCTURE` | Carbon/titanium schematic · lift thẳng · chú thích reference | TODO |
| V2-07-02 | `COCKPIT_HALO.PRIMARY_HALO_STRUCTURE` | Carbon/titanium schematic · lift theo pivot · không đánh giá crash rating | TODO |
| V2-07-03 | `COCKPIT_HALO.COCKPIT_SURROUND` | Carbon shell · bóc và quan sát mép cockpit | TODO |
| V2-07-04 | `COCKPIT_HALO.MOUNT_INTERFACES` | Titanium mounts · tách nhỏ, tránh giao cắt | TODO |

**Module acceptance:** every ticket M0–M7 PASS, no missing semantic nodes, three review angles, deterministic roundtrip, no material inconsistency; publish a dedicated QA/evidence folder before unblocking the next wave.

### 08 · Sidepod trái — `LEFT_SIDEPOD` (3 components)

**Camera/geometry requirement:** Mở vỏ hông ra phía trái, thông khí chỉ là schematic minh họa.

| Ticket | Exact semantic ID | Visual / movement / inspection deliverable | Status |
|---|---|---|---|
| V2-08-01 | `LEFT_SIDEPOD.AIR_INTAKE` | Graphite shell · lộ intake · không bịa airflow data | TODO |
| V2-08-02 | `LEFT_SIDEPOD.EXTERIOR_SHELL` | Gloss graphite paint · tách từng lớp như product teardown | TODO |
| V2-08-03 | `LEFT_SIDEPOD.INNER_SUPPORT` | Carbon/titanium · lộ kết cấu đỡ, giữ surface ownership | TODO |

**Module acceptance:** every ticket M0–M7 PASS, no missing semantic nodes, three review angles, deterministic roundtrip, no material inconsistency; publish a dedicated QA/evidence folder before unblocking the next wave.

### 09 · Sidepod phải — `RIGHT_SIDEPOD` (3 components)

**Camera/geometry requirement:** Mở hông phải, so sánh mirror và khoảng hở.

| Ticket | Exact semantic ID | Visual / movement / inspection deliverable | Status |
|---|---|---|---|
| V2-09-01 | `RIGHT_SIDEPOD.AIR_INTAKE` | Graphite shell · lộ intake · không bịa airflow data | TODO |
| V2-09-02 | `RIGHT_SIDEPOD.EXTERIOR_SHELL` | Gloss graphite paint · tách từng lớp như product teardown | TODO |
| V2-09-03 | `RIGHT_SIDEPOD.INNER_SUPPORT` | Carbon/titanium · lộ kết cấu đỡ, giữ surface ownership | TODO |

**Module acceptance:** every ticket M0–M7 PASS, no missing semantic nodes, three review angles, deterministic roundtrip, no material inconsistency; publish a dedicated QA/evidence folder before unblocking the next wave.

### 10 · Sàn và diffuser — `FLOOR_DIFFUSER` (4 components)

**Camera/geometry requirement:** Low underside + rear shot, không giả kết quả CFD.

| Ticket | Exact semantic ID | Visual / movement / inspection deliverable | Status |
|---|---|---|---|
| V2-10-01 | `FLOOR_DIFFUSER.FLOOR_MAIN` | Matte carbon · hạ floor theo -Z nguồn · không xuyên track plane | TODO |
| V2-10-02 | `FLOOR_DIFFUSER.EXTERIOR_UNDERTRAY_SHELL` | Satin carbon · mặt gầm độc lập · không double shell | TODO |
| V2-10-03 | `FLOOR_DIFFUSER.UNDERBODY_SURFACES` | Carbon · phần minh họa pressure là SVG, không fake CFD | TODO |
| V2-10-04 | `FLOOR_DIFFUSER.REAR_DIFFUSER` | Carbon · rõ đường exit flow, không đổi topology | TODO |

**Module acceptance:** every ticket M0–M7 PASS, no missing semantic nodes, three review angles, deterministic roundtrip, no material inconsistency; publish a dedicated QA/evidence folder before unblocking the next wave.

### 11 · Làm mát trái — `COOLING_LEFT` (5 components)

**Camera/geometry requirement:** Technical cutaway; bộ phận nội thất là mô hình nguyên lý.

| Ticket | Exact semantic ID | Visual / movement / inspection deliverable | Status |
|---|---|---|---|
| V2-11-01 | `COOLING_LEFT.RADIATOR_CORE` | Satin aluminium · fin geometry đủ macro · profile budget | TODO |
| V2-11-02 | `COOLING_LEFT.INLET_DUCT` | Black carbon/polymer · phân biệt ống và miệng hút | TODO |
| V2-11-03 | `COOLING_LEFT.COOLANT_CIRCUIT` | Metal + translucent schematic overlay · không ghi nhiệt độ giả | TODO |
| V2-11-04 | `COOLING_LEFT.MOUNT_BRACKETS` | Titanium mounts · để lộ điểm gá sau radiator | TODO |
| V2-11-05 | `COOLING_LEFT.THERMAL_BARRIER` | Metal heatshield · roughness khác radiator · no fake heatmap | TODO |

**Module acceptance:** every ticket M0–M7 PASS, no missing semantic nodes, three review angles, deterministic roundtrip, no material inconsistency; publish a dedicated QA/evidence folder before unblocking the next wave.

### 12 · Làm mát phải — `COOLING_RIGHT` (5 components)

**Camera/geometry requirement:** Tách lớp phải, phân biệt radiator và đường dẫn minh họa.

| Ticket | Exact semantic ID | Visual / movement / inspection deliverable | Status |
|---|---|---|---|
| V2-12-01 | `COOLING_RIGHT.RADIATOR_CORE` | Satin aluminium · fin geometry đủ macro · profile budget | TODO |
| V2-12-02 | `COOLING_RIGHT.INLET_DUCT` | Black carbon/polymer · phân biệt ống và miệng hút | TODO |
| V2-12-03 | `COOLING_RIGHT.COOLANT_CIRCUIT` | Metal + translucent schematic overlay · không ghi nhiệt độ giả | TODO |
| V2-12-04 | `COOLING_RIGHT.MOUNT_BRACKETS` | Titanium mounts · để lộ điểm gá sau radiator | TODO |
| V2-12-05 | `COOLING_RIGHT.THERMAL_BARRIER` | Metal heatshield · roughness khác radiator · no fake heatmap | TODO |

**Module acceptance:** every ticket M0–M7 PASS, no missing semantic nodes, three review angles, deterministic roundtrip, no material inconsistency; publish a dedicated QA/evidence folder before unblocking the next wave.

### 13 · Động cơ và truyền động — `POWERTRAIN` (5 components)

**Camera/geometry requirement:** Three-quarter interior, nhãn ILLUSTRATIVE bắt buộc.

| Ticket | Exact semantic ID | Visual / movement / inspection deliverable | Status |
|---|---|---|---|
| V2-13-01 | `POWERTRAIN.ENGINE_BLOCK` | Machined metal · rõ cylinder bank outline · reference, not exact F1 | TODO |
| V2-13-02 | `POWERTRAIN.TURBO_ASSEMBLY` | Titanium/gunmetal · lộ turbo shell · không dựng trục cơ khí sai | TODO |
| V2-13-03 | `POWERTRAIN.GEARBOX` | Dark metal · tách khỏi engine · gear illustration only | TODO |
| V2-13-04 | `POWERTRAIN.REAR_DRIVE_SHAFTS` | Titanium shaft · tách đều hai phía, không kéo giãn | TODO |
| V2-13-05 | `POWERTRAIN.MOUNT_CRADLE` | Carbon/titanium mount · tách sau cùng · check transform | TODO |

**Module acceptance:** every ticket M0–M7 PASS, no missing semantic nodes, three review angles, deterministic roundtrip, no material inconsistency; publish a dedicated QA/evidence folder before unblocking the next wave.

## First implementation package — V2-01 FRONT_LEFT_WHEEL

**Target:** make `FRONT_LEFT_WHEEL` the visual and technical quality reference for other 3 corners. Do not bulk-apply new material rules before approval.

1. Audit `FRONT_LEFT_WHEEL` and its 7 child components against the current R4.5 GLB, record ownership and zero pose; flag shaft-hub engagement as blocked until proven.
2. Produce three static looks: **Hero Carbon**, **Technical Blueprint**, **Focus Macro**. Edge clarity and silhouette win over glow.
3. Lock 4 material families: tyre rubber / satin metal / carbon-brake / carbon suspension, while maintaining original livery continuity.
4. Define precise choreography: center lock → wheel outer → hub → brake disc → caliper → suspension links → hub mounting interface. Treat this as a **visual exploration order**, not an asserted garage disassembly procedure.
5. Implement one semantic part focus at a time and anchor accurate labels to transform world matrices, not screen-space guesses.
6. Verify direct timeline scrub forward/backward, all profile GLBs, frame-time budget and unchanged Showroom.
7. Export matched 0/25/50/75/100% renders, three camera angles, failed-case notes, semantic ID report and matrix diffs.
8. Gate **OWNER REVIEW**. If there is clipping, inaccurate mechanics or dark materials, remain on P1 and fix rather than starting W2.

## End-of-project acceptance

- 65/65 component tickets have explicit PASS or BLOCKED reasons; no unexplained omissions.
- 0 → 100 → 0 returns exact baseline transforms (within chosen numeric tolerance) and correct wheel-first ordering.
- No false safety, CFD, thermal, telemetry, 2026 or licensing claims.
- Keyboard/mobile/reduced-motion/low-spec fallback tested; no homepage, Showroom, Championship or API changes.
- Lint, typecheck, tests, asset boundary, production isolation, build and preview diagnostics PASS.
- Release remains HOLD pending approved source rights and owner visual acceptance.
