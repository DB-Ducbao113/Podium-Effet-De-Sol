import { TeamId } from '../../types';

export interface ComponentCloseUp {
  titleVi: string;
  titleEn: string;
  partCode: string;
  imageUrl: string;
  conceptVi: string;
  conceptEn: string;
  highlightsVi: string[];
  highlightsEn: string[];
  specs: { labelVi: string; labelEn: string; value: string }[];
}

export type HotspotCloseUpMap = Record<string, ComponentCloseUp>;

export const TEAM_CLOSEUPS: Record<TeamId, HotspotCloseUpMap> = {
  ferrari: {
    wings: {
      titleVi: 'Cánh Gió Trước Cận Cảnh · Ferrari SF-26',
      titleEn: 'Ferrari SF-26 Front Wing Macro Close-up',
      partCode: 'FER-AERO-FW-26',
      imageUrl: '/images/showroom/closeups/ferrari_wings.webp',
      conceptVi:
        'Cận cảnh cánh gió trước Ferrari trong sắc đỏ Rosso Corsa kết hợp sọc vàng Modena đặc trưng. Kết cấu sợi carbon 40 lớp chịu lực nén hơn 450 kg tại 250 km/h với các khe chia gió Outwash triệt tiêu nhiễu động bánh xe.',
      conceptEn:
        'Macro close-up of the Ferrari front wing in iconic Rosso Corsa with Modena yellow accents. Aerospace-grade 40-ply carbon fiber generating over 450 kg downforce with outwash endplate strakes.',
      highlightsVi: [
        'Vật liệu Carbon T1000 siêu nhẹ sơn phủ bóng Rosso Corsa thủ công tại Maranello.',
        '4 tầng cánh Flaps điều chỉnh góc tấn công bằng vít vi chỉnh titan cấp độ milimet.',
        'Rãnh dẫn khí Outwash điều hướng luồng xoáy Y250 bọc ngoài bánh xe trước.',
      ],
      highlightsEn: [
        'Ultra-lightweight T1000 carbon fiber finished in hand-polished Rosso Corsa.',
        'Four cascade wing elements with millimeter-precision titanium angle-of-attack adjusters.',
        'Outwash endplate flow-conditioners routing Y250 vortex wake around the front tires.',
      ],
      specs: [
        { labelVi: 'Vật liệu', labelEn: 'Material', value: 'Carbon Pre-preg T1000 & Titanium' },
        { labelVi: 'Lực nén cực đại', labelEn: 'Peak Downforce', value: '460 kg @ 250 km/h' },
        { labelVi: 'Trọng lượng cụm cánh', labelEn: 'Assembly Weight', value: '9.8 kg' },
        { labelVi: 'Quy chuẩn', labelEn: 'Regulation', value: 'FIA 2026 1900mm Envelope' },
      ],
    },
    power_unit: {
      titleVi: 'Bộ Động Cơ Hybrid Ferrari 066/12 Cận Cảnh',
      titleEn: 'Ferrari 066/12 Power Unit Cutaway Close-up',
      partCode: 'FER-PU-066/12-HYBRID',
      imageUrl: '/images/showroom/closeups/ferrari_power_unit.webp',
      conceptVi:
        'Cận cảnh khối động cơ Ferrari 066/12 với nắp máy sơn sần đỏ Cavallino Rampante huyền thoại. Cụm tăng áp đơn Turbocharger kết nối cổ xả titan nung màu xanh tím cùng mô-tơ MGU-K dây quấn cam chống quá nhiệt.',
      conceptEn:
        'Direct macro cutaway of Ferrari’s 066/12 power unit featuring the crackle-red cam covers with the chrome prancing horse, glowing titanium exhaust headers, and high-voltage MGU-K motor.',
      highlightsVi: [
        'Buồng đốt phụ TJI (Turbulent Jet Ignition) đạt áp suất nén cực đại trên 300 bar.',
        'Cổ góp xả bằng hợp kim Inconel & Titanium chịu nhiệt độ khí xả trên 1,000°C.',
        'Mô-tơ điện MGU-K 350 kW thu hồi 8.5 MJ điện năng mỗi vòng đua, phóng thêm gần 470 mã lực tức thì.',
      ],
      highlightsEn: [
        'Turbulent Jet Ignition (TJI) combustion chambers operating above 300 bar pressure.',
        'Inconel and titanium exhaust headers built to sustain 1,000°C+ thermal blasts.',
        'MGU-K motor recuperating 8.5 MJ per lap, deploying nearly 470 instant electric horsepower.',
      ],
      specs: [
        { labelVi: 'Cấu hình', labelEn: 'Layout', value: '1.6L 90° V6 Turbo + MGU-K (2026)' },
        { labelVi: 'Tổng công suất', labelEn: 'Peak Output', value: '1,050+ Mã Lực (BHP)' },
        { labelVi: 'Vòng tua tối đa', labelEn: 'RPM Limit', value: '15,000 RPM' },
        { labelVi: 'Hiệu suất nhiệt', labelEn: 'Thermal Efficiency', value: '> 52.4% (Kỷ lục)' },
      ],
    },
    halo: {
      titleVi: 'Khung An Toàn Halo & Vô Lăng Ferrari Cận Cảnh',
      titleEn: 'Ferrari Halo & Cockpit Display Close-up',
      partCode: 'FER-SAFE-HALO-TITAN',
      imageUrl: '/images/showroom/closeups/ferrari_halo.webp',
      conceptVi:
        'Góc nhìn cận cảnh từ buồng lái Ferrari SF-26 qua vòm Halo titan sơn đỏ Rosso Corsa. Phía trước là vô lăng sợi carbon tích hợp màn hình OLED hiển thị vòng tua máy, số đang gài và hệ thống ERS.',
      conceptEn:
        'Cockpit perspective of the Ferrari SF-26 titanium Halo in vibrant Rosso Corsa, framing the carbon fiber race steering wheel with its telemetry OLED display and rev LED shift lights.',
      highlightsVi: [
        'Khung hợp kim Titan Grade 5 chịu lực ép tĩnh 121 kN (tương đương 12.3 tấn).',
        'Lớp vỏ khí động carbon bọc ngoài với cánh dẫn khí vi mô chống nhiễu động vào Airbox.',
        'Vô lăng carbon hiển thị dữ liệu thời gian thực: phân bổ phanh, bản đồ vi sai và DRS.',
      ],
      highlightsEn: [
        'Grade 5 Titanium core withstanding 121 kN (12.3 tonnes) static load.',
        'Aerodynamic carbon fairing with micro-vortex generators feeding clean air to engine airbox.',
        'Full carbon steering wheel with real-time brake bias, differential maps, and DRS indicators.',
      ],
      specs: [
        { labelVi: 'Vật liệu khung', labelEn: 'Structure', value: 'Titanium Grade 5 (Ti6Al4V)' },
        { labelVi: 'Trọng lượng thô', labelEn: 'Bare Weight', value: '7.0 kg' },
        { labelVi: 'Khả năng chịu tải', labelEn: 'Test Load', value: '121 kN (12.3 Tấn)' },
        { labelVi: 'Thời gian thoát hiểm', labelEn: 'Egress Limit', value: '< 7.0 Giây' },
      ],
    },
    drs: {
      titleVi: 'Cánh Gió Sau & Cơ Cấu Mở DRS · Ferrari SF-26',
      titleEn: 'Ferrari SF-26 Rear Wing & DRS Actuator Close-up',
      partCode: 'FER-AERO-RW-DRS',
      imageUrl: '/images/showroom/closeups/ferrari_drs.webp',
      conceptVi:
        'Cận cảnh cánh gió sau Ferrari với pít-tông thủy lực kích hoạt nâng cánh phụ DRS lên 85 mm. Khi mở, toàn bộ lực cản không khí phần đuôi giảm 30%, tăng ngay 20 km/h trên đoạn thẳng.',
      conceptEn:
        'Macro close-up of Ferrari’s rear wing showing the high-pressure hydraulic DRS actuator pivoting open by 85 mm, cutting drag by 30% for a 20 km/h overtake boost.',
      highlightsVi: [
        'Thời gian mở/đóng thủy lực dưới 250 mili-giây, ngắt tức thì khi đạp phanh.',
        'Cánh phụ Beam Wing phía dưới tăng cường hiệu suất hút gió của bộ khuếch tán sàn.',
        'Đèn an toàn mưa LED FIA tích hợp cảnh báo sạc năng lượng ERS.',
      ],
      highlightsEn: [
        'Sub-250ms hydraulic actuation response snapping shut on brake pedal contact.',
        'Lower beam wings amplifying rear underfloor diffuser suction.',
        'Integrated FIA rain LED with flashing green hybrid energy deployment warning.',
      ],
      specs: [
        { labelVi: 'Độ mở cánh (Slot Gap)', labelEn: 'Flap Opening', value: '85 mm (Chuẩn FIA)' },
        { labelVi: 'Tốc độ tăng thêm', labelEn: 'Top Speed Gain', value: '+18 – 25 km/h' },
        { labelVi: 'Áp suất thủy lực', labelEn: 'Hydraulic Pressure', value: '200+ Bar' },
        { labelVi: 'Giảm lực cản', labelEn: 'Drag Reduction', value: '~30% Total Drag' },
      ],
    },
    sidepods: {
      titleVi: 'Hốc Gió Sườn & Rãnh Khí Động Bathtub · Ferrari SF-26',
      titleEn: 'Ferrari SF-26 Bathtub Sidepod & Undercut Close-up',
      partCode: 'FER-AERO-SP-BATHTUB',
      imageUrl: '/images/showroom/closeups/ferrari_sidepods.webp',
      conceptVi:
        'Cận cảnh thiết kế sườn xe dạng bồn tắm (Bathtub downwash sidepods) độc quyền của Ferrari. Hốc gió dẫn luồng khí làm mát động cơ và ép dòng khí áp suất cao đi sát eo xe về sàn sau.',
      conceptEn:
        'Macro view of Ferrari’s signature bathtub-style sidepod gulley, channeling cooling ambient air to radiators while pressing high-energy airflow down to the diffuser.',
      highlightsVi: [
        'Máng trượt khí động dẫn luồng không khí sạch dồn vào cánh sau Beam Wing.',
        'Cấu trúc chống va đập cạnh sườn SIS tiêu chuẩn FIA bảo vệ tay đua.',
        'Các khe tản nhiệt mang cá mở rộng linh hoạt tùy theo nhiệt độ ngoài trời.',
      ],
      highlightsEn: [
        'Downwash channel sweeping clean air directly to the rear beam wing.',
        'FIA-certified Side Impact Spars (SIS) absorbing lateral crash energy.',
        'Interchangeable cooling louvers customized per race weekend temperature.',
      ],
      specs: [
        { labelVi: 'Kiến trúc khí động', labelEn: 'Aero Architecture', value: 'Sculpted Bathtub Downwash' },
        { labelVi: 'Nhiệt lượng tản', labelEn: 'Thermal Relief', value: '> 145 kW' },
        { labelVi: 'Vật liệu thân vỏ', labelEn: 'Bodywork', value: 'Carbon-Nomex Honeycomb' },
        { labelVi: 'Độ dày thành vỏ', labelEn: 'Shell Thickness', value: '1.2 – 1.8 mm' },
      ],
    },
    tires: {
      titleVi: 'Lốp Pirelli 18-Inch & Phanh Đĩa Carbon Brembo Cận Cảnh',
      titleEn: 'Pirelli 18-inch Tire & Brembo Carbon Brake Close-up',
      partCode: 'FER-CHASSIS-BRK-BREMBO',
      imageUrl: '/images/showroom/closeups/ferrari_tires.webp',
      conceptVi:
        'Cận cảnh mâm hợp kim Magiê 18 inch kết hợp cùm phanh Brembo và đĩa phanh carbon-carbon. Hơn 1,000 lỗ thông gió li ti giúp đĩa phanh giải nhiệt khi đạt nhiệt độ trên 1,000°C sau cú phanh 5G.',
      conceptEn:
        'Close-up of the 18-inch forged magnesium rim housing Brembo carbon-carbon brake discs. Over 1,000 cooling holes dissipate heat as discs glow red at 1,000°C under 5G deceleration.',
      highlightsVi: [
        'Đĩa phanh carbon Brembo dày 32mm với 1,050 lỗ tản nhiệt khoan chéo.',
        'Mâm xe có ốp khí động học (Wheel Cover) triệt tiêu nhiễu động vành xoay.',
        'Hợp chất lốp mềm P Zero Red C5 cho độ bám cơ học đỉnh cao khi ôm cua.',
      ],
      highlightsEn: [
        'Brembo 32mm carbon brake disc with 1,050 diagonally drilled cooling vents.',
        'Aerodynamic wheel covers eliminating chaotic rim turbulence.',
        'Pirelli P Zero Red C5 soft compound providing peak mechanical grip in corners.',
      ],
      specs: [
        { labelVi: 'Đường kính mâm', labelEn: 'Rim Size', value: '18 inches (Forged Magnesium)' },
        { labelVi: 'Nhiệt độ đĩa phanh', labelEn: 'Brake Disc Temp', value: 'Up to 1,050°C' },
        { labelVi: 'Lực hãm phanh', labelEn: 'Peak Decel', value: '> 5.5 G' },
        { labelVi: 'Áp suất lốp', labelEn: 'Tire Pressure', value: '21.5 – 24.0 PSI' },
      ],
    },
  },

  mclaren: {
    wings: {
      titleVi: 'Cánh Gió Trước Cận Cảnh · McLaren MCL38',
      titleEn: 'McLaren MCL38 Front Wing Macro Close-up',
      partCode: 'MCL-AERO-FW-38',
      imageUrl: '/images/showroom/closeups/mclaren_wings.webp',
      conceptVi:
        'Cận cảnh cánh gió trước McLaren MCL38 trong sắc cam Papaya huyền thoại kết hợp sợi carbon dệt đen bóng. Cụm cánh đa tầng với các rãnh Outwash dẫn luồng xoáy bọc quanh bánh trước, tối ưu hóa lực nén 465 kg tại 250 km/h.',
      conceptEn:
        'Macro close-up of the McLaren MCL38 front wing assembly finished in iconic Papaya Orange and raw carbon fiber weave. Multi-tier cascades generate 465 kg downforce with extreme outwash endplates.',
      highlightsVi: [
        'Sợi carbon Toray T1100 siêu nhẹ sơn phủ cam Papaya thủ công tại Trung tâm Công nghệ Woking.',
        'Bộ 4 tầng cánh Flaps điều chỉnh góc mở chính xác đến từng phần mười độ.',
        'Cụm Endplate dốc tạo luồng gió bọc quanh lốp trước giảm thiểu lực cản cuộn xoáy.',
      ],
      highlightsEn: [
        'Ultra-lightweight Toray T1100 carbon finished in iconic Woking Papaya.',
        'Precision 4-element adjustable cascade for surgical downforce tuning.',
        'Aggressive outwash endplates routing tire wake far away from floor tunnels.',
      ],
      specs: [
        { labelVi: 'Vật liệu', labelEn: 'Material', value: 'Pre-preg Carbon T1100 & Titanium' },
        { labelVi: 'Lực nén cực đại', labelEn: 'Peak Downforce', value: '465 kg @ 250 km/h' },
        { labelVi: 'Khối lượng cụm', labelEn: 'Assembly Weight', value: '9.6 kg' },
        { labelVi: 'Màu tem', labelEn: 'Livery', value: 'McLaren Papaya & Anthracite' },
      ],
    },
    power_unit: {
      titleVi: 'Bộ Động Cơ Mercedes-AMG M15 Hybrid · McLaren MCL38',
      titleEn: 'McLaren MCL38 Mercedes-AMG M15 Power Unit Close-up',
      partCode: 'MCL-PU-M15-HYBRID',
      imageUrl: '/images/showroom/closeups/mclaren_power_unit.webp',
      conceptVi:
        'Cận cảnh khu vực động cơ McLaren MCL38 với cửa hút gió Airbox bọc tem Android/Google. Bên trong là cỗ máy Mercedes-AMG M15 1.6L V6 Turbo Hybrid công suất hơn 1,050 mã lực, tối ưu khí động học thân xe cực mỏng.',
      conceptEn:
        'Close-up of the McLaren MCL38 engine compartment and overhead airbox featuring Android/Google branding. Houses the Mercedes-AMG M15 1.6L V6 Turbo Hybrid delivering over 1,050 combined horsepower.',
      highlightsVi: [
        'Cấu trúc tách rời Turbo nén và xả (Split-Turbo) đặt gọn trong khoang máy hẹp của McLaren.',
        'Hệ thống thu hồi động năng MGU-K 350 kW và pin lưu trữ ERS phóng thêm gần 470 mã lực tức thì.',
        'Thân vỏ carbon ôm sát động cơ giảm tối đa lực cản không khí ở tốc độ cao.',
      ],
      highlightsEn: [
        'Pioneering split-turbo layout tightly integrated into McLaren’s ultra-compact chassis.',
        'MGU-K motor and battery energy store deploying nearly 470 instantaneous electric BHP.',
        'Shrink-wrapped carbon engine cover minimizing aerodynamic drag profile.',
      ],
      specs: [
        { labelVi: 'Khối động cơ', labelEn: 'Engine Type', value: 'Mercedes-AMG M15 1.6L V6 Turbo' },
        { labelVi: 'Tổng công suất', labelEn: 'Total Output', value: '1,050+ HP' },
        { labelVi: 'Hiệu suất nhiệt', labelEn: 'Thermal Efficiency', value: '> 51%' },
        { labelVi: 'Đối tác động cơ', labelEn: 'Engine Partner', value: 'Mercedes-AMG High Performance' },
      ],
    },
    halo: {
      titleVi: 'Khung Bảo Vệ Titan Halo Cam Papaya · McLaren MCL38',
      titleEn: 'McLaren MCL38 Papaya Titanium Halo Close-up',
      partCode: 'MCL-SAFE-HALO-PAPAYA',
      imageUrl: '/images/showroom/closeups/mclaren_halo.webp',
      conceptVi:
        'Cận cảnh vòm an toàn Halo titan trên xe McLaren MCL38 phủ sơn cam Papaya rực rỡ. Bảo vệ tối đa khoang lái của Lando Norris và Oscar Piastri trước mọi lực va chạm cực hạn lên tới 12.3 tấn.',
      conceptEn:
        'Macro close-up of the McLaren MCL38 Grade 5 Titanium Halo in vibrant Papaya Orange, shielding drivers Lando Norris and Oscar Piastri against catastrophic 12.3-tonne static impacts.',
      highlightsVi: [
        'Lõi hợp kim Titan Grade 5 chịu tải trọng tĩnh 121 kN đạt chuẩn kiểm định an toàn FIA.',
        'Lớp ốp khí động học bọc ngoài hướng luồng gió trực diện vào cửa hút Airbox phía sau.',
        'Góc quan sát buồng lái tích hợp gương chiếu hậu khí động và camera hành trình HD.',
      ],
      highlightsEn: [
        'Grade 5 Titanium core withstanding 121 kN (12.3 tonnes) static FIA proof load.',
        'Sculpted carbon aerodynamic fairing laminating airflow into the overhead engine intake.',
        'Optimized cockpit aperture with integrated aerodynamic mirrors and HD onboard cameras.',
      ],
      specs: [
        { labelVi: 'Vật liệu cốt', labelEn: 'Core Material', value: 'Titanium Grade 5 (Ti6Al4V)' },
        { labelVi: 'Trọng lượng khung', labelEn: 'Weight', value: '7.0 kg' },
        { labelVi: 'Khả năng chịu tải', labelEn: 'Load Capacity', value: '121 kN (12.3 Tấn)' },
        { labelVi: 'Màu sơn', labelEn: 'Finish', value: 'McLaren Papaya Gloss' },
      ],
    },
    drs: {
      titleVi: 'Cánh Gió Sau DRS Thương Hiệu OKX · McLaren MCL38',
      titleEn: 'McLaren MCL38 Rear Wing & OKX DRS Mechanism Close-up',
      partCode: 'MCL-AERO-DRS-OKX',
      imageUrl: '/images/showroom/closeups/mclaren_drs.webp',
      conceptVi:
        'Cận cảnh cánh gió đuôi McLaren MCL38 với nhận diện OKX và cơ cấu mở cánh DRS điều khiển thủy lực. Mở góc 85 mm giúp xe đạt vận tốc tức thời trên 345 km/h trên những đoạn thẳng dài.',
      conceptEn:
        'Close-up of the McLaren MCL38 rear wing displaying OKX livery and rapid hydraulic DRS flap actuator. Opening 85 mm delivers a top speed surge beyond 345 km/h.',
      highlightsVi: [
        'Thời gian bung mở cánh lướt gió dưới 200 mili-giây qua pít-tông thủy lực 200 bar.',
        'Tự động đóng cánh an toàn chỉ trong 1 phần trăm giây ngay khi phát hiện đạp phanh.',
        'Cánh Beam Wing phía dưới khuếch đại dòng hút của bộ khuếch tán sàn sau.',
      ],
      highlightsEn: [
        'Sub-200ms rapid hydraulic actuation driven by 200+ bar pressure lines.',
        'Instant fail-safe closure triggered the millisecond braking pressure begins.',
        'Lower beam wing elements amplifying ground-effect underfloor suction.',
      ],
      specs: [
        { labelVi: 'Độ mở cánh DRS', labelEn: 'DRS Slot Gap', value: '85 mm (FIA Spec)' },
        { labelVi: 'Tốc độ tăng thêm', labelEn: 'Top Speed Gain', value: '+20 – 24 km/h' },
        { labelVi: 'Vật liệu', labelEn: 'Composite', value: 'High-Modulus Pre-preg Carbon' },
        { labelVi: 'Tài trợ chính', labelEn: 'Livery Sponsor', value: 'OKX & Android' },
      ],
    },
    sidepods: {
      titleVi: 'Hốc Gió Sườn Undercut & Rãnh Downwash · McLaren MCL38',
      titleEn: 'McLaren MCL38 Downwash Sidepod & Undercut Close-up',
      partCode: 'MCL-AERO-SP-DOWNWASH',
      imageUrl: '/images/showroom/closeups/mclaren_sidepods.webp',
      conceptVi:
        'Cận cảnh thiết kế sườn xe khí động học của McLaren MCL38 với hốc gió thuôn dài, rãnh khoét sâu Undercut và máng trượt Downwash ép dòng khí áp suất cao xuống sàn xe và cánh sau.',
      conceptEn:
        'Macro close-up of the McLaren MCL38 sidepod architecture showcasing aggressive undercuts and smooth downwash gulleys directing high-energy airflow toward the rear diffuser.',
      highlightsVi: [
        'Rãnh khoét sườn Undercut cực sâu tối đa hóa luồng khí chảy vào sàn gầm Venturi.',
        'Vỏ carbon chịu nhiệt phủ logo Vuse và Tezos bảo vệ dàn tản nhiệt kép bên trong.',
        'Khe tản nhiệt mang cá mở rộng tùy biến theo nhiệt độ từng chặng đua.',
      ],
      highlightsEn: [
        'Deep waist undercut feeding massive laminar airflow into underfloor Venturi tunnels.',
        'Thermal-insulated carbon body panels carrying Vuse and Tezos sponsor decals.',
        'Modular cooling gills optimized for track temperature demands.',
      ],
      specs: [
        { labelVi: 'Triết lý khí động', labelEn: 'Aero Concept', value: 'Extreme Downwash Undercut' },
        { labelVi: 'Giải nhiệt động cơ', labelEn: 'Cooling Capacity', value: '> 145 kW' },
        { labelVi: 'Vật liệu thân vỏ', labelEn: 'Body Composite', value: 'Carbon-Nomex Honeycomb' },
        { labelVi: 'Màu hoàn thiện', labelEn: 'Finish', value: 'Papaya Orange & Matte Carbon' },
      ],
    },
    tires: {
      titleVi: 'Lốp Pirelli & Ốp Mâm Google Chrome Cận Cảnh · McLaren',
      titleEn: 'McLaren MCL38 Pirelli Tires & Google Chrome Wheel Covers',
      partCode: 'MCL-CHASSIS-BRK-CHROME',
      imageUrl: '/images/showroom/closeups/mclaren_tires.webp',
      conceptVi:
        'Cận cảnh mâm hợp kim ma-giê 18 inch trên xe McLaren MCL38 trang bị ốp mâm khí động học đa sắc màu Google Chrome đặc trưng, kết hợp cùm phanh Brembo carbon chịu nhiệt trên 1,000°C.',
      conceptEn:
        'Close-up of the 18-inch forged magnesium rim on the McLaren MCL38 featuring signature Google Chrome rainbow aero wheel covers and Brembo carbon-carbon brake discs enduring 1,000°C+ stops.',
      highlightsVi: [
        'Ốp mâm khí động học Google Chrome triệt tiêu luồng xoáy hỗn loạn của vành bánh xoay.',
        'Đĩa phanh carbon Brembo tản nhiệt qua hơn 1,000 lỗ khoan chéo chịu lực phanh 5.5G.',
        'Hợp chất lốp Pirelli P Zero tối ưu hóa độ bám đường trên từng mét cua.',
      ],
      highlightsEn: [
        'Signature Google Chrome aerodynamic wheel covers smoothing wheel rim turbulence.',
        'Brembo carbon-carbon brake rotor with 1,000+ cooling vents absorbing 5.5G deceleration.',
        'Pirelli P Zero compound delivering pinpoint mechanical grip.',
      ],
      specs: [
        { labelVi: 'Kích cỡ mâm', labelEn: 'Rim Size', value: '18 inches (Forged Magnesium)' },
        { labelVi: 'Nhiệt độ phanh tối đa', labelEn: 'Max Brake Temp', value: '1,050°C' },
        { labelVi: 'Lực hãm phanh', labelEn: 'Deceleration', value: '> 5.5 G' },
        { labelVi: 'Đối tác bánh xe', labelEn: 'Partners', value: 'Pirelli & Google Chrome' },
      ],
    },
  },

  mercedes: {
    wings: {
      titleVi: 'Cánh Gió Trước Cận Cảnh · Mercedes-AMG W15',
      titleEn: 'Mercedes-AMG W15 Front Wing Macro Close-up',
      partCode: 'MB-AERO-FW-W15',
      imageUrl: '/images/showroom/closeups/mercedes_wings.webp',
      conceptVi:
        'Cận cảnh cánh gió trước Mercedes W15 phối màu Bạc Mũi Tên Bạc (Silver Arrows) kết hợp dải xanh ngọc lục bảo Petronas. Thiết kế mũi xe thanh mảnh với các rãnh chia gió triệt tiêu nhiễu động bánh xe.',
      conceptEn:
        'Macro close-up of the Mercedes W15 front wing finished in Silver Arrow metallic and Petronas Emerald Turquoise. Features a sculpted needle nose and cascades shedding front-tire turbulence.',
      highlightsVi: [
        'Vỏ cánh trước hoàn thiện phủ bạc metallic kết hợp điểm nhấn xanh Petronas.',
        'Mũi xe vuốt dốc tối ưu hóa luồng khí chảy vào họng gầm Venturi.',
        'Cụm điều khiển góc cánh bằng sợi carbon đa hướng gia cố titan.',
      ],
      highlightsEn: [
        'Silver Arrow metallic surface with Petronas turquoise aerodynamic tips.',
        'Low-drag nosecone profile conditioning laminar flow into underfloor tunnels.',
        'Multi-element carbon flap assembly with titanium-reinforced pivots.',
      ],
      specs: [
        { labelVi: 'Vật liệu', labelEn: 'Material', value: 'High-Modulus Carbon & Titanium' },
        { labelVi: 'Lực nén cực đại', labelEn: 'Peak Downforce', value: '455 kg @ 250 km/h' },
        { labelVi: 'Khối lượng cụm', labelEn: 'Weight', value: '10.1 kg' },
        { labelVi: 'Triết lý', labelEn: 'Philosophy', value: 'Silver Arrow Low-Wake Flow' },
      ],
    },
    power_unit: {
      titleVi: 'Động Cơ Mercedes-AMG M15 E Performance Cận Cảnh',
      titleEn: 'Mercedes-AMG M15 E Performance Power Unit Close-up',
      partCode: 'MB-PU-M15-BRIXWORTH',
      imageUrl: '/images/showroom/closeups/mercedes_power_unit.webp',
      conceptVi:
        'Cận cảnh cỗ máy Mercedes-AMG M15 chế tác tại Brixworth, vương quốc Anh. Động cơ tăng áp Turbo Hybrid dẫn đầu về độ tin cậy và hiệu suất thu hồi động năng MGU-K 350 kW theo luật 2026 (đã bỏ MGU-H).',
      conceptEn:
        'Detailed engineering cutaway of the Brixworth-built Mercedes-AMG M15 power unit, renowned for unrivaled reliability and thermodynamic energy harvesting.',
      highlightsVi: [
        'Thiết kế tách rời trục Turbo nén và xả (Split-Turbo) đặt ở hai đầu động cơ.',
        'Bộ tản nhiệt nước tích hợp siêu nhỏ gọn ép sát khối máy V6.',
        'Công suất hơn 1050 mã lực kết hợp mô-tơ MGU-K bền bỉ qua trọn vẹn mùa giải.',
      ],
      highlightsEn: [
        'Pioneering split-turbo architecture separating compressor and turbine.',
        'Ultra-compact water-to-air charge coolers nestled tightly against the V6 block.',
        '1050+ combined horsepower with class-leading season endurance.',
      ],
      specs: [
        { labelVi: 'Cấu hình', labelEn: 'Engine Type', value: '1.6L 90° V6 Single Turbo Hybrid' },
        { labelVi: 'Công suất', labelEn: 'Total Output', value: '1,050+ HP' },
        { labelVi: 'Địa điểm chế tác', labelEn: 'Origin', value: 'Brixworth, United Kingdom' },
        { labelVi: 'Dung lượng ERS', labelEn: 'Battery Energy', value: '8.5 MJ per lap (2026)' },
      ],
    },
    halo: {
      titleVi: 'Khung Bảo Vệ Halo Xanh Ngọc Petronas · Mercedes W15',
      titleEn: 'Mercedes W15 Petronas Turquoise Halo Close-up',
      partCode: 'MB-SAFE-HALO-PETRONAS',
      imageUrl: '/images/showroom/closeups/mercedes_halo.webp',
      conceptVi:
        'Cận cảnh khung Halo titan phủ sơn xanh ngọc lục bảo Petronas nổi bật trên nền xe bạc W15. Khung bảo vệ đạt chuẩn FIA bảo vệ buồng lái tay đua khỏi các va chạm tốc độ cao.',
      conceptEn:
        'Macro close-up of the Mercedes W15 Halo finished in iconic Petronas turquoise, enclosing the high-tech cockpit and protecting the driver from heavy impacts.',
      highlightsVi: [
        'Lớp sơn phủ Petronas Turquoise đặc trưng hòa quyện cùng thân xe Silver Arrows.',
        'Rãnh cánh nhỏ vi mô trên đỉnh Halo điều hướng khí thẳng vào cửa hút Airbox.',
        'Hệ thống ngắt điện khẩn cấp tích hợp trên khung Halo.',
      ],
      highlightsEn: [
        'Signature Petronas turquoise livery accentuating the Silver Arrow chassis.',
        'Micro fairing fins guiding clean airflow directly to the engine intake scoop.',
        'Integrated cockpit emergency power cut-off buttons.',
      ],
      specs: [
        { labelVi: 'Vật liệu', labelEn: 'Core Material', value: 'Titanium Grade 5' },
        { labelVi: 'Lực thử nghiệm', labelEn: 'Static Load', value: '12.3 Tấn' },
        { labelVi: 'Màu sơn', labelEn: 'Livery Finish', value: 'Petronas Turquoise Gloss' },
        { labelVi: 'Trọng lượng', labelEn: 'Weight', value: '7.0 kg' },
      ],
    },
    drs: {
      titleVi: 'Cánh Gió Sau DRS Mercedes-AMG W15 Cận Cảnh',
      titleEn: 'Mercedes-AMG W15 Rear Wing DRS Close-up',
      partCode: 'MB-AERO-RW-DRS-15',
      imageUrl: '/images/showroom/closeups/mercedes_drs.webp',
      conceptVi:
        'Cận cảnh cánh đuôi Mercedes W15 với cơ cấu DRS thủy lực siêu nhạy, mở góc lướt gió giải phóng tốc độ tối đa trên 340 km/h.',
      conceptEn:
        'Close-up of the Mercedes W15 rear wing with rapid hydraulic DRS actuator opening for 340+ km/h straight-line runs.',
      highlightsVi: [
        'Cánh phụ DRS mở góc 85 mm bằng cơ cấu thủy lực siêu chính xác.',
        'Chữ AMG và logo ngôi sao ba cánh khắc laser sắc nét.',
        'Cánh Beam Wing kép nâng cao hiệu suất hút gầm sau.',
      ],
      highlightsEn: [
        'Precision 85mm hydraulic flap clearance.',
        'Laser-etched AMG and three-pointed star livery.',
        'Dual beam wing profile boosting diffuser efficiency.',
      ],
      specs: [
        { labelVi: 'Độ mở cánh', labelEn: 'Gap', value: '85 mm' },
        { labelVi: 'Gia tốc tốc độ', labelEn: 'Speed Delta', value: '+20 km/h' },
        { labelVi: 'Vật liệu', labelEn: 'Material', value: 'High-stiffness Carbon' },
        { labelVi: 'Đèn cảnh báo', labelEn: 'Rain Light', value: 'FIA Ultra-bright LED' },
      ],
    },
    sidepods: {
      titleVi: 'Hốc Gió Undercut Khí Động · Mercedes W15 Cận Cảnh',
      titleEn: 'Mercedes W15 Undercut Sidepod Channel Close-up',
      partCode: 'MB-AERO-SP-UNDERCUT',
      imageUrl: '/images/showroom/closeups/mercedes_sidepods.webp',
      conceptVi:
        'Cận cảnh hốc hút gió sườn dốc (Undercut Channel) Mercedes W15. Luồng không khí áp suất cao được gia tốc qua sườn xe, cấp năng lượng trực tiếp cho sàn gầm Venturi.',
      conceptEn:
        'Close-up of the sculpted undercut sidepod channels on the Mercedes W15, accelerating ambient flow around the chassis toward the diffuser.',
      highlightsVi: [
        'Đường rãnh khoét sâu dưới hốc gió gia tốc luồng khí sườn xe.',
        'Bố trí dàn tản nhiệt góc nghiêng tối ưu trọng tâm xe.',
        'Vỏ carbon chịu nhiệt bảo vệ hệ thống tản nhiệt nội bộ.',
      ],
      highlightsEn: [
        'Deep undercut channel guiding high-velocity air along the chassis waist.',
        'Angled radiator packaging lowering the overall roll center.',
        'Heat-shielded carbon panels protecting internal intercoolers.',
      ],
      specs: [
        { labelVi: 'Kiểu dáng', labelEn: 'Profile', value: 'Deep Undercut Channel' },
        { labelVi: 'Công suất làm mát', labelEn: 'Cooling Power', value: '> 140 kW' },
        { labelVi: 'Vật liệu', labelEn: 'Composite', value: 'Carbon-Nomex' },
        { labelVi: 'Màu sơn', labelEn: 'Finish', value: 'Silver Metallic & Teal' },
      ],
    },
    tires: {
      titleVi: 'Lốp Pirelli 18-Inch Mercedes W15 Cận Cảnh',
      titleEn: 'Mercedes W15 Pirelli Tire & Carbon Brakes Close-up',
      partCode: 'MB-CHASSIS-WHEEL-18',
      imageUrl: '/images/showroom/closeups/mercedes_tires.webp',
      conceptVi:
        'Cận cảnh vành mâm hợp kim ma-giê 18-inch với ốp mâm khí động học và đĩa phanh carbon chịu lực hãm trên 5G.',
      conceptEn:
        'Close-up of the 18-inch magnesium wheel with aero covers and carbon-carbon brake discs capable of 5G braking forces.',
      highlightsVi: [
        'Ốp mâm phẳng triệt tiêu luồng xoáy hỗn loạn của bánh trước.',
        'Đĩa phanh carbon tản nhiệt nhanh qua hơn 1,000 lỗ vi mô.',
        'Van cảm biến áp suất và nhiệt độ lốp theo thời gian thực.',
      ],
      highlightsEn: [
        'Flush wheel covers shedding aerodynamic wheel wake.',
        'High-thermal-relief carbon brake discs with 1,000+ drilled vents.',
        'Real-time tire pressure and temperature telemetry sensors.',
      ],
      specs: [
        { labelVi: 'Kích cỡ mâm', labelEn: 'Wheel Size', value: '18 inches' },
        { labelVi: 'Vật liệu', labelEn: 'Material', value: 'Forged Magnesium' },
        { labelVi: 'Gia tốc phanh', labelEn: 'Deceleration', value: '> 5.5 G' },
        { labelVi: 'Nhà cung cấp', labelEn: 'Tire Supplier', value: 'Pirelli Motorsport' },
      ],
    },
  },

  redbull: {
    wings: {
      titleVi: 'Cánh Gió Trước Cận Cảnh · Red Bull RB20',
      titleEn: 'Red Bull Racing RB20 Front Wing Close-up',
      partCode: 'RBR-AERO-FW-RB20',
      imageUrl: '/images/showroom/closeups/redbull_wings.webp',
      conceptVi:
        'Cận cảnh cánh gió trước Red Bull RB20 trong lớp sơn xanh mờ Midnight Navy kết hợp dải vàng và biểu tượng bò tót đỏ. Góc cánh được tối ưu để tạo lực nén cực mạnh cho mũi xe khi vào cua tốc độ cao.',
      conceptEn:
        'Close-up of the Red Bull RB20 front wing in signature matte Midnight Navy with sunburst yellow accents, generating pinpoint front-axle bite in high-speed apexes.',
      highlightsVi: [
        'Lớp sơn mờ Velvet Satin đặc trưng giúp giảm trọng lượng nước sơn.',
        'Cấu trúc khí động học mũi xe kết hợp hệ thống treo trước Pull-rod chống chúi.',
        'Endplate vuốt cong triệt tiêu lực cản không khí hỗn loạn.',
      ],
      highlightsEn: [
        'Distinctive matte velvet finish shedding unneeded paint weight.',
        'Nosecone aero working in unison with anti-dive pull-rod front suspension.',
        'Curved endplate winglets directing turbulent wheel wake outboard.',
      ],
      specs: [
        { labelVi: 'Vật liệu', labelEn: 'Material', value: 'Carbon Fiber Pre-preg' },
        { labelVi: 'Lực nén', labelEn: 'Downforce', value: '470 kg @ 250 km/h' },
        { labelVi: 'Bề mặt sơn', labelEn: 'Finish', value: 'Matte Satin Velvet' },
        { labelVi: 'Đặc tính', labelEn: 'Key Trait', value: 'Anti-Dive Platform Grip' },
      ],
    },
    power_unit: {
      titleVi: 'Động Cơ Honda RBPTH002 Cận Cảnh · Red Bull',
      titleEn: 'Honda RBPTH002 Power Unit Cutaway · Red Bull',
      partCode: 'RBR-PU-HONDA-HRC',
      imageUrl: '/images/showroom/closeups/redbull_power_unit.webp',
      conceptVi:
        'Cận cảnh khối động cơ Honda RBPTH002 do Honda HRC phát triển cho Red Bull Racing. Cỗ máy vô địch thế giới nổi tiếng với độ tin cậy cơ học và khả năng phân bổ mô-men xoắn tức thời.',
      conceptEn:
        'Cutaway close-up of the championship-winning Honda RBPTH002 power unit developed by Honda HRC, famed for rapid torque delivery and bulletproof endurance.',
      highlightsVi: [
        'Bộ tăng áp Honda hiệu suất cao với vòng tua đạt trên 100,000 RPM.',
        'Hệ thống thu hồi động năng MGU-K và pin ERS đạt độ bền vượt trội.',
        'Tối ưu hóa khả năng thoát cua với độ trễ chân ga gần như bằng 0.',
      ],
      highlightsEn: [
        'Ultra-high-efficiency Honda turbocharger spinning beyond 100,000 RPM.',
        'Rugged MGU-K and energy store battery system with proven reliability.',
        'Near-zero turbo lag providing surgical corner-exit acceleration.',
      ],
      specs: [
        { labelVi: 'Động cơ', labelEn: 'Engine', value: '1.6L V6 Turbo Hybrid' },
        { labelVi: 'Tổng công suất', labelEn: 'Peak Output', value: '1,050+ HP' },
        { labelVi: 'Hợp tác kỹ thuật', labelEn: 'Partnership', value: 'Red Bull Powertrains / Honda HRC' },
        { labelVi: 'Danh hiệu', labelEn: 'Titles', value: 'Championship Winning Unit' },
      ],
    },
    halo: {
      titleVi: 'Khung Halo Sơn Mờ Cận Cảnh · Red Bull RB20',
      titleEn: 'Red Bull RB20 Matte Navy Halo Close-up',
      partCode: 'RBR-SAFE-HALO-MATTE',
      imageUrl: '/images/showroom/closeups/redbull_halo.webp',
      conceptVi:
        'Cận cảnh khung Halo titan trong sắc xanh bóng đêm mờ của Red Bull, bảo vệ khoang lái của Max Verstappen trước mọi hiểm nguy trên đường đua.',
      conceptEn:
        'Close-up of the Red Bull titanium Halo safety cell finished in matte midnight navy, protecting the driver cockpit against severe track impacts.',
      highlightsVi: [
        'Vỏ ngoài carbon sơn mờ triệt tiêu hoàn toàn hiện tượng phản chiếu ánh đèn đêm (Singapore, Bahrain).',
        'Cánh định hướng khí laminating luồng gió vào hộp nạp trên nóc xe.',
        'Khả năng chịu va chạm tĩnh 12.3 tấn.',
      ],
      highlightsEn: [
        'Matte finish eliminating glare during floodlit night races.',
        'Aerodynamic fairing laminating airflow into the overhead engine airbox.',
        'Rated to withstand a 12.3-tonne static load.',
      ],
      specs: [
        { labelVi: 'Vật liệu', labelEn: 'Structure', value: 'Titanium Grade 5' },
        { labelVi: 'Trọng lượng', labelEn: 'Weight', value: '7.0 kg' },
        { labelVi: 'Tải trọng', labelEn: 'Load Limit', value: '121 kN' },
        { labelVi: 'Màu sắc', labelEn: 'Colorway', value: 'Midnight Navy Matte' },
      ],
    },
    drs: {
      titleVi: 'Cánh Gió Sau DRS Red Bull RB20 Cận Cảnh',
      titleEn: 'Red Bull RB20 Rear Wing DRS Close-up',
      partCode: 'RBR-AERO-RW-DRS',
      imageUrl: '/images/showroom/closeups/redbull_drs.webp',
      conceptVi:
        'Cận cảnh cánh sau Red Bull RB20 kết hợp hệ thống mở DRS thủy lực giúp xe đạt vận tốc kinh ngạc tại Monza và Spa-Francorchamps.',
      conceptEn:
        'Macro close-up of the Red Bull rear wing DRS mechanism delivering ferocious straight-line top speed at high-speed temples like Monza and Spa.',
      highlightsVi: [
        'Cơ chế mở DRS phản ứng siêu nhạy dưới 250 mili-giây.',
        'Cánh Beam Wing kép tối ưu áp suất đáy sàn xe.',
        'Độ ổn định thân xe tuyệt đối khi đóng cánh gió ở tốc độ phanh gấp.',
      ],
      highlightsEn: [
        'Sub-250ms hydraulic DRS actuation.',
        'Dual beam wing elements extracting maximum floor diffuser suction.',
        'Flawless aerodynamic stability on rapid flap closure under braking.',
      ],
      specs: [
        { labelVi: 'Khe hở DRS', labelEn: 'Slot Gap', value: '85 mm' },
        { labelVi: 'Tăng tốc độ', labelEn: 'Delta Speed', value: '+22 km/h' },
        { labelVi: 'Cơ chế', labelEn: 'Actuation', value: 'High-pressure Hydraulic' },
        { labelVi: 'Sơn phủ', labelEn: 'Finish', value: 'Carbon & Bull Red' },
      ],
    },
    sidepods: {
      titleVi: 'Hốc Gió Sườn Overbite Độc Quyền · Red Bull RB20',
      titleEn: 'Red Bull RB20 Revolutionary Overbite Sidepod Close-up',
      partCode: 'RBR-AERO-SP-OVERBITE',
      imageUrl: '/images/showroom/closeups/redbull_sidepods.webp',
      conceptVi:
        'Cận cảnh thiết kế hốc hút gió sườn đảo ngược (Overbite Inlet) đột phá của Red Bull. Cửa hút khí nhô ra phía trên tạo khe hút gió hẹp nằm ngang giải phóng luồng khí khổng lồ xuống sàn xe.',
      conceptEn:
        'Close-up of Red Bull’s groundbreaking overbite sidepod geometry with an extended upper lip, exposing a massive undercut path for floor downforce.',
      highlightsVi: [
        'Môi trên hốc gió kéo dài về phía trước, che chắn miệng hút khỏi luồng nhiễu động.',
        'Rãnh sườn xe khoét sâu tối đa cho phép luồng khí sạch chạy thẳng về bộ khuếch tán.',
        'Bố trí tản nhiệt nghiêng kết hợp khe mang cá làm mát động cơ.',
      ],
      highlightsEn: [
        'Extended overbite upper cowl shielding the intake from turbulent wake.',
        'Class-leading extreme waist undercut feeding high-energy air directly to the diffuser.',
        'Compact internal radiators paired with interchangeable cooling gills.',
      ],
      specs: [
        { labelVi: 'Kiến trúc', labelEn: 'Concept', value: 'Revolutionary Overbite Intake' },
        { labelVi: 'Tản nhiệt', labelEn: 'Heat Duty', value: '> 145 kW' },
        { labelVi: 'Vỏ sườn', labelEn: 'Body Shell', value: 'Ultra-thin Carbon Honeycomb' },
        { labelVi: 'Lợi thế', labelEn: 'Advantage', value: 'Floor Sealing & Low Drag' },
      ],
    },
    tires: {
      titleVi: 'Lốp Pirelli & Phanh Đĩa Carbon Red Bull RB20 Cận Cảnh',
      titleEn: 'Red Bull RB20 18-inch Wheel & Carbon Brake Close-up',
      partCode: 'RBR-CHASSIS-BRK-18',
      imageUrl: '/images/showroom/closeups/redbull_tires.webp',
      conceptVi:
        'Cận cảnh hệ thống phanh carbon và lốp Pirelli 18-inch trên cỗ máy RB20, hỗ trợ những pha phanh muộn thần sầu của các tay đua Red Bull.',
      conceptEn:
        'Close-up of the carbon-carbon brake rotor and Pirelli 18-inch tire on the RB20, enabling signature late-braking dive-bombs into slow corners.',
      highlightsVi: [
        'Đĩa phanh carbon chịu nhiệt độ tức thời trên 1,000°C khi hãm phanh từ 340 km/h.',
        'Hệ thống ống dẫn gió làm mát phanh tối ưu khí động học bánh xe.',
        'Kiểm soát nhiệt độ lốp vượt trội hạn chế tối đa hiện tượng quá nhiệt.',
      ],
      highlightsEn: [
        'Carbon discs operating reliably beyond 1,000°C under 5G deceleration.',
        'Bespoke brake cooling ducting conditioning aerodynamic wheel rim airflow.',
        'Superior thermal tire management preventing thermal degradation.',
      ],
      specs: [
        { labelVi: 'Đường kính mâm', labelEn: 'Wheel Size', value: '18 inches' },
        { labelVi: 'Vật liệu phanh', labelEn: 'Brake Material', value: 'Carbon-Carbon' },
        { labelVi: 'Lực phanh', labelEn: 'Braking Force', value: '> 5.5 G' },
        { labelVi: 'Hợp chất', labelEn: 'Compounds', value: 'Pirelli C1 – C5' },
      ],
    },
  },

  // Dedicated builder for remaining teams with 100% authentic team-specific images & liveries
  astonmartin: createGenericTeamCloseups('astonmartin', 'Aston Martin Aramco', 'AMR25', '#00594f', 'British Racing Metallic Green & Lime'),
  alpine: createGenericTeamCloseups('alpine', 'BWT Alpine F1', 'A525', '#0090ff', 'Alpine Royal Blue & Bubblegum Pink'),
  racingbulls: createGenericTeamCloseups('racingbulls', 'Visa Cash App RB', 'VCARB 02', '#1634cb', 'Gloss Royal Racing Blue & White'),
  haas: createGenericTeamCloseups('haas', 'MoneyGram Haas F1', 'VF-25', '#e5e7eb', 'Storm Pearl White & Haas Red'),
  williams: createGenericTeamCloseups('williams', 'Williams Racing', 'FW47', '#002447', 'Williams Heritage Navy & Cyan'),
  audi: createGenericTeamCloseups('audi', 'Audi F1 Team', 'R26', '#c4c8cc', 'Matte Titanium Silver & High-Voltage Red'),
  cadillac: createGenericTeamCloseups('cadillac', 'Cadillac F1 Team', 'MAC-26', '#141518', 'Stealth Velvet Black & Satin Gold'),
};

