# P1 — Kiểm Kê Mô Hình Lắp Ráp Model B (Model B Assembly Inventory)

**Trạng thái:** Đã kiểm kê đầy đủ (Phase P1)  
**Nguồn kiểm kê:**

- `apps/web/public/models/model-b-eds-optimized-v1.glb` (Model B gốc đang khóa RED cho Showroom)
- `source-assets/models/inside-the-machine/exports/assembly-manifest-r4-5.json` (`peds.inside-the-machine.full-vehicle-assembly.v5.r4.5`)
- Chuỗi lịch sử Blender authoring: `r4-4-a`, `r4-4-b`, `r4-4-c`, `r4-5` trong `source-assets/models/inside-the-machine/authoring/`

---

## 1. Tổng quan Mô hình Gốc & Lịch sử các Giai đoạn Ghép Linh Kiện

### 1.1. Model B Gốc (Showroom Runtime — Vùng Khóa RED)

- **Tác phẩm gốc:** "Formula 1 2022 Car" — tác giả Luis Adrian V. (`luis.adrian.villagrana`), Sketchfab, giấy phép **CC BY 4.0**.
- **Đường dẫn:** `apps/web/public/models/model-b-eds-optimized-v1.glb` (bản sao nguồn tại `source-assets/models/model-b/`).
- **Dung lượng & Mã băm:** `2,120,816` bytes — SHA-256: `2D0091661DACE5D6C61AEBF898B4974644B44E43A5E8D10A5E8D10F602685C1631610A2` (`2D0091661DACE5D6C61AEBF898B4974644B44E43A5E8D10F602685C1631610A2`).
- **Cấu trúc hình học:** **1 node duy nhất, 1 mesh duy nhất**, chia làm 13 primitive theo vùng vật liệu, `79,925` tam giác.
- **Kết luận kỹ thuật:** File gốc này **không có cây phân cấp linh kiện** và không thể tách rời (explode) trực tiếp nếu không qua bước phân rã & đóng kín hình học. Mọi thay đổi cho tính năng tháo/lắp phải xuất ra bộ file GLB mới, giữ nguyên file gốc này.

### 1.2. Bảo toàn Lịch sử Ba Giai đoạn Ghép Linh Kiện Trước (`R4.2` → `R4.5`)

Không vứt bỏ bất kỳ dữ liệu nào đã làm. Toàn bộ tiến trình trước được giữ nguyên trong `source-assets/models/inside-the-machine/`:

| Phiên bản           | File `.blend` / Manifest                                       | SHA-256 (`.blend`)                                                 | Số cụm / Node điều khiển                                                    | Nội dung đã thực hiện                                                                                                                                                               |
| ------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R4.2 / Rev1**     | Nền tảng tách vỏ & cánh                                        | —                                                                  | 10 assemblies / 56 transforms                                               | Tách 4 bánh, hàn & làm dày cục bộ cánh trước/sau (`0.2 mm`), gán lại 4 mảng vỏ (`LEFT_SIDEPOD`, `RIGHT_SIDEPOD`, `COCKPIT_HALO`, `FLOOR_DIFFUSER` = `4,763` mặt) từ `CHASSIS_CORE`. |
| **R4.3**            | Bổ sung hệ thống cơ khí bên trong                              | `FA44BB75740F5E7743AE3BD68E3D7FFE8694E383588033F1FB715036E9C4389C` | 10 assemblies + 3 internal systems (`75` transforms)                        | Thêm 19 linh kiện nội thất/cơ khí (`COOLING_LEFT`, `COOLING_RIGHT`, `POWERTRAIN` và 4 `HUB_MOUNT_INTERFACE`).                                                                       |
| **R4.4-a**          | `model-b-cinematic-r4-4-a.blend`                               | `CE4D1FEDF0D32E8F065A92E7B2CA997B84D6E9648D1EB44468601913B34338B2` | 10 assemblies / 75 transforms                                               | Tinh chỉnh mesh khối động cơ, nắp xi-lanh và vỏ hộp số (`PEDS_R43_ENGINE_METAL`, `PEDS_R43_ENGINE_BANK_COVERS`, `PEDS_R43_GEARBOX_HOUSING`).                                        |
| **R4.4-b**          | `model-b-cinematic-r4-4-b.blend`                               | `9F7E9BF5AFB4134AFA927C56F99F56AEE6DCD3E44382EAAF6189A03BB351D61E` | 10 assemblies / 75 transforms                                               | Dựng lại hình khối cụm máy và hộp số theo bao hình Model B, bảo toàn 64 mesh nguồn.                                                                                                 |
| **R4.4-c**          | `model-b-cinematic-r4-4-c.blend`                               | `FDDDD578CC616B770A106D3C3C649F77ABDCD7C30947DFEA36598C76BB666622` | 10 assemblies / 75 transforms                                               | Căn chỉnh khớp bán trục sau với moay-ơ ở mức minh họa (`rearShaftHubFit: illustrative`).                                                                                            |
| **R4.5 (Hiện tại)** | `model-b-cinematic-r4-5.blend` + `assembly-manifest-r4-5.json` | `9AC88991BE50C65B069B61D81FC418986D38E9831BFF40FAAA6BFC27432B95ED` | **10 assemblies, 3 internal systems, 65 components (75 semantic controls)** | Tinh chỉnh 4 moay-ơ bánh xe (`PEDS_*_WHEEL_HUB_GEOMETRY`), xuất 3 mức LOD (`HIGH` 2.76 MB, `BALANCED` 2.53 MB, `PERFORMANCE` 2.25 MB).                                              |

### 1.3. Kích thước & Hệ tọa độ chuẩn của R4.5

