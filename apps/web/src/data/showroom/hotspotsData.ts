export interface TechnicalSpec {
  labelVi: string;
  labelEn: string;
  value: string;
}

export interface HotspotItem {
  id: string;
  nameVi: string;
  nameEn: string;
  categoryVi: string;
  categoryEn: string;
  summaryVi: string;
  summaryEn: string;
  descriptionVi: string;
  descriptionEn: string;
  imageUrl: string;
  position: [number, number, number]; // 3D position of hotspot marker
  cameraPos: [number, number, number]; // Camera view position when focused
  cameraTarget: [number, number, number]; // Camera look-at target
  specs: TechnicalSpec[];
  highlightsVi: string[];
  highlightsEn: string[];
}

export const F1_HOTSPOTS: HotspotItem[] = [
  {
    id: 'wings',
    nameVi: 'Cánh Gió Trước & Khí Động Học',
    nameEn: 'Front Wing & Aerodynamics',
    categoryVi: 'Khí Động Học (Aero)',
    categoryEn: 'Aerodynamics',
    summaryVi: 'Tạo lực nén bánh trước, cân bằng lực nén và điều hướng luồng khí dưới sàn xe (Venturi).',
    summaryEn: 'Generates front downforce, balances car pitch, and guides clean airflow into the Venturi tunnels.',
    descriptionVi:
      'Cánh gió trước là bộ phận khí động học đầu tiên đón nhận luồng không khí va chạm với xe F1. Được chế tạo từ hơn 40 lớp sợi carbon siêu nhẹ, cánh gió không chỉ tạo ra hàng trăm kilogram lực nén ở tốc độ cao mà còn chia tách luồng khí: một phần đưa vào làm mát phanh và động cơ, phần còn lại tạo thành các luồng xoáy Y250 Vortex định hướng quanh lốp trước để triệt tiêu lực cản gió hỗn loạn.',
    descriptionEn:
      'The front wing is the primary aerodynamic surface encountering undisturbed air. Fabricated from over 40 plies of aerospace-grade carbon fiber, it generates critical front-axle downforce and channels high-energy vortices around the front wheel wake, sealing the ground-effect underfloor tunnels.',
    imageUrl: '/images/showroom/wings_drs.webp',
    position: [0, 0.28, -2.25],
    cameraPos: [1.2, 0.9, -3.2],
    cameraTarget: [0, 0.25, -2.2],
    specs: [
      { labelVi: 'Vật liệu chế tạo', labelEn: 'Construction', value: 'Carbon Fiber Pre-preg T1000' },
      { labelVi: 'Lực nén tối đa', labelEn: 'Peak Downforce', value: '~450 kg @ 250 km/h' },
      { labelVi: 'Chiều rộng tiêu chuẩn', labelEn: 'Regulation Width', value: '1900 mm (FIA 2026)' },
      { labelVi: 'Số tầng cánh (Flaps)', labelEn: 'Cascade Elements', value: '4 Adjustable Elements' },
    ],
    highlightsVi: [
      'Điều chỉnh góc mở (Angle of Attack) từng chặng đua để tối ưu hóa giữa tốc độ thẳng và ôm cua.',
      'Endplates tích hợp hốc dẫn khí Outwash hạn chế luồng nhiễu động từ bánh xe trước.',
      'Tạo lực ép trực tiếp lên trục bánh trước giúp triệt tiêu hiện tượng thiếu lái (Understeer).',
    ],
    highlightsEn: [
      'Tunable angle of attack at each race weekend for ideal top speed vs downforce ratio.',
      'Outwash endplate geometry pushing turbulent tire wake away from floor edges.',
      'Provides high front-end authority, combating understeer in high-speed apexes.',
    ],
  },
  {
    id: 'drs',
    nameVi: 'Cánh Gió Sau & Hệ Thống DRS',
    nameEn: 'Rear Wing & DRS Flap',
    categoryVi: 'Khí Động Học & Tốc Độ',
    categoryEn: 'Aero & Overtaking',
    summaryVi: 'Hệ thống giảm lực cản DRS mở góc cánh gió sau, tăng thêm 15–25 km/h khi vượt xe.',
    summaryEn: 'Drag Reduction System hydraulic actuator opens the upper rear flap to gain 15-25 km/h.',
    descriptionVi:
      'Hệ thống DRS (Drag Reduction System) được điều khiển thủy lực với tốc độ phản hồi tính bằng mili-giây. Khi tay đua nằm trong khoảng cách dưới 1 giây sau xe phía trước tại vùng DRS Detection Point, đèn báo trên vô lăng sẽ sáng. Kích hoạt DRS làm nâng cánh phụ phía sau lên tối đa 85 mm, giảm 30% lực cản khí động của toàn xe và mang lại lợi thế vượt trội trên các đoạn thẳng dài.',
    descriptionEn:
      'The Drag Reduction System utilizes an ultra-fast hydraulic actuator to pivot the upper rear wing flap open by up to 85 mm. When trailing within 1 second through FIA designated zones, DRS sheds 30% of total aerodynamic drag, unleashing up to 25 km/h top-speed advantage.',
    imageUrl: '/images/showroom/wings_drs.webp',
    position: [0, 0.95, 2.15],
    cameraPos: [-1.4, 1.4, 3.1],
    cameraTarget: [0, 0.85, 2.1],
    specs: [
      { labelVi: 'Độ mở cánh gió (Slot Gap)', labelEn: 'Flap Opening Gap', value: '85 mm (Max FIA)' },
      { labelVi: 'Tốc độ tăng thêm', labelEn: 'Top Speed Delta', value: '+15 to +25 km/h' },
      { labelVi: 'Thời gian kích hoạt', labelEn: 'Actuation Response', value: '< 250 milliseconds' },
      { labelVi: 'Cơ cấu điều khiển', labelEn: 'Actuator Mechanism', value: 'High-pressure Hydraulic' },
    ],
    highlightsVi: [
      'Tự động đóng lại ngay lập tức khi tay đua chạm nhẹ vào bàn đạp phanh.',
      'Kết hợp với Beam Wing kép phía dưới để tạo lực hút khổng lồ từ bộ khuếch tán sàn xe (Diffuser).',
      'Đèn LED mưa (Rain Light) an toàn FIA tích hợp ngay tâm đuôi xe với khả năng cảnh báo sạc năng lượng ERS.',
    ],
    highlightsEn: [
      'Instantly snaps shut the moment the driver initiates braking pressure.',
      'Works in synergy with lower beam wings to extract massive underfloor diffuser suction.',
      'Integrated FIA rain/energy recovery LED light at the rear impact structure.',
    ],
  },
  {
    id: 'power_unit',
    nameVi: 'Bộ Động Cơ Hybrid V6 Turbo 1.6L',
    nameEn: 'V6 Turbo Hybrid Power Unit',
    categoryVi: 'Hệ Thống Động Lực (Powertrain)',
    categoryEn: 'Powertrain & ERS',
    summaryVi: 'Cỗ máy 1000+ mã lực kết hợp động cơ đốt trong V6 Turbo và hệ thống hồi lưu điện năng MGU-K.',
    summaryEn: '1000+ HP hybrid marvel pairing a 1.6L Turbo V6 with an MGU-K regenerative electric motor.',
    descriptionVi:
      'Power Unit hiện đại của F1 là đỉnh cao hiệu suất nhiệt trên thế giới (vượt ngưỡng 50%). Bao gồm 5 thành phần chính theo luật 2026 (đã bỏ MGU-H): Động cơ đốt trong (ICE) 1.6L vòng tua 15,000 RPM, Bộ tăng áp đơn Turbocharger, Mô-tơ điện thu hồi động năng MGU-K 350 kW (470 HP), Bộ pin lưu trữ năng lượng (Energy Store), và Hộp điều khiển điện tử (Control Electronics).',
    descriptionEn:
      'The modern Formula 1 Power Unit achieves world-record thermal efficiency beyond 50%. Under 2026 regulations (MGU-H removed) it comprises five integrated elements: 1.6L Internal Combustion Engine (15,000 RPM), Turbocharger, 350 kW MGU-K kinetic recuperation motor, upgraded Energy Store battery, and Control Electronics.',
    imageUrl: '/images/showroom/power_unit.webp',
    position: [0.95, 0.6, 0.65],
    cameraPos: [1.8, 1.3, 0.5],
    cameraTarget: [0, 0.48, 0.65],
    specs: [
      { labelVi: 'Dung tích & cấu hình', labelEn: 'Displacement', value: '1.6 L, 90° V6 Single Turbo' },
      { labelVi: 'Tổng công suất', labelEn: 'Combined Output', value: '1,050+ Horsepower (BHP)' },
      { labelVi: 'Vòng tua tối đa', labelEn: 'RPM Limit', value: '15,000 RPM' },
      { labelVi: 'Năng lượng pin ERS', labelEn: 'Battery Deployment', value: '8.5 MJ per lap (MGU-K, 2026)' },
      { labelVi: 'Hiệu suất nhiệt', labelEn: 'Thermal Efficiency', value: '> 52% (Cao nhất thế giới)' },
    ],
    highlightsVi: [
      'Công nghệ đánh lửa tia nén buồng đốt phụ (Pre-Chamber Ignition TJI) đốt cháy kiệt nhiên liệu.',
      'Thu hồi điện năng khi phanh lên tới 8.5 MJ mỗi vòng, mô-tơ MGU-K 350 kW phóng gần 470 mã lực điện hỗ trợ tức thì.',
      'Sử dụng nhiên liệu sinh học 100% bền vững hướng đến tương lai xanh Net Zero.',
    ],
    highlightsEn: [
      'Turbulent Jet Ignition (TJI) pre-chamber system maximizing fuel combustion completeness.',
      'Harvests up to 8.5 MJ per lap under braking, 350 kW MGU-K deploying nearly 470 electric BHP on corner exit.',
      'Transitioning to 100% advanced sustainable drop-in biofuel.',
    ],
  },
  {
    id: 'halo',
    nameVi: 'Khung Bảo Vệ Buồng Lái Halo',
    nameEn: 'Titanium Halo Cockpit Protection',
    categoryVi: 'An Toàn Tay Đua (Safety)',
    categoryEn: 'Driver Safety System',
    summaryVi: 'Khung vòng Titan Grade 5 chịu lực va chạm 12.3 tấn, bảo vệ vùng đầu tay đua tuyệt đối.',
    summaryEn: 'Grade 5 Titanium loop rated to withstand 12.3 tonnes of impact force protecting the driver.',
    descriptionVi:
      'Được giới thiệu từ năm 2018 bởi FIA, hệ thống Halo đã cứu sống nhiều tay đua trong các vụ tai nạn kinh hoàng (như Romain Grosjean tại Bahrain 2020 hay Guanyu Zhou tại Silverstone 2022). Khung Halo chỉ nặng 7 kg nhưng có thể chịu được lực ép thẳng đứng 121 kN (tương đương 12 tấn, gấp 2 lần xe buýt 2 tầng Luân Đôn). Lớp vỏ carbon bên ngoài được vát khí động học với các rãnh chia gió vi mô.',
    descriptionEn:
      'Mandated by the FIA in 2018, the Halo has proven life-saving in multiple severe impacts. Fabricated from high-tensile Grade 5 Titanium, the structure weighs just 7 kg yet survives a 121 kN (12.3 tonne) static load. Teams wrap the bare titanium in custom aerodynamic carbon fairings with micro vortex-generators.',
    imageUrl: '/images/showroom/halo_safety.webp',
    position: [0, 0.82, -0.35],
    cameraPos: [0.9, 1.25, -1.2],
    cameraTarget: [0, 0.65, -0.35],
    specs: [
      { labelVi: 'Vật liệu chính', labelEn: 'Primary Material', value: 'Grade 5 Titanium (Ti6Al4V)' },
      { labelVi: 'Trọng lượng khung', labelEn: 'Weight', value: '7.0 kg (Unfaired)' },
      { labelVi: 'Tải trọng kiểm định', labelEn: 'Static Test Load', value: '121 kN (12.3 Tonnes)' },
      { labelVi: 'Góc nhìn tay đua', labelEn: 'Driver Visibility', value: 'Vùng khuất < 0.25 giây não bộ bù trừ' },
    ],
    highlightsVi: [
      'Gắn kết trực tiếp vào khung nguyên khối Monocoque Carbon bằng bu lông cường lực cao.',
      'Lớp vỏ khí động học bọc ngoài giúp luồng khí vào hộp gió Airbox trên đỉnh xe không bị xoáy.',
      'Thiết kế chữ Y ngược giúp tay đua có thể thoát hiểm khẩn cấp trong vòng dưới 7 giây.',
    ],
    highlightsEn: [
      'Rigidly bolted into the structural carbon monocoque safety cell.',
      'Custom aero fairing channels clean, undisturbed laminar air directly into the engine airbox.',
      'Allows driver emergency egress in under seven seconds.',
    ],
  },
  {
    id: 'sidepods',
    nameVi: 'Hốc Gió Thân Xe & Hệ Tản Nhiệt',
    nameEn: 'Sidepods & Cooling Undercut',
    categoryVi: 'Khí Động Học & Tản Nhiệt',
    categoryEn: 'Aero & Thermal',
    summaryVi: 'Hốc hút khí làm mát bộ tản nhiệt và tạo đường lượn Undercut dẫn luồng khí về sàn xe.',
    summaryEn: 'Intakes cooling air for radiators while deep undercuts guide high-velocity air toward the floor.',
    descriptionVi:
      'Hốc gió Sidepods đóng vai trò kép: vừa giải nhiệt cho khối động cơ hơn 1000 mã lực thông qua dàn tản nhiệt nước và khí nạp (Intercoolers), vừa định hình khí động học quan trọng nhất thân xe. Thiết kế hớt gầm sâu (Extreme Undercut) và bề mặt dốc phía trên (Downwash Ramp) ép luồng không khí áp suất cao đi dọc theo eo thân xe chảy thẳng xuống bề mặt khuếch tán sàn sau.',
    descriptionEn:
      'Sidepods fulfill a vital dual role: thermal management for the 1000+ HP powertrain via radiator intercoolers, and macro airflow conditioning. Aggressive undercut channels accelerate high-pressure ambient air along the waistline, feeding downwash currents directly to the rear diffuser.',
    imageUrl: '/images/showroom/sidepods_cooling.webp',
    position: [0.85, 0.38, 0.05],
    cameraPos: [2.5, 1.2, -0.2],
    cameraTarget: [0.4, 0.35, 0.05],
    specs: [
      { labelVi: 'Kiến trúc khí động', labelEn: 'Aero Philosophy', value: 'Deep Undercut Downwash' },
      { labelVi: 'Nhiệt độ giải tỏa', labelEn: 'Heat Dissipation', value: '> 140 kW nhiệt lượng thải' },
      { labelVi: 'Thân vỏ', labelEn: 'Bodywork Shell', value: 'Ultra-thin Carbon-Nomex Honeycomb' },
      { labelVi: 'Hệ thống an toàn', labelEn: 'Crash Structure', value: 'FIA Side Impact Spars (SIS)' },
    ],
    highlightsVi: [
      'Cấu trúc chống va đập cạnh sườn SIS bảo vệ tay đua khỏi các cú đâm ngang góc.',
      'Các khe mang cá Louvers mở rộng linh hoạt tùy theo nhiệt độ ngoài trời (như Bahrain hay Singapore).',
      'Định hình luồng xoáy ngăn không cho nhiễu động bánh trước tràn vào gầm xe.',
    ],
    highlightsEn: [
      'Houses FIA-mandated Side Impact Spars (SIS) absorbing lateral crash energy.',
      'Interchangeable cooling louvers adapted per circuit ambient temperature.',
      'Acts as an aerodynamic barrier sealing floor edges from tire turbulence.',
    ],
  },
  {
    id: 'tires',
    nameVi: 'Lốp Pirelli 18-inch & Phanh Đĩa Carbon',
    nameEn: 'Pirelli 18-inch Tires & Carbon Brakes',
    categoryVi: 'Độ Bám Đường & Phanh',
    categoryEn: 'Grip & Deceleration',
    summaryVi: 'Lốp rãnh thấp 18-inch kết hợp đĩa phanh carbon Brembo phát sáng trên 1,000°C khi hãm phanh 5G.',
    summaryEn: 'Low-profile 18-inch Pirelli rubber paired with carbon brake discs glowing at 1,000°C under 5G.',
    descriptionVi:
      'Lốp Pirelli 18-inch với thành lốp thấp giúp xe F1 phản hồi lái cực nhạy và giảm hiện tượng nhún không kiểm soát. Ẩn phía sau mâm hợp kim ma-giê BBS là hệ thống phanh carbon-carbon Brembo với hơn 1,000 lỗ thông gió li ti. Khi phanh từ 340 km/h xuống 80 km/h chỉ trong 100 mét, đĩa phanh sản sinh lực hãm trên 5G và bốc cháy đỏ rực ở nhiệt độ trên 1,000°C.',
    descriptionEn:
      'Pirelli 18-inch low-profile tires deliver immediate steering response and rigid lateral compliance. Behind the forged magnesium wheels reside Brembo carbon-carbon brake discs drilled with over 1,000 cooling holes, generating brutal 5G deceleration from 340 km/h while glowing white-hot above 1,000°C.',
    imageUrl: '/images/showroom/pirelli_tires.webp',
    position: [0.96, 0.35, -1.45],
    cameraPos: [1.9, 0.65, -1.8],
    cameraTarget: [0.85, 0.35, -1.45],
    specs: [
      { labelVi: 'Đường kính mâm', labelEn: 'Wheel Diameter', value: '18 inches (Magnesium Forged)' },
      { labelVi: 'Hợp chất lốp khô', labelEn: 'Slick Compounds', value: 'C1 to C5 (Hard / Medium / Soft)' },
      { labelVi: 'Nhiệt độ hoạt động', labelEn: 'Operating Window', value: '100°C – 130°C' },
      { labelVi: 'Nhiệt độ đĩa phanh', labelEn: 'Brake Disc Temp', value: 'Up to 1,050°C (Glowing Red)' },
      { labelVi: 'Lực hãm tối đa', labelEn: 'Peak Deceleration', value: '> 5.5 G Lực trọng trường' },
    ],
    highlightsVi: [
      'Đĩa phanh được khoan hơn 1,000 lỗ thông gió vi mô để giải nhiệt tức thời.',
      'Mâm xe có ốp khí động học (Wheel Covers) giảm thiểu luồng gió xoáy quanh vành bánh xe.',
      'Chiến thuật thay lốp Undercut/Overcut quyết định phần lớn thắng bại trong mỗi chặng đua.',
    ],
    highlightsEn: [
      'Discs feature over 1,000 precision ventilation holes for rapid thermal relief.',
      'Mandatory aerodynamic wheel rim covers reducing chaotic wheel rim vortices.',
      'Tire degradation curves form the core cornerstone of Grand Prix pit-stop strategy.',
    ],
  },
  {
    id: 'floor',
    nameVi: 'Sàn Venturi & Bộ Khuếch Tán',
    nameEn: 'Venturi Floor & Diffuser',
    categoryVi: 'Hiệu Ứng Mặt Đất (Ground Effect)',
    categoryEn: 'Ground Effect',
    summaryVi: 'Hầm gió Venturi dưới gầm tạo ~60% lực nén, tấm gỗ Jabroc 10mm và đèn mưa FIA ở đuôi xe.',
    summaryEn: 'Venturi tunnels generate ~60% of total downforce, with the 10mm Jabroc plank and FIA rain light at the tail.',
    descriptionVi:
      'Sàn xe hiệu ứng mặt đất là nguồn lực nén lớn nhất của F1 hiện đại. Hai hầm gió Venturi tăng tốc luồng khí dưới gầm, tạo vùng áp suất thấp hút xe xuống mặt đường. Tim gầm là tấm gỗ Jabroc dày 10mm kiểm định độ cao gầm xe, hai bên là các cánh chia gió Strake, phía trên là cánh dầm Beam Wing khuếch đại lực hút của bộ khuếch tán Diffuser. Cụm đèn LED đỏ FIA ở đuôi vừa báo mưa vừa nhấp nháy xanh khi thu hồi năng lượng ERS.',
    descriptionEn:
      'The ground-effect floor is the largest downforce source on a modern F1 car. Twin Venturi tunnels accelerate underbody airflow, creating low-pressure suction. A 10mm Jabroc reference plank controls ride height, flanked by diffuser strakes, with the beam wing above amplifying extraction. The FIA LED rain light doubles as a green ERS harvesting indicator.',
    imageUrl: '/images/showroom/sidepods_cooling.webp',
    position: [0, 0.25, 1.2],
    cameraPos: [0, 1.0, 3.4],
    cameraTarget: [0, 0.3, 1.1],
    specs: [
      { labelVi: 'Nguồn lực nén', labelEn: 'Downforce Share', value: '~60% tổng lực nén xe' },
      { labelVi: 'Tấm tham chiếu gầm', labelEn: 'Reference Plank', value: 'Jabroc 10 mm (FIA)' },
      { labelVi: 'Đèn an toàn đuôi', labelEn: 'Rear Light', value: 'FIA RL24 LED (Đỏ/Xanh ERS)' },
      { labelVi: 'Cánh khuếch đại', labelEn: 'Extraction Wing', value: 'Beam Wing kép' },
    ],
    highlightsVi: [
      'Tấm gỗ Jabroc mòn quá 1mm sau chặng đua sẽ khiến xe bị loại khỏi kết quả.',
      'Các cánh Strake dọc chia luồng khuếch tán, chân gắn guốc titan chống mài mòn.',
      'Đèn mưa LED đỏ rực khi trời mưa, nhấp nháy xanh khi pin ERS đang sạc.',
    ],
    highlightsEn: [
      'Excessive Jabroc plank wear beyond 1mm means disqualification after the race.',
      'Longitudinal diffuser strakes with titanium skid shoes preventing wear damage.',
      'Ruby rain LED glowing red in wet conditions, flashing green while the ERS battery charges.',
    ],
  },
];