function createGenericTeamCloseups(
  teamId: TeamId,
  teamName: string,
  carModel: string,
  primaryColor: string,
  liveryNotes: string
): HotspotCloseUpMap {
  return {
    wings: {
      titleVi: `Cánh Gió Trước Cận Cảnh · ${teamName} ${carModel}`,
      titleEn: `${teamName} ${carModel} Front Wing Macro Close-up`,
      partCode: `${teamId.toUpperCase()}-AERO-FW-26`,
      imageUrl: `/images/showroom/closeups/${teamId}_wings.webp`,
      conceptVi: `Cận cảnh cánh gió trước ${teamName} phối màu sắc đặc trưng (${liveryNotes}). Cấu trúc sợi carbon đa lớp tối ưu hóa lực nén bánh trước và phân tách luồng khí sạch vào họng sàn gầm.`,
      conceptEn: `Macro close-up of ${teamName} ${carModel} front wing assembly finished in authentic team livery (${liveryNotes}), guiding clean laminar airflow to the ground-effect tunnels.`,
      highlightsVi: [
        `Vỏ carbon hoàn thiện màu tem ${teamName} chống chịu lực nén hàng trăm kg.`,
        '4 tầng cánh khí động học điều chỉnh góc mở linh hoạt từng chặng đua.',
        'Endplate định hình luồng xoáy Outwash triệt tiêu nhiễu động bánh xe.',
      ],
      highlightsEn: [
        `Finished in official ${teamName} livery withstanding heavy downforce loads.`,
        'Adjustable 4-tier aerodynamic flap cascade tuned per circuit.',
        'Outwash endplates directing turbulent wheel wake away from the underfloor.',
      ],
      specs: [
        { labelVi: 'Vật liệu', labelEn: 'Construction', value: 'Carbon Fiber Pre-preg' },
        { labelVi: 'Lực nén cực đại', labelEn: 'Peak Downforce', value: '450+ kg @ 250 km/h' },
        { labelVi: 'Quy chuẩn', labelEn: 'Regulation', value: 'FIA 2026 Spec' },
        { labelVi: 'Màu tem', labelEn: 'Livery', value: liveryNotes },
      ],
    },
    power_unit: {
      titleVi: `Bộ Động Cơ Hybrid Cận Cảnh · ${teamName}`,
      titleEn: `${teamName} V6 Turbo Hybrid Power Unit Cutaway`,
      partCode: `${teamId.toUpperCase()}-PU-HYBRID`,
      imageUrl: `/images/showroom/closeups/${teamId}_power_unit.webp`,
      conceptVi: `Cận cảnh khối động cơ đốt trong 1.6L V6 Turbo kết hợp mô-tơ điện thu hồi động năng MGU-K cung cấp hơn 1,000 mã lực cho cỗ máy ${carModel}.`,
      conceptEn: `Engineering cutaway of the 1.6L V6 Turbo Hybrid power unit delivering over 1,000 combined horsepower to the ${teamName} ${carModel}.`,
      highlightsVi: [
        'Công nghệ đánh lửa buồng đốt phụ TJI tối ưu hóa từng giọt nhiên liệu sinh học.',
        'Mô-tơ điện MGU-K 350 kW phóng thêm gần 470 mã lực điện tức thì khi ra khỏi góc cua.',
        'Khung gầm carbon ôm sát khối máy giảm thiểu lực cản khí động.',
      ],
      highlightsEn: [
        'Turbulent Jet Ignition maximizing thermal efficiency with sustainable biofuel.',
        'MGU-K motor deploying nearly 470 instantaneous electric horsepower on corner exit.',
        'Tightly packaged carbon monocoque cell minimizing aerodynamic drag.',
      ],
      specs: [
        { labelVi: 'Dung tích', labelEn: 'Displacement', value: '1.6 L V6 Turbo Hybrid' },
        { labelVi: 'Tổng công suất', labelEn: 'Power Output', value: '1,020+ – 1,050+ HP' },
        { labelVi: 'Hiệu suất nhiệt', labelEn: 'Thermal Efficiency', value: '> 50%' },
        { labelVi: 'Đội đua', labelEn: 'Constructor', value: teamName },
      ],
    },
    halo: {
      titleVi: `Khung Bảo Vệ Titan Halo Cận Cảnh · ${teamName}`,
      titleEn: `${teamName} Titanium Halo Safety Cell Close-up`,
      partCode: `${teamId.toUpperCase()}-SAFE-HALO`,
      imageUrl: `/images/showroom/closeups/${teamId}_halo.webp`,
      conceptVi: `Cận cảnh khung bảo vệ buồng lái Halo bằng hợp kim Titan Grade 5 sơn phối màu sắc thương hiệu ${teamName}, chịu lực va đập tĩnh 12.3 tấn.`,
      conceptEn: `Close-up of the Grade 5 Titanium Halo cockpit protection structure finished in ${teamName} colors, rated to survive a 12.3-tonne static impact.`,
      highlightsVi: [
        'Khung titan cường lực cao gắn chặt vào thân xe Monocoque nguyên khối.',
        'Lớp vỏ carbon khí động học dẫn luồng khí mượt mà vào hộp lấy gió Airbox.',
        'Thời gian thoát hiểm khẩn cấp dưới 7 giây cho tay đua.',
      ],
      highlightsEn: [
        'High-tensile titanium loop rigidly anchored into the monocoque safety cell.',
        'Aero fairing guiding undisturbed airflow into the overhead engine airbox.',
        'Emergency driver egress validated in under 7 seconds.',
      ],
      specs: [
        { labelVi: 'Vật liệu', labelEn: 'Material', value: 'Grade 5 Titanium' },
        { labelVi: 'Khối lượng', labelEn: 'Weight', value: '7.0 kg' },
        { labelVi: 'Tải trọng kiểm định', labelEn: 'Impact Rating', value: '121 kN (12.3 Tấn)' },
        { labelVi: 'Màu hoàn thiện', labelEn: 'Finish', value: liveryNotes },
      ],
    },
    drs: {
      titleVi: `Cánh Gió Sau DRS Cận Cảnh · ${teamName}`,
      titleEn: `${teamName} Rear Wing DRS Mechanism Close-up`,
      partCode: `${teamId.toUpperCase()}-AERO-DRS`,
      imageUrl: `/images/showroom/closeups/${teamId}_drs.webp`,
      conceptVi: `Cận cảnh cánh gió đuôi xe ${teamName} với cơ cấu mở cánh lướt gió DRS điều khiển thủy lực giảm 30% lực cản khi vượt xe.`,
      conceptEn: `Close-up of the ${teamName} rear wing showing the hydraulic DRS actuator shedding 30% drag for high-speed overtaking maneuvers.`,
      highlightsVi: [
        'Độ mở cánh phụ tối đa 85 mm khi kích hoạt tại các đoạn thẳng DRS.',
        'Tự động đóng sập an toàn tức thì ngay khi tài xế chạm bàn đạp phanh.',
        'Kết hợp cánh Beam Wing kép khuếch đại lực hút từ sàn gầm.',
      ],
      highlightsEn: [
        '85mm slot gap clearance when activated through designated DRS straight zones.',
        'Automatic fail-safe closure the millisecond brake pedal pressure is detected.',
        'Integrated lower beam wing elements amplifying ground-effect floor suction.',
      ],
      specs: [
        { labelVi: 'Khe mở DRS', labelEn: 'Slot Gap', value: '85 mm' },
        { labelVi: 'Tốc độ tăng thêm', labelEn: 'Top Speed Gain', value: '+15 – 25 km/h' },
        { labelVi: 'Vật liệu', labelEn: 'Structure', value: 'Pre-preg Carbon Fiber' },
        { labelVi: 'Đội đua', labelEn: 'Team', value: teamName },
      ],
    },
    sidepods: {
      titleVi: `Hốc Gió Sườn & Tản Nhiệt Cận Cảnh · ${teamName}`,
      titleEn: `${teamName} Sidepod & Cooling Architecture Close-up`,
      partCode: `${teamId.toUpperCase()}-AERO-SP`,
      imageUrl: `/images/showroom/closeups/${teamId}_sidepods.webp`,
      conceptVi: `Cận cảnh hốc hút gió sườn và bề mặt uốn lượn khí động của ${carModel}. Định hình luồng khí ôm sát eo thân xe chảy thẳng xuống bộ khuếch tán sàn sau.`,
      conceptEn: `Close-up of the ${teamName} ${carModel} sidepod intakes and cooling louvers, accelerating high-pressure ambient air toward the rear diffuser.`,
      highlightsVi: [
        'Rãnh khoét gầm sâu Undercut gia tốc luồng khí áp suất cao dọc sườn xe.',
        'Cấu trúc chống va đập cạnh sườn SIS tiêu chuẩn FIA bảo vệ tay đua.',
        'Dàn tản nhiệt nước và khí nạp giải tỏa trên 140 kW nhiệt lượng động cơ.',
      ],
      highlightsEn: [
        'Sculpted undercut channels accelerating laminar flow toward the rear floor.',
        'FIA-mandated Side Impact Spars (SIS) absorbing lateral crash energy.',
        'High-capacity intercooler packaging dissipating over 140 kW of powertrain heat.',
      ],
      specs: [
        { labelVi: 'Kiến trúc khí động', labelEn: 'Aero Concept', value: 'Undercut Downwash' },
        { labelVi: 'Nhiệt lượng giải tỏa', labelEn: 'Cooling Capacity', value: '> 140 kW' },
        { labelVi: 'Vật liệu', labelEn: 'Composite', value: 'Carbon-Nomex' },
        { labelVi: 'Màu sắc', labelEn: 'Colorway', value: liveryNotes },
      ],
    },
    tires: {
      titleVi: `Lốp Pirelli 18-Inch & Phanh Đĩa Carbon · ${teamName}`,
      titleEn: `${teamName} 18-inch Pirelli Tires & Carbon Brakes Close-up`,
      partCode: `${teamId.toUpperCase()}-CHASSIS-BRK`,
      imageUrl: `/images/showroom/closeups/${teamId}_tires.webp`,
      conceptVi: `Cận cảnh mâm hợp kim ma-giê 18 inch và đĩa phanh carbon-carbon với hơn 1,000 lỗ thông gió giải nhiệt khi hãm tốc 5G.`,
      conceptEn: `Close-up of the 18-inch magnesium wheels and carbon-carbon brake discs with over 1,000 cooling holes absorbing brutal 5G deceleration.`,
      highlightsVi: [
        'Đĩa phanh carbon bốc đỏ rực ở nhiệt độ trên 1,000°C khi phanh từ 340 km/h.',
        'Mâm xe có ốp khí động học (Wheel Cover) giảm thiểu luồng gió xoáy vành bánh.',
        'Lốp Pirelli 18-inch thành mỏng phản hồi chính xác từng chuyển động vô lăng.',
      ],
      highlightsEn: [
        'Brake discs glowing red at 1,000°C under heavy braking from 340 km/h.',
        'Aerodynamic wheel covers minimizing chaotic rim turbulence.',
        'Low-profile 18-inch Pirelli rubber delivering instantaneous steering precision.',
      ],
      specs: [
        { labelVi: 'Đường kính mâm', labelEn: 'Wheel Size', value: '18 inches' },
        { labelVi: 'Vật liệu đĩa phanh', labelEn: 'Discs', value: 'Carbon-Carbon' },
        { labelVi: 'Lực hãm tối đa', labelEn: 'Peak Decel', value: '> 5.5 G' },
        { labelVi: 'Nhà cung cấp', labelEn: 'Supplier', value: 'Pirelli & Brembo' },
      ],
    },
  };
}