- **Hệ tọa độ trong Manifest/Blender:** `+X` hướng về mũi xe (Front), `+Y` hướng sang trái (Left), `+Z` hướng lên trên (Up), đơn vị: **mét (m)**.
- **Bao hình tổng thể (Assembled Bounds):**
  - Chiều dài (`X`): `5.0503 m` (từ `-2.5251 m` đến `+2.5252 m`)
  - Chiều rộng (`Y`): `2.0946 m` (từ `-1.0473 m` đến `+1.0473 m`)
  - Chiều cao (`Z`): `1.0667 m` (từ `0.0000 m` đến `+1.0667 m`)
- **Thống kê hình học R4.5:** `85` mesh objects, `188,125` đỉnh (vertices), `139,316` tam giác (triangles), ~`100` draw calls.

---

## 2. Kiểm kê 10 Cụm Lắp Ráp Chính (Top-Level Assemblies) & 3 Hệ Thống Nội Khu

| STT | Mã Cụm (`id`)               | Node Điều Khiển           | Loại        | Số Linh Kiện | Tọa độ Pivot Thế giới `[X, Y, Z]` (m) | Vector Tháo Rời Tổng `[dX, dY, dZ]` (m) | Đánh giá Hiện trạng                                                                                                 |
| --- | --------------------------- | ------------------------- | ----------- | ------------ | ------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | `FRONT_LEFT_WHEEL`          | `PEDS_FRONT_LEFT_WHEEL`   | `wheel`     | 7            | `[1.2528, 0.8303, 0.3711]`            | `[0.10, 0.72, 0.08]`                    | Khá tốt; cần chuẩn hóa khớp trục–moay-ơ & khắc watermark 3D lên cùm phanh/moay-ơ.                                   |
| 2   | `FRONT_RIGHT_WHEEL`         | `PEDS_FRONT_RIGHT_WHEEL`  | `wheel`     | 7            | `[1.2796, -0.7179, 0.3710]`           | `[0.10, -0.72, 0.08]`                   | Lưu ý: tọa độ `Y` (`-0.7179`) đang lệch nhẹ so với bánh trái (`+0.8303`) — cần đối xứng hóa ở P2.                   |
| 3   | `REAR_LEFT_WHEEL`           | `PEDS_REAR_LEFT_WHEEL`    | `wheel`     | 7            | `[-2.1441, 0.7765, 0.3609]`           | `[-0.10, 0.72, 0.08]`                   | Cần khớp cơ khí thật giữa `HUB_MOUNT_INTERFACE` và `REAR_DRIVE_SHAFTS`.                                             |
| 4   | `REAR_RIGHT_WHEEL`          | `PEDS_REAR_RIGHT_WHEEL`   | `wheel`     | 7            | `[-2.1140, -0.7786, 0.3609]`          | `[-0.10, -0.72, 0.08]`                  | Cần đồng bộ đối xứng `X` với bánh sau trái (`-2.1441` vs `-2.1140`).                                                |
| 5   | `FRONT_WING`                | `PEDS_FRONT_WING`         | `wing`      | 4            | `[2.0568, 0.0669, 0.3208]`            | `[0.92, 0.00, 0.14]`                    | Đã làm kín (`5,900` faces); cần đưa `Y` của pivot về đúng `0.0000` và thêm chốt gá mũi xe.                          |
| 6   | `REAR_WING`                 | `PEDS_REAR_WING`          | `wing`      | 4            | `[-2.1532, -0.0009, 0.7199]`          | `[-0.86, 0.00, 0.28]`                   | Đã làm kín (`5,624` faces); cần bổ sung cơ cấu trụ đỡ DRS/pylon rõ ràng hơn.                                        |
| 7   | `COCKPIT_HALO`              | `PEDS_R42_COCKPIT_HALO`   | `bodywork`  | 4            | `[0.0000, 0.0000, 0.0000]`            | `[0.00, 0.00, 0.55]`                    | **Điểm yếu:** Pivot đang ở `[0,0,0]` thay vì tâm cụm; mảng vỏ tách ra từ thân nên mặt dưới còn hở.                  |
| 8   | `LEFT_SIDEPOD`              | `PEDS_R42_LEFT_SIDEPOD`   | `bodywork`  | 3            | `[0.0000, 0.0000, 0.0000]`            | `[0.00, 0.75, 0.10]`                    | **Điểm yếu:** Vỏ `EXTERIOR_SHELL` là mảng mặt cắt từ thân (`1,624` faces), chưa có độ dày thành vỏ kín.             |
| 9   | `RIGHT_SIDEPOD`             | `PEDS_R42_RIGHT_SIDEPOD`  | `bodywork`  | 3            | `[0.0000, 0.0000, 0.0000]`            | `[0.00, -0.75, 0.10]`                   | **Điểm yếu:** Giống hông trái (`1,363` faces, số mặt lệch nhau so với bên trái), cần làm kín và đối xứng hóa.       |
| 10  | `FLOOR_DIFFUSER`            | `PEDS_R42_FLOOR_DIFFUSER` | `underbody` | 4            | `[0.0000, 0.0000, 0.0000]`            | `[0.00, 0.00, -0.54]`                   | **Điểm yếu:** Mới tách `528` mặt gầm ngoài + các đảo mặt nguồn, chưa tạo thành tấm sàn Venturi liền khối có độ dày. |
| 11* | `COOLING_LEFT` _(Nội khu)_  | Thuộc `CHASSIS_CORE`      | `internal`  | 5            | `[0.3000, 0.3100, 0.4600]`            | Theo từng linh kiện                     | Đang ở mức minh họa (`r4_3_authored_illustrative_mechanical_system`).                                               |
| 12* | `COOLING_RIGHT` _(Nội khu)_ | Thuộc `CHASSIS_CORE`      | `internal`  | 5            | `[0.3000, -0.3100, 0.4600]`           | Theo từng linh kiện                     | Đang ở mức minh họa (`r4_3_authored_illustrative_mechanical_system`).                                               |
| 13* | `POWERTRAIN` _(Nội khu)_    | Thuộc `CHASSIS_CORE`      | `internal`  | 5            | `[-1.3200, 0.0000, 0.4700]`           | Theo từng linh kiện                     | Đang ở mức khối minh họa; cần chuẩn hóa bề mặt kỹ thuật & mặt bích nối bán trục.                                    |

