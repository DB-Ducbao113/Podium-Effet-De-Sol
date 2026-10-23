import type { HotspotItem } from './hotspotsData';

type EDSOverride = HotspotItem;

const sharedSpecs = [
  { labelVi: 'Nguồn thiết kế', labelEn: 'Design source', value: 'EDS-G01 procedural master' },
  { labelVi: 'Trạng thái', labelEn: 'Status', value: 'M2 engineering prototype' },
];

const profiles: Record<string, EDSOverride> = {
  wings: {
    id: 'wings',
    nameVi: 'Cánh trước bốn tầng', nameEn: 'Four-plane Front Wing',
    categoryVi: 'Khí động học', categoryEn: 'Aerodynamics',
    summaryVi: 'Bốn tầng cánh dạng quét dẫn luồng khí sạch vào hai vai sàn Venturi.',
    summaryEn: 'Four swept elements condition clean airflow for the twin Venturi shoulders.',
    descriptionVi: 'Cụm cánh trước EDS-G01 dùng biên dạng quét riêng, hai endplate vát và mũi chẻ đôi. Hình học được tạo hoàn toàn bằng generator của dự án.',
    descriptionEn: 'The EDS-G01 front assembly combines four original swept planes, chamfered endplates and a split-keel nose. Its geometry is generated entirely by the project source.',
    imageUrl: '/images/showroom/eds-g01/wings.svg', position: [0, 0.27, -2.38], cameraPos: [1.25, 0.82, -3.25], cameraTarget: [0, 0.25, -2.25],
    specs: [...sharedSpecs, { labelVi: 'Số tầng', labelEn: 'Elements', value: '4 swept planes' }, { labelVi: 'Bề rộng', labelEn: 'Width', value: '1.92 m' }],
    highlightsVi: ['Endplate vát giảm nhiễu bánh trước.', 'Mũi chẻ đôi là dấu hiệu hình học riêng EDS.', 'Kết cấu tham số cho phép tái tạo chính xác.'],
    highlightsEn: ['Chamfered endplates manage front-wheel wake.', 'Split keel establishes an EDS-specific signature.', 'Parametric construction is exactly reproducible.'],
  },
  drs: {
    id: 'drs',
    nameVi: 'Cánh sau & cánh chủ động', nameEn: 'Rear Wing & Active Flap', categoryVi: 'Khí động học', categoryEn: 'Aerodynamics',
    summaryVi: 'Cánh sau hai tầng đặt trên cầu đỡ tam giác và bộ khuếch tán bậc.', summaryEn: 'A two-plane rear wing supported by an original triangular bridge above the stepped diffuser.',
    descriptionVi: 'Cụm cánh sau dùng hai mặt cánh thuôn, endplate độc lập và cầu đỡ chữ V. Đây là nguyên mẫu kỹ thuật, không mô phỏng cơ cấu của đội đua cụ thể.',
    descriptionEn: 'The rear assembly uses two tapered planes, independent endplates and a V-shaped support bridge. It is an engineering prototype, not a replica of a constructor mechanism.',
    imageUrl: '/images/showroom/eds-g01/drs.svg', position: [0, 0.96, 2.16], cameraPos: [-1.35, 1.35, 3.15], cameraTarget: [0, 0.84, 2.12],
    specs: [...sharedSpecs, { labelVi: 'Mặt cánh', labelEn: 'Planes', value: '2 tapered surfaces' }, { labelVi: 'Kiểu đỡ', labelEn: 'Support', value: 'Twin V bridge' }],
    highlightsVi: ['Cầu đỡ tam giác tạo nhận diện riêng.', 'Cánh chủ động tách thành assembly riêng.', 'Liên kết trực tiếp với vùng khuếch tán.'],
    highlightsEn: ['Triangular bridge creates a distinct identity.', 'Active flap remains a discrete assembly.', 'Geometry visually links to diffuser extraction.'],
  },
  power_unit: {
    id: 'power_unit',
    nameVi: 'Mô-đun năng lượng hybrid', nameEn: 'Hybrid Energy Module', categoryVi: 'Hệ truyền động', categoryEn: 'Powertrain',
    summaryVi: 'Khoang năng lượng khép kín dưới sống lưng khí động học của EDS-G01.', summaryEn: 'A compact conceptual energy module packaged beneath the EDS-G01 aerodynamic spine.',
    descriptionVi: 'Showroom mô tả kiến trúc hybrid ở mức khái niệm; không tuyên bố sao chép hoặc đại diện cho bộ nguồn của nhà sản xuất hiện hữu.',
    descriptionEn: 'The showroom presents a conceptual hybrid architecture and does not claim to reproduce or represent any existing manufacturer power unit.',
    imageUrl: '/images/showroom/eds-g01/power_unit.svg', position: [0.42, 0.68, 0.78], cameraPos: [1.85, 1.25, 0.72], cameraTarget: [0, 0.55, 0.72],
    specs: [...sharedSpecs, { labelVi: 'Kiến trúc', labelEn: 'Architecture', value: 'Concept hybrid module' }, { labelVi: 'Đóng gói', labelEn: 'Packaging', value: 'Central spine enclosure' }],
    highlightsVi: ['Mô-đun khái niệm trung tính thương hiệu.', 'Thân sau thuôn dần về diffuser.', 'Thông số công suất chưa được công bố.'],
    highlightsEn: ['Brand-neutral conceptual module.', 'Rear body tapers toward the diffuser.', 'No unverified output figures are claimed.'],
  },
  halo: {
    id: 'halo',
    nameVi: 'Khung bảo vệ buồng lái', nameEn: 'Cockpit Safety Structure', categoryVi: 'An toàn', categoryEn: 'Safety',
    summaryVi: 'Vòng bảo vệ quét ngược bao quanh cửa cockpit lục giác.', summaryEn: 'A swept protective loop surrounding the hexagonal cockpit opening.',
    descriptionVi: 'Khung an toàn EDS-G01 có vòng cong bất đối xứng theo trục dọc, trụ giữa và hai chân neo độc lập.',
    descriptionEn: 'The EDS-G01 safety structure uses a swept loop, central blade and two independent rear anchors.',
    imageUrl: '/images/showroom/eds-g01/halo.svg', position: [0, 0.94, -0.2], cameraPos: [1.05, 1.3, -1.15], cameraTarget: [0, 0.76, -0.22],
    specs: [...sharedSpecs, { labelVi: 'Kết cấu', labelEn: 'Structure', value: 'Swept loop + central blade' }, { labelVi: 'Điểm neo', labelEn: 'Anchors', value: '3-point layout' }],
    highlightsVi: ['Vòng quét tạo silhouette riêng.', 'Ba điểm neo hiển thị rõ khi soi chi tiết.', 'Không mang nhãn hiệu nhà sản xuất.'],
    highlightsEn: ['Swept loop creates a distinct silhouette.', 'Three anchors remain visible in detail view.', 'No manufacturer branding is present.'],
  },
  sidepods: {
    id: 'sidepods',
    nameVi: 'Sidepod giọt nước', nameEn: 'Teardrop Sidepods', categoryVi: 'Khí động & làm mát', categoryEn: 'Aero & Cooling',
    summaryVi: 'Hai sidepod thuôn giọt nước với môi hút khí cyan và bốn khe thoát nhiệt.', summaryEn: 'Twin teardrop sidepods with cyan intake lips and four cooling outlets.',
    descriptionVi: 'Sidepod dùng mặt cắt loft riêng, co nhanh về phía sau để lộ vai sàn delta và đường khí tới diffuser.',
    descriptionEn: 'Original lofted sections contract rapidly toward the rear, exposing the delta-floor shoulders and diffuser feed path.',
    imageUrl: '/images/showroom/eds-g01/sidepods.svg', position: [0.66, 0.5, 0.02], cameraPos: [2.45, 1.05, -0.1], cameraTarget: [0.45, 0.43, 0.1],
    specs: [...sharedSpecs, { labelVi: 'Mặt cắt', labelEn: 'Section', value: 'Parametric teardrop loft' }, { labelVi: 'Khe thoát', labelEn: 'Outlets', value: '4 per side' }],
    highlightsVi: ['Môi hút khí màu nhấn tách biệt.', 'Undercut mở đường nhìn xuống sàn.', 'Loft tham số không truy vết mesh legacy.'],
    highlightsEn: ['Accent intake lips remain visually distinct.', 'Undercut exposes the floor shoulder.', 'Parametric loft does not trace the legacy mesh.'],
  },
  tires: {
    id: 'tires',
    nameVi: 'Bánh trơn không thương hiệu', nameEn: 'Unbranded Slick Wheel', categoryVi: 'Khung gầm', categoryEn: 'Chassis',
    summaryVi: 'Bốn lốp trơn, mâm khí động học nguyên bản và đĩa phanh carbon mô phỏng.', summaryEn: 'Four unbranded slicks with original aero rims and conceptual carbon brake discs.',
    descriptionVi: 'Bánh xe EDS không dùng chữ, vòng màu hoặc kiểu nan nhận diện của nhà cung cấp bên thứ ba.',
    descriptionEn: 'EDS wheels avoid lettering, compound rings and recognizable third-party spoke designs.',
    imageUrl: '/images/showroom/eds-g01/tires.svg', position: [0.91, 0.39, -1.75], cameraPos: [1.85, 0.68, -2.0], cameraTarget: [0.86, 0.36, -1.75],
    specs: [...sharedSpecs, { labelVi: 'Bố trí', labelEn: 'Layout', value: 'Open-wheel slick' }, { labelVi: 'Thương hiệu', labelEn: 'Branding', value: 'None' }],
    highlightsVi: ['Lốp hoàn toàn không chữ.', 'Mâm tròn tối giản do EDS thiết kế.', 'Phanh là mô hình trực quan khái niệm.'],
    highlightsEn: ['Tires carry no lettering.', 'Minimal circular rims are EDS-authored.', 'Brake hardware is a conceptual visualization.'],
  },
  floor: {
    id: 'floor',
    nameVi: 'Sàn Venturi & diffuser', nameEn: 'Venturi Floor & Diffuser', categoryVi: 'Hiệu ứng mặt đất', categoryEn: 'Ground Effect',
    summaryVi: 'Sàn delta, bốn fence và diffuser năm strake tạo silhouette đáy xe riêng.', summaryEn: 'A delta floor, four fences and five-strake diffuser establish a distinct underside silhouette.',
    descriptionVi: 'Sàn EDS-G01 mở rộng ở vai, thu tại mũi và kết thúc bằng bộ khuếch tán bậc năm strake.',
    descriptionEn: 'The EDS-G01 floor broadens at the shoulders, narrows at the nose and terminates in a stepped five-strake diffuser.',
    imageUrl: '/images/showroom/eds-g01/floor.svg', position: [0, 0.22, 1.45], cameraPos: [0.15, 0.72, 3.35], cameraTarget: [0, 0.17, 1.35],
    specs: [...sharedSpecs, { labelVi: 'Fence sàn', labelEn: 'Floor fences', value: '4 longitudinal' }, { labelVi: 'Strake', labelEn: 'Diffuser strakes', value: '5 stepped' }],
    highlightsVi: ['Planform delta dễ nhận diện từ trên.', 'Bốn fence chạy dọc hai tunnel.', 'Diffuser năm strake tách biệt ở đuôi.'],
    highlightsEn: ['Delta planform is clear from above.', 'Four fences define twin tunnels.', 'Five diffuser strakes remain distinct at the tail.'],
  },
};

export const EDS_HOTSPOTS: HotspotItem[] = Object.values(profiles);