export const getTeamComponentCloseUp = (
  teamId: TeamId,
  hotspotId: string
): ComponentCloseUp => {
  const teamMap = TEAM_CLOSEUPS[teamId] || TEAM_CLOSEUPS.ferrari;
  if (hotspotId === 'floor') {
    // Tổng hợp từ entry sidepods: tái dùng ảnh sidepods theo đội, 0 ảnh/texture mới (giữ RAM phẳng).
    const base = teamMap.sidepods;
    const rawSuffix = base.titleVi.includes('·') ? base.titleVi.split('·').slice(1).join('·').trim() : teamId;
    const teamSuffix = rawSuffix.replace(/\s*Cận Cảnh\s*$/, '').trim() || rawSuffix;
    return {
      titleVi: `Sàn Venturi & Diffuser Cận Cảnh · ${teamSuffix}`,
      titleEn: `${teamId.toUpperCase()} Venturi Floor & Diffuser Close-up`,
      partCode: `${teamId.toUpperCase()}-FLOOR-DIFF`,
      imageUrl: base.imageUrl,
      conceptVi:
        'Cận cảnh hầm gió Venturi, tấm gỗ Jabroc 10mm tim gầm và cụm đèn mưa LED FIA ở đuôi xe — nguồn lực nén mặt đất lớn nhất cỗ máy F1 hiện đại.',
      conceptEn:
        'Close-up of the Venturi tunnels, 10mm Jabroc reference plank and FIA rain LED cluster at the tail — the largest ground-effect downforce source on a modern F1 car.',
      highlightsVi: [
        'Hai hầm gió Venturi tạo vùng áp suất thấp hút xe xuống mặt đường.',
        'Tấm gỗ Jabroc 10mm kiểm định độ cao gầm, mòn quá chuẩn sẽ bị loại.',
        'Đèn LED đỏ FIA kiêm báo xanh khi pin ERS đang thu hồi năng lượng.',
      ],
      highlightsEn: [
        'Twin Venturi tunnels generating low-pressure ground-effect suction.',
        '10mm Jabroc reference plank policing ride height; excess wear disqualifies the car.',
        'FIA red LED doubling as a green ERS harvesting indicator.',
      ],
      specs: [
        { labelVi: 'Nguồn lực nén', labelEn: 'Downforce Share', value: '~60% tổng lực nén' },
        { labelVi: 'Tấm tham chiếu', labelEn: 'Plank', value: 'Jabroc 10 mm' },
        { labelVi: 'Đèn đuôi', labelEn: 'Rear Light', value: 'FIA RL24 LED' },
        { labelVi: 'Khuếch đại', labelEn: 'Extraction', value: 'Beam Wing kép' },
      ],
    };
  }
  return teamMap[hotspotId] || teamMap.wings;
};