---

## 3. Bảng Kiểm Kê Chi Tiết 65 Linh Kiện (Component-Level Action Matrix)

Mã hành động cho Phase P2:

- **`REUSE_AS_IS` (Giữ nguyên hình học, chỉ chuẩn hóa vật liệu):** Linh kiện đã kín, đúng vị trí.
- **`SOLIDIFY_SHELL` (Đóng kín & tạo độ dày vỏ trong Blender):** Các mảng mặt tách từ vỏ Model B cần thêm độ dày (`1.5–3.0 mm`), làm kín mép cắt và đặt lại Pivot về tâm thực.
- **`CAD_REFINE_MECHANICS` (Chuẩn hóa cơ khí chính xác bằng Fusion/Blender CAD):** Thay thế hoặc tinh chỉnh các chi tiết cơ khí minh họa, đảm bảo đồng tâm, đối xứng trái–phải và khớp nối ăn khớp thật (`shaftHubMechanicalEngagementProven = true`).

### 3.1. Cụm 4 Bánh Xe & Hệ Treo Góc (28 linh kiện)

| #   | Component ID                            | Node trong GLB                                     | Provenance hiện tại          | Vector tách cục bộ `[dX, dY, dZ]` | Hành động P2           | Ghi chú kỹ thuật & Watermark 3D                                                           |
| --- | --------------------------------------- | -------------------------------------------------- | ---------------------------- | --------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------- |
| 1   | `FRONT_LEFT_WHEEL.CENTER_LOCK_NUT`      | `PEDS_CENTER_LOCK_NUT`                             | `newly_authored`             | `[0, 0.34, 0]`                    | `CAD_REFINE_MECHANICS` | Thêm ren trong/ngoài côn chuẩn F1, khắc chìm `PEDS-R5` trên vành đai ốc.                  |
| 2   | `FRONT_LEFT_WHEEL.WHEEL_OUTER`          | `PEDS_WHEEL_OUTER`                                 | `mixed_original_and_new`     | `[0, 0.66, 0]`                    | `REUSE_AS_IS`          | Giữ lốp & mâm nguồn Model B, gán vật liệu chuẩn `PEDS_Tire_Rubber` + `PEDS_Carbon_Weave`. |
| 3   | `FRONT_LEFT_WHEEL.WHEEL_HUB`            | `PEDS_WHEEL_HUB`                                   | `newly_authored`             | `[0, 0.29, 0]`                    | `CAD_REFINE_MECHANICS` | Đồng bộ then hoa (splines) ăn khớp với `CENTER_LOCK_NUT` và `HUB_MOUNT_INTERFACE`.        |
| 4   | `FRONT_LEFT_WHEEL.BRAKE_DISC`           | `PEDS_BRAKE_DISC`                                  | `newly_authored`             | `[-0.04, 0.20, 0]`                | `REUSE_AS_IS`          | Đĩa carbon đã có lỗ tản nhiệt; chuẩn hóa vật liệu `PEDS_Brake_Carbon`.                    |
| 5   | `FRONT_LEFT_WHEEL.BRAKE_CALIPER`        | `PEDS_BRAKE_CALIPER`                               | `newly_authored`             | `[-0.10, 0.25, 0.10]`             | `CAD_REFINE_MECHANICS` | Dập nổi logo kỹ thuật `PEDS // SPEC-R5` lên mặt ngoài cùm phanh (Watermark 3D lớp 2).     |
| 6   | `FRONT_LEFT_WHEEL.SUSPENSION_LINKS`     | `PEDS_SUSPENSION_LINKS`                            | `newly_authored`             | `[-0.12, 0.08, 0.08]`             | `CAD_REFINE_MECHANICS` | Bổ sung đầu khớp cầu (rod-end / clevis) tại điểm nối vào monocoque và upright.            |
| 7   | `FRONT_LEFT_WHEEL.HUB_MOUNT_INTERFACE`  | `PEDS_R43_FRONT_LEFT_WHEEL_HUB_INTERFACE_CONTROL`  | `r4_3_authored_illustrative` | `[0, 0.20, 0.08]`                 | `CAD_REFINE_MECHANICS` | Đặt lại pivot từ `[0,0,0]` về đúng tâm bánh trước trái `[1.2528, 0.8303, 0.3711]`.        |
| 8   | `FRONT_RIGHT_WHEEL.CENTER_LOCK_NUT`     | `PEDS_FR_CENTER_LOCK_NUT`                          | `newly_authored`             | `[0, -0.34, 0]`                   | `CAD_REFINE_MECHANICS` | Mirror chuẩn từ bánh trước trái sau khi sửa lệch tâm `Y` (`-0.8303 m`).                   |
| 9   | `FRONT_RIGHT_WHEEL.WHEEL_OUTER`         | `PEDS_FR_WHEEL_OUTER`                              | `mixed_original_and_new`     | `[0, -0.66, 0]`                   | `REUSE_AS_IS`          | Chuẩn hóa tâm `Y` đối xứng với bánh trước trái.                                           |
| 10  | `FRONT_RIGHT_WHEEL.WHEEL_HUB`           | `PEDS_FR_WHEEL_HUB`                                | `newly_authored`             | `[0, -0.29, 0]`                   | `CAD_REFINE_MECHANICS` | Mirror chuẩn từ `FRONT_LEFT_WHEEL.WHEEL_HUB`.                                             |
| 11  | `FRONT_RIGHT_WHEEL.BRAKE_DISC`          | `PEDS_FR_BRAKE_DISC`                               | `newly_authored`             | `[-0.04, -0.20, 0]`               | `REUSE_AS_IS`          | Chuẩn hóa vật liệu `PEDS_Brake_Carbon`.                                                   |
| 12  | `FRONT_RIGHT_WHEEL.BRAKE_CALIPER`       | `PEDS_FR_BRAKE_CALIPER`                            | `newly_authored`             | `[-0.10, -0.25, 0.10]`            | `CAD_REFINE_MECHANICS` | Có chữ dập nổi `PEDS // SPEC-R5` chiều thuận (không bị ngược chữ khi mirror).             |
| 13  | `FRONT_RIGHT_WHEEL.SUSPENSION_LINKS`    | `PEDS_FR_SUSPENSION_LINKS`                         | `newly_authored`             | `[-0.12, -0.08, 0.08]`            | `CAD_REFINE_MECHANICS` | Mirror chuẩn càng treo + đầu khớp từ bên trái.                                            |
| 14  | `FRONT_RIGHT_WHEEL.HUB_MOUNT_INTERFACE` | `PEDS_R43_FRONT_RIGHT_WHEEL_HUB_INTERFACE_CONTROL` | `r4_3_authored_illustrative` | `[0, -0.20, 0.08]`                | `CAD_REFINE_MECHANICS` | Đặt lại pivot về tâm bánh trước phải.                                                     |
| 15  | `REAR_LEFT_WHEEL.CENTER_LOCK_NUT`       | `PEDS_RL_CENTER_LOCK_NUT`                          | `newly_authored`             | `[0, 0.34, 0]`                    | `CAD_REFINE_MECHANICS` | Chuẩn hóa ren khóa tâm & khắc chìm `PEDS-R5`.                                             |
| 16  | `REAR_LEFT_WHEEL.WHEEL_OUTER`           | `PEDS_RL_WHEEL_OUTER`                              | `mixed_original_and_new`     | `[0, 0.66, 0]`                    | `REUSE_AS_IS`          | Giữ hình học mâm/lốp sau, đồng bộ vật liệu.                                               |
| 17  | `REAR_LEFT_WHEEL.WHEEL_HUB`             | `PEDS_RL_WHEEL_HUB`                                | `newly_authored`             | `[0, 0.29, 0]`                    | `CAD_REFINE_MECHANICS` | Thêm lỗ then hoa trong để nhận đầu trục `POWERTRAIN.REAR_DRIVE_SHAFTS`.                   |
| 18  | `REAR_LEFT_WHEEL.BRAKE_DISC`            | `PEDS_RL_BRAKE_DISC`                               | `newly_authored`             | `[0.04, 0.20, 0]`                 | `REUSE_AS_IS`          | Chuẩn hóa vật liệu `PEDS_Brake_Carbon`.                                                   |
| 19  | `REAR_LEFT_WHEEL.BRAKE_CALIPER`         | `PEDS_RL_BRAKE_CALIPER`                            | `newly_authored`             | `[0.10, 0.25, 0.10]`              | `CAD_REFINE_MECHANICS` | Dập nổi `PEDS // SPEC-R5`.                                                                |
| 20  | `REAR_LEFT_WHEEL.SUSPENSION_LINKS`      | `PEDS_RL_SUSPENSION_LINKS`                         | `newly_authored`             | `[0.12, 0.08, 0.08]`              | `CAD_REFINE_MECHANICS` | Chuẩn hóa điểm bắt vào vỏ hộp số (`POWERTRAIN.GEARBOX`).                                  |
| 21  | `REAR_LEFT_WHEEL.HUB_MOUNT_INTERFACE`   | `PEDS_R43_REAR_LEFT_WHEEL_HUB_INTERFACE_CONTROL`   | `r4_3_authored_illustrative` | `[0, 0.20, 0.08]`                 | `CAD_REFINE_MECHANICS` | Khớp đồng trục 100% với bán trục sau và `REAR_LEFT_WHEEL.WHEEL_HUB`.                      |
| 22  | `REAR_RIGHT_WHEEL.CENTER_LOCK_NUT`      | `PEDS_RR_CENTER_LOCK_NUT`                          | `newly_authored`             | `[0, -0.34, 0]`                   | `CAD_REFINE_MECHANICS` | Mirror chuẩn từ bánh sau trái.                                                            |
| 23  | `REAR_RIGHT_WHEEL.WHEEL_OUTER`          | `PEDS_RR_WHEEL_OUTER`                              | `mixed_original_and_new`     | `[0, -0.66, 0]`                   | `REUSE_AS_IS`          | Đồng bộ tọa độ `X` với bánh sau trái (`-2.1441 m`).                                       |
| 24  | `REAR_RIGHT_WHEEL.WHEEL_HUB`            | `PEDS_RR_WHEEL_HUB`                                | `newly_authored`             | `[0, -0.29, 0]`                   | `CAD_REFINE_MECHANICS` | Mirror chuẩn, khớp then hoa với bán trục sau phải.                                        |
| 25  | `REAR_RIGHT_WHEEL.BRAKE_DISC`           | `PEDS_RR_BRAKE_DISC`                               | `newly_authored`             | `[0.04, -0.20, 0]`                | `REUSE_AS_IS`          | Chuẩn hóa vật liệu `PEDS_Brake_Carbon`.                                                   |
| 26  | `REAR_RIGHT_WHEEL.BRAKE_CALIPER`        | `PEDS_RR_BRAKE_CALIPER`                            | `newly_authored`             | `[0.10, -0.25, 0.10]`             | `CAD_REFINE_MECHANICS` | Dập nổi `PEDS // SPEC-R5` chiều thuận.                                                    |
| 27  | `REAR_RIGHT_WHEEL.SUSPENSION_LINKS`     | `PEDS_RR_SUSPENSION_LINKS`                         | `newly_authored`             | `[0.12, -0.08, 0.08]`             | `CAD_REFINE_MECHANICS` | Mirror chuẩn từ bánh sau trái.                                                            |
| 28  | `REAR_RIGHT_WHEEL.HUB_MOUNT_INTERFACE`  | `PEDS_R43_REAR_RIGHT_WHEEL_HUB_INTERFACE_CONTROL`  | `r4_3_authored_illustrative` | `[0, -0.20, 0.08]`                | `CAD_REFINE_MECHANICS` | Khớp đồng trục 100% với bán trục sau phải.                                                |

### 3.2. Cụm Khí Động Học Cánh Trước & Cánh Sau (8 linh kiện)

| #   | Component ID                  | Node trong GLB                     | Provenance hiện tại              | Vector tách cục bộ `[dX, dY, dZ]` | Hành động P2           | Ghi chú kỹ thuật                                                                           |
| --- | ----------------------------- | ---------------------------------- | -------------------------------- | --------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------ |
| 29  | `FRONT_WING.MAIN_PLANE`       | `PEDS_FRONT_WING_MAIN_PLANE`       | `newly_authored_closed_geometry` | `[0.24, 0, 0]`                    | `REUSE_AS_IS`          | Đã đóng kín (`4,045` faces), giữ nguyên độ chính xác silhouette (`IoU >= 0.985`).          |
| 30  | `FRONT_WING.FLAP_ELEMENTS`    | `PEDS_FRONT_WING_FLAP_ELEMENTS`    | `newly_authored_closed_geometry` | `[0.38, 0, 0.10]`                 | `REUSE_AS_IS`          | Đã đóng kín (`587` faces).                                                                 |
| 31  | `FRONT_WING.ENDPLATES`        | `PEDS_FRONT_WING_ENDPLATES`        | `newly_authored_closed_geometry` | `[0.48, 0, 0.06]`                 | `REUSE_AS_IS`          | Đã đóng kín (`686` faces).                                                                 |
| 32  | `FRONT_WING.MOUNTING_POINTS`  | `PEDS_FRONT_WING_MOUNTING_POINTS`  | `newly_authored_closed_geometry` | `[0.12, 0, 0.12]`                 | `CAD_REFINE_MECHANICS` | Đặt lại pivot từ `[0,0,0]` về mũi xe và thêm 4 chốt định vị titanium ăn vào mũi monocoque. |
| 33  | `REAR_WING.MAIN_PLANE`        | `PEDS_REAR_WING_MAIN_PLANE`        | `newly_authored_closed_geometry` | `[-0.20, 0, 0.08]`                | `REUSE_AS_IS`          | Đã đóng kín (`3,534` faces).                                                               |
| 34  | `REAR_WING.UPPER_ELEMENT`     | `PEDS_REAR_WING_UPPER_ELEMENT`     | `newly_authored_closed_geometry` | `[-0.34, 0, 0.20]`                | `REUSE_AS_IS`          | Đã đóng kín (`398` faces); bổ sung trục bản lề DRS nhỏ tại mép sau.                        |
| 35  | `REAR_WING.ENDPLATES`         | `PEDS_REAR_WING_ENDPLATES`         | `newly_authored_closed_geometry` | `[-0.44, 0, 0.10]`                | `REUSE_AS_IS`          | Đã đóng kín (`1,136` faces).                                                               |
| 36  | `REAR_WING.SUPPORT_STRUCTURE` | `PEDS_REAR_WING_SUPPORT_STRUCTURE` | `newly_authored_closed_geometry` | `[-0.12, 0, 0.15]`                | `CAD_REFINE_MECHANICS` | Đặt lại pivot từ `[0,0,0]` về chân pylon và làm rõ bích bắt bu-lông vào vỏ hộp số.         |

### 3.3. Cụm Thân Vỏ, Buồng Lái Halo & Sàn Khuếch Tán (14 linh kiện)

Đây là khu vực gây cảm giác "chưa giống thiết kế kỹ thuật" nhất ở các bản trước vì đa số là mảng mặt (`source_island` hoặc `connected_shell_faces`) có `pivotWorld = [0,0,0]`.

| #   | Component ID                              | Node trong GLB                                   | Provenance hiện tại              | Vector tách cục bộ `[dX, dY, dZ]` | Hành động P2           | Ghi chú kỹ thuật & Đóng kín                                                                                              |
| --- | ----------------------------------------- | ------------------------------------------------ | -------------------------------- | --------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 37  | `COCKPIT_HALO.PRIMARY_HALO_STRUCTURE`     | `PEDS_R42_REV1_PRIMARY_HALO_STRUCTURE_CONTROL`   | `frozen_model_b_connected_shell` | `[-0.08, 0, 0.58]`                | `SOLIDIFY_SHELL`       | Đóng kín mặt đáy khung chữ Y của Halo titanium và thêm 3 chân bích bắt vào thành monocoque.                              |
| 38  | `COCKPIT_HALO.HALO_UPPER_STRUCTURE`       | `PEDS_R42_HALO_UPPER_STRUCTURE_CONTROL`          | `source_island`                  | `[0, 0, 0.35]`                    | `SOLIDIFY_SHELL`       | Gộp/làm kín các mảnh đảo rời phía trên buồng lái, đặt lại pivot về tâm cụm Halo.                                         |
| 39  | `COCKPIT_HALO.COCKPIT_SURROUND`           | `PEDS_R42_COCKPIT_SURROUND_CONTROL`              | `source_island`                  | `[0.08, 0, 0.18]`                 | `SOLIDIFY_SHELL`       | Tạo độ dày thành bảo vệ đầu người lái (headrest padding rim) `2.5 mm`.                                                   |
| 40  | `COCKPIT_HALO.MOUNT_INTERFACES`           | `PEDS_R42_MOUNT_INTERFACES_CONTROL`              | `source_island`                  | `[-0.08, 0, 0.10]`                | `CAD_REFINE_MECHANICS` | Chuyển thành bộ bích khóa cơ khí chuẩn giữa Halo và khung monocoque.                                                     |
| 41  | `LEFT_SIDEPOD.EXTERIOR_SHELL`             | `PEDS_R42_REV1_LEFT_EXTERIOR_SHELL_CONTROL`      | `frozen_model_b_connected_shell` | `[0, 0.75, 0.28]`                 | `SOLIDIFY_SHELL`       | Tạo mặt trong carbon (`solidify 2.0 mm`) cho `1,624` mặt vỏ hông trái để khi tách ra không nhìn xuyên qua mặt trái rỗng. |
| 42  | `LEFT_SIDEPOD.AIR_INTAKE`                 | `PEDS_R42_AIR_INTAKE_CONTROL`                    | `source_island`                  | `[0, 0.22, 0.08]`                 | `SOLIDIFY_SHELL`       | Đóng kín vành cửa hút gió và khớp nối với `COOLING_LEFT.INLET_DUCT`.                                                     |
| 43  | `LEFT_SIDEPOD.INNER_SUPPORT`              | `PEDS_R42_INNER_SUPPORT_CONTROL`                 | `source_island`                  | `[0, 0.16, -0.08]`                | `SOLIDIFY_SHELL`       | Chuẩn hóa thành gân đỡ trong của vỏ sidepod trái.                                                                        |
| 44  | `RIGHT_SIDEPOD.EXTERIOR_SHELL`            | `PEDS_R42_REV1_RIGHT_EXTERIOR_SHELL_CONTROL`     | `frozen_model_b_connected_shell` | `[0, -0.75, 0.28]`                | `SOLIDIFY_SHELL`       | Tạo mặt trong carbon (`solidify 2.0 mm`) cho `1,363` mặt vỏ hông phải, cân bằng mép cắt đối xứng với bên trái.           |
| 45  | `RIGHT_SIDEPOD.AIR_INTAKE`                | `PEDS_R42_AIR_INTAKE_CONTROL.001`                | `source_island`                  | `[0, -0.22, 0.08]`                | `SOLIDIFY_SHELL`       | Đóng kín vành cửa hút gió phải và khớp với `COOLING_RIGHT.INLET_DUCT`.                                                   |
| 46  | `RIGHT_SIDEPOD.INNER_SUPPORT`             | `PEDS_R42_INNER_SUPPORT_CONTROL.001`             | `source_island`                  | `[0, -0.16, -0.08]`               | `SOLIDIFY_SHELL`       | Chuẩn hóa thành gân đỡ trong của vỏ sidepod phải.                                                                        |
| 47  | `FLOOR_DIFFUSER.EXTERIOR_UNDERTRAY_SHELL` | `PEDS_R42_REV1_EXTERIOR_UNDERTRAY_SHELL_CONTROL` | `frozen_model_b_connected_shell` | `[0, 0, -0.52]`                   | `SOLIDIFY_SHELL`       | Làm kín tấm sàn đáy, khắc nổi tem kỹ thuật `PEDS // GROUND-EFFECT FLOOR R5` ở mặt trên gầm sàn.                          |
| 48  | `FLOOR_DIFFUSER.FLOOR_MAIN`               | `PEDS_R42_FLOOR_MAIN_CONTROL`                    | `source_island`                  | `[0, 0, -0.18]`                   | `SOLIDIFY_SHELL`       | Làm kín mép sàn và vách dẫn hướng khí (floor fences).                                                                    |
| 49  | `FLOOR_DIFFUSER.UNDERBODY_SURFACES`       | `PEDS_R42_UNDERBODY_SURFACES_CONTROL`            | `source_island`                  | `[0, 0, -0.30]`                   | `SOLIDIFY_SHELL`       | Đóng kín rãnh Venturi trung tâm và tấm ván trượt (plank/skid block).                                                     |
| 50  | `FLOOR_DIFFUSER.REAR_DIFFUSER`            | `PEDS_R42_REAR_DIFFUSER_CONTROL`                 | `source_island`                  | `[-0.27, 0, -0.19]`               | `SOLIDIFY_SHELL`       | Làm kín vách khuếch tán đuôi xe để khi hạ sàn xuống nhìn thấy rõ biên dạng kênh Venturi.                                 |

### 3.4. Cụm Hệ Thống Làm Mát & Truyền Động Nội Khu (15 linh kiện)

| #   | Component ID                    | Node trong GLB                                   | Provenance hiện tại          | Vector tách cục bộ `[dX, dY, dZ]` | Hành động P2           | Ghi chú kỹ thuật                                                                                                                                                                    |
| --- | ------------------------------- | ------------------------------------------------ | ---------------------------- | --------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 51  | `COOLING_LEFT.RADIATOR_CORE`    | `PEDS_R43_COOLING_LEFT_RADIATOR_CORE_CONTROL`    | `r4_3_authored_illustrative` | `[0, 0.36, 0.12]`                 | `CAD_REFINE_MECHANICS` | Đặt lại pivot về `[0.30, 0.31, 0.46]`; chuẩn hóa khung nhôm & bề mặt lá tản nhiệt.                                                                                                  |
| 52  | `COOLING_LEFT.INLET_DUCT`       | `PEDS_R43_COOLING_LEFT_INLET_DUCT_CONTROL`       | `r4_3_authored_illustrative` | `[0.28, 0.28, 0.16]`              | `CAD_REFINE_MECHANICS` | Khớp kín miệng ống với `LEFT_SIDEPOD.AIR_INTAKE`.                                                                                                                                   |
| 53  | `COOLING_LEFT.COOLANT_CIRCUIT`  | `PEDS_R43_COOLING_LEFT_COOLANT_CIRCUIT_CONTROL`  | `r4_3_authored_illustrative` | `[-0.14, 0.28, 0.20]`             | `CAD_REFINE_MECHANICS` | Chuẩn hóa đầu nối nhanh (quick-disconnect couplings) màu Crimson Anodized.                                                                                                          |
| 54  | `COOLING_LEFT.MOUNT_BRACKETS`   | `PEDS_R43_COOLING_LEFT_MOUNT_BRACKETS_CONTROL`   | `r4_3_authored_illustrative` | `[-0.08, 0.23, -0.13]`            | `CAD_REFINE_MECHANICS` | Bắt khít vào sườn `CHASSIS_CORE`.                                                                                                                                                   |
| 55  | `COOLING_LEFT.THERMAL_BARRIER`  | `PEDS_R43_COOLING_LEFT_THERMAL_BARRIER_CONTROL`  | `r4_3_authored_illustrative` | `[-0.18, 0.20, 0.04]`             | `REUSE_AS_IS`          | Tấm chắn nhiệt trong hông trái.                                                                                                                                                     |
| 56  | `COOLING_RIGHT.RADIATOR_CORE`   | `PEDS_R43_COOLING_RIGHT_RADIATOR_CORE_CONTROL`   | `r4_3_authored_illustrative` | `[0, -0.36, 0.12]`                | `CAD_REFINE_MECHANICS` | Mirror chuẩn từ cụm làm mát trái, pivot `[0.30, -0.31, 0.46]`.                                                                                                                      |
| 57  | `COOLING_RIGHT.INLET_DUCT`      | `PEDS_R43_COOLING_RIGHT_INLET_DUCT_CONTROL`      | `r4_3_authored_illustrative` | `[0.28, -0.28, 0.16]`             | `CAD_REFINE_MECHANICS` | Khớp kín với `RIGHT_SIDEPOD.AIR_INTAKE`.                                                                                                                                            |
| 58  | `COOLING_RIGHT.COOLANT_CIRCUIT` | `PEDS_R43_COOLING_RIGHT_COOLANT_CIRCUIT_CONTROL` | `r4_3_authored_illustrative` | `[-0.14, -0.28, 0.20]`            | `CAD_REFINE_MECHANICS` | Mirror chuẩn từ bên trái.                                                                                                                                                           |
| 59  | `COOLING_RIGHT.MOUNT_BRACKETS`  | `PEDS_R43_COOLING_RIGHT_MOUNT_BRACKETS_CONTROL`  | `r4_3_authored_illustrative` | `[-0.08, -0.23, -0.13]`           | `CAD_REFINE_MECHANICS` | Mirror chuẩn từ bên trái.                                                                                                                                                           |
| 60  | `COOLING_RIGHT.THERMAL_BARRIER` | `PEDS_R43_COOLING_RIGHT_THERMAL_BARRIER_CONTROL` | `r4_3_authored_illustrative` | `[-0.18, -0.20, 0.04]`            | `REUSE_AS_IS`          | Tấm chắn nhiệt trong hông phải.                                                                                                                                                     |
| 61  | `POWERTRAIN.ENGINE_BLOCK`       | `PEDS_R43_POWERTRAIN_ENGINE_BLOCK_CONTROL`       | `r4_3_authored_illustrative` | `[0, 0, 0.48]`                    | `CAD_REFINE_MECHANICS` | Giữ dạng khối động cơ V6 1.6L kín (sealed structural block), thêm 4 chốt stud bắt vào vách sau monocoque và khắc mã `PEDS-PU-R5`.                                                   |
| 62  | `POWERTRAIN.TURBO_ASSEMBLY`     | `PEDS_R43_POWERTRAIN_TURBO_ASSEMBLY_CONTROL`     | `r4_3_authored_illustrative` | `[-0.18, 0.18, 0.32]`             | `CAD_REFINE_MECHANICS` | Chuẩn hóa bích nối ống xả & đường nạp trung tâm.                                                                                                                                    |
| 63  | `POWERTRAIN.GEARBOX`            | `PEDS_R43_POWERTRAIN_GEARBOX_CONTROL`            | `r4_3_authored_illustrative` | `[-0.37, 0, 0.15]`                | `CAD_REFINE_MECHANICS` | Vỏ hộp số carbon/titanium kín, có hốc nhận đầu trong của 2 bán trục sau và điểm bắt hệ treo sau.                                                                                    |
| 64  | `POWERTRAIN.REAR_DRIVE_SHAFTS`  | `PEDS_R43_POWERTRAIN_REAR_DRIVE_SHAFTS_CONTROL`  | `r4_3_authored_illustrative` | `[-0.32, 0, -0.18]`               | `CAD_REFINE_MECHANICS` | **Ưu tiên số 1:** Căn chỉnh đường tâm trục và đầu khớp tripod/CV sao cho ăn khớp hình học thật với `REAR_LEFT/RIGHT_WHEEL.WHEEL_HUB` (`shaftHubMechanicalEngagementProven = true`). |
| 65  | `POWERTRAIN.MOUNT_CRADLE`       | `PEDS_R43_POWERTRAIN_MOUNT_CRADLE_CONTROL`       | `r4_3_authored_illustrative` | `[0, 0, -0.28]`                   | `CAD_REFINE_MECHANICS` | Khung đỡ dưới bộ nguồn, liên kết trực tiếp với mặt trên tấm sàn `FLOOR_DIFFUSER`.                                                                                                   |

---

## 4. Tổng hợp Khối lượng Công việc Hình học cho Phase P2

- **Giữ nguyên hình học (`REUSE_AS_IS`):** `14 / 65` linh kiện (mâm/lốp ngoài, đĩa phanh, các lá cánh đã hàn kín, tấm chắn nhiệt).
- **Đóng kín & tạo độ dày vỏ (`SOLIDIFY_SHELL`):** `13 / 65` linh kiện (toàn bộ vỏ hông trái/phải, buồng lái Halo, sàn & bộ khuếch tán).
- **Chuẩn hóa cơ khí & khớp lắp (`CAD_REFINE_MECHANICS`):** `38 / 65` linh kiện (ốc khóa tâm, moay-ơ, cùm phanh có khắc nổi watermark, càng treo, bán trục sau, giá đỡ cánh, két làm mát, khối động cơ/hộp số).

---

## 5. Kết quả Thực thi Phase P2 & P3 (Bản dựng R5 Verified)

- **CAD Master (CadQuery 2.8.0 B-Rep):** `.local-assets/inside-the-machine/r5-authoring/peds-r5-cad-master.step` (`2,162,857` bytes, SHA-256: `41D119F70DDA7ADACB29DCB4CAF01F78B1985BF061E6C3B9785987E22A53F6B0`).
- **Blender 5.2.2 LTS Assembly Master:** `.local-assets/inside-the-machine/r5-authoring/model-b-cinematic-r5.blend` (SHA-256: `68A17FAAE070CC446AAC14D05E153F6271A50A393850C7B60E210987BA38A5F1`).
- **Hàn kín đỉnh trùng (`remove_doubles`) & Đóng kín vỏ (`SOLIDIFY_SHELL` + 2 lớp vật liệu ngoài Graphite / trong Carbon Weave):** Đã hàn liền `188,319 → 79,865` đỉnh rời rạc trước khi áp dụng `SOLIDIFY` (`use_rim = True`, độ dày `2.2 mm`, `material_offset = 1` cho mặt trong carbon) và bảo toàn góc cạnh cơ khí (`EDGE_SPLIT 42°`):
  - `PEDS_R42_REV1_LEFT_EXTERIOR_SHELL` (`SOLIDIFY 2.2 mm` + lớp trong Carbon Weave)
  - `PEDS_R42_REV1_RIGHT_EXTERIOR_SHELL` (`SOLIDIFY 2.2 mm` + lớp trong Carbon Weave)
  - `PEDS_R42_REV1_PRIMARY_HALO_STRUCTURE` (`SOLIDIFY 2.2 mm` + lớp trong Carbon Weave)
  - `PEDS_R42_REV1_EXTERIOR_UNDERTRAY_SHELL` (`SOLIDIFY 2.2 mm` + bảng tên nổi `PEDS R5` `1,490` tris)
- **Thay thế chi tiết cơ khí CAD & Khắc nổi Watermark 3D (`PEDS R5`):**
  - 4 ốc khóa tâm (`PEDS_*_CENTER_LOCK_NUT_GEOMETRY`): nâng từ `14` faces (`24` verts) lên `1,376` tris (trước) và `1,374` tris (sau) có vành côn 12 rãnh ăn khớp khóa tâm.
  - 4 cùm phanh monobloc 6-piston (`PEDS_*_BRAKE_CALIPER_GEOMETRY`): nâng từ `54–98` faces lên `1,424–1,876` tris, khắc nổi trực tiếp dòng chữ `PEDS R5` cao `1.2 mm` trên mặt ngoài `±Y`.
  - 2 bảng tên kỹ thuật (`Builders Plate PEDS R5` `160 mm × 42 mm × 3.6 mm`): gắn trên mặt trên sàn xe `(-0.45, 0.0, 0.062)` và nắp cam động cơ `(-1.05, 0.0, 0.648)`.
- **Ăn khớp cơ khí thật giữa Bán trục sau và Bích Moay-ơ (`shaftHubMechanicalEngagementProven = true`):**
  - Mở rộng `PEDS_R43_REAR_DRIVE_SHAFTS` với bầu khớp CV ngoài và ngõng trục then hoa từ `Y = ±0.6780 m` ra tới `Y = [-0.7356, +0.7335] m`, đi xuyên qua tâm `PEDS_R43_REAR_LEFT_WHEEL_HUB_MOUNT_FLANGE` (`Y = +0.7215 m`) và `PEDS_R43_REAR_RIGHT_WHEEL_HUB_MOUNT_FLANGE` (`Y = -0.7236 m`), khe hở dọc trục `0.000 m`.
- **Hợp nhất Vật liệu PBR (20 → 6 vật liệu chuẩn) & Xuất 3 tầng GLB (`EXT_meshopt_compression` + `KHR_mesh_quantization`):**
  - Số lượng vật liệu giảm từ `20` xuống đúng `6` vật liệu chuẩn; số lượng primitive slots giảm từ `144` xuống `93` (`90` primitives runtime, đạt ngưỡng mục tiêu `<= 90`).
  - Runtime set R5 đã xác minh: `set-bd4461602472a18a` (lưu tại gói local/archive):
    - `manifest-bd4461602472a18a01f0b292247eb6bb7edc7e030ec6a0f95b3765bfd5db68f1.json` (`166,470` bytes, schema `v6.r5`).
    - `HIGH`: `2,063,644` bytes / **`1.97 MB`** (`161,494` tris, SHA-256: `A5D72FF629A37F97633D3383D98A108433D493D3DD7BA782C350DB6A697F7C3D`).
    - `BALANCED`: `1,940,284` bytes / **`1.85 MB`** (`143,595` tris, SHA-256: `7660E978B21605DA95DF1CBEBD7B0CBB12E16A69BEA1DACB7498D47B4FE99EFD`).
    - `PERFORMANCE`: `1,708,532` bytes / **`1.63 MB`** (`123,346` tris, SHA-256: `199F54C8EC955BCE2E128EF80691D6888D0312582103BAAA7745AD0949BC2FE3`).
