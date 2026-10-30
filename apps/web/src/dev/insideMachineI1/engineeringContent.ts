import type { Lang } from './types';

export interface EngineeringSource {
  id:string;
  title:string;
  publisher:string;
  url:string;
  publishedAt:string|null;
  verifiedAt:string;
  supportedClaims:string[];
  verificationStatus:'verified'|'pending'|'rejected';
}

export interface EngineeringNarration {
  id:string;
  semanticComponentIds:string[];
  title:Record<Lang,string>;
  summary:Record<Lang,string>;
  detail:Record<Lang,string>;
  function:Record<Lang,string>;
  sourceIds:string[];
  geometryProvenance:'source-derived'|'newly-authored-illustrative'|'mixed-source-and-illustrative';
  provenanceLabel:Record<Lang,string>;
  sourceVerificationStatus:'verified'|'pending'|'rejected';
  reviewerApprovalStatus:'pending-owner'|'approved'|'rejected';
}

export const ENGINEERING_SOURCES:EngineeringSource[]=[
  {
    id:'fia-2022-technical-regulations-i13',
    title:'2022 Formula 1 Technical Regulations — Issue 13',
    publisher:'Fédération Internationale de l’Automobile',
    url:'https://api.fia.com/sites/default/files/fia_2022_formula_1_technical_regulations_-_issue_13_-_2022-08-16.pdf',
    publishedAt:'2022-08-16',
    verifiedAt:'2026-10-29',
    supportedClaims:[
      'Article 3.9 defines the 2022 front-wing profiles, endplate, tip and completed front-wing assembly.',
      'Article 3.7.1 defines the regulated sidepod bodywork region and continuity constraints.',
      'Article 3.7.6 permits defined apertures for cooling-flow exits.',
      'Article 7 covers oil and coolant systems, coolant lines and heat exchangers.',
      'Article 10 defines the complete wheel, wheel rim, outboard suspension, wheel attachment and retention.',
      'Article 11 separately regulates brake calipers, brake discs and pads.',
      'Articles 5 and 9 regulate power-unit and transmission systems.',
    ],
    verificationStatus:'verified',
  },
  {
    id:'f1-2022-front-wing-cleaner-wake',
    title:'How the front wing on the all-new 2022 cars has been designed to improve overtaking',
    publisher:'Formula 1',
    url:'https://www.formula1.com/en/latest/article/tech-tuesday-why-the-front-wing-will-be-a-key-technical-battleground-on-the.3Ep4LEu5mTMRkXrClOQtRg.3Ep4LEu5mTMRkXrClOQtRg',
    publishedAt:'2022-01-18',
    verifiedAt:'2026-10-29',
    supportedClaims:[
      'The 2022 front-wing concept was intended to produce a cleaner, less disruptive wake.',
      'Simplified endplates and regulated element junctions reduce opportunities to generate strong outwash structures.',
      'The front wing remains a major contributor to aerodynamic load and downstream airflow condition.',
    ],
    verificationStatus:'verified',
  },
  {
    id:'f1-2022-sidepod-radiator-layout',
    title:'Why have the F1 teams taken such unique design routes — and what are the big differences?',
    publisher:'Formula 1',
    url:'https://www.formula1.com/en/latest/article/why-have-the-f1-teams-taken-such-unique-design-routes-and-what-are-the-big.7rTu6ggQjukx0zHqsQC8fa',
    publishedAt:'2022-02-18',
    verifiedAt:'2026-10-29',
    supportedClaims:[
      'A 2022 car example places radiator hardware beneath extensively vented sidepod bodywork.',
      'Cooling-exit treatment and radiator inlet size interact with aerodynamic packaging.',
      'Different teams adopted visibly different sidepod and cooling-exit solutions within the same ruleset.',
    ],
    verificationStatus:'verified',
  },
  {
    id:'f1-2022-rb18-cooling-channel',
    title:"Analysing Red Bull's radical updates for the British Grand Prix",
    publisher:'Formula 1',
    url:'https://www.formula1.com/en/latest/article/tech-tuesday-analysing-red-bulls-radical-updates-for-the-british-grand-prix.5ckhGbnSYgYeoVDi98Jabl.5ckhGbnSYgYeoVDi98Jabl',
    publishedAt:'2022-07-05',
    verifiedAt:'2026-10-29',
    supportedClaims:[
      'Cooling-channel volume from radiators to the rear outlet affects cooling capacity.',
      'External sidepod and engine-cover surfaces can simultaneously package cooling flow and condition external airflow.',
    ],
    verificationStatus:'verified',
  },
];

export const ENGINEERING_NARRATIONS:EngineeringNarration[]=[
  {
    id:'front-left-wheel-relationships',
    semanticComponentIds:['FRONT_LEFT_WHEEL','FRONT_LEFT_WHEEL.CENTER_LOCK_NUT','FRONT_LEFT_WHEEL.WHEEL_OUTER','FRONT_LEFT_WHEEL.WHEEL_HUB','FRONT_LEFT_WHEEL.BRAKE_DISC','FRONT_LEFT_WHEEL.BRAKE_CALIPER','FRONT_LEFT_WHEEL.SUSPENSION_LINKS','FRONT_LEFT_WHEEL.HUB_MOUNT_INTERFACE'],
    title:{en:'Wheel assembly · load, rotation and braking meet',vi:'Cụm bánh xe · nơi tải trọng, chuyển động quay và phanh gặp nhau'},
    summary:{en:'The tyre and rim form the rotating outer assembly; the center lock retains it, while the hub, brake disc, caliper and suspension links connect rotation, braking and chassis load paths.',vi:'Lốp và vành tạo thành cụm quay bên ngoài; khóa tâm giữ cụm bánh, còn moay-ơ, đĩa phanh, cùm phanh và các thanh treo liên kết chuyển động quay, lực phanh và đường truyền tải về khung xe.'},
    detail:{en:'The 2022 FIA rules define a complete wheel and distinguish the rim, wheel attachment, outboard suspension, brake caliper and brake disc. This scene uses those regulated relationships to explain the semantic Model B assembly. Its hub, brake and suspension internals are authored engineering illustrations, not manufacturer dimensions or hidden CAD.',vi:'Luật FIA 2022 định nghĩa bánh xe hoàn chỉnh và phân biệt vành, cơ cấu giữ bánh, hệ treo ngoài, cùm phanh và đĩa phanh. Cảnh này dùng các quan hệ được quy định đó để giải thích cụm ngữ nghĩa của Model B. Moay-ơ, phanh và kết cấu treo bên trong là hình học minh họa kỹ thuật do Podium dựng, không phải kích thước hay CAD ẩn của nhà sản xuất.'},
    function:{en:'Retain the rotating wheel, transmit road loads through the hub and suspension, and generate braking torque at the disc and caliper.',vi:'Giữ cụm bánh quay, truyền tải từ mặt đường qua moay-ơ và hệ treo, đồng thời tạo mô-men phanh tại đĩa và cùm phanh.'},
    sourceIds:['fia-2022-technical-regulations-i13'],
    geometryProvenance:'mixed-source-and-illustrative',
    provenanceLabel:{en:'Source-derived wheel envelope with Podium-authored center-lock, hub, brake and suspension explanation geometry.',vi:'Envelope bánh xe bắt nguồn từ Model B; khóa tâm, moay-ơ, phanh và hệ treo là hình học giải thích do Podium dựng.'},
    sourceVerificationStatus:'verified',
    reviewerApprovalStatus:'pending-owner',
  },
  {
    id:'front-wing-2022-flow-control',
    semanticComponentIds:['FRONT_WING','FRONT_WING.MAIN_PLANE','FRONT_WING.FLAP_ELEMENTS','FRONT_WING.ENDPLATES','FRONT_WING.MOUNTING_POINTS'],
    title:{en:'Front wing · first contact with the air',vi:'Cánh trước · điểm chạm đầu tiên với luồng khí'},
    summary:{en:'The front wing creates aerodynamic load while setting the airflow conditions seen by the wheels, floor and bodywork behind it.',vi:'Cánh trước tạo tải khí động đồng thời định hình luồng khí đi tới bánh xe, sàn và thân xe phía sau.'},
    detail:{en:'The 2022 rules define the wing profiles, tip and endplate as a tightly controlled assembly. Formula 1’s technical explanation links that simplification to a cleaner, narrower wake. This Model B reconstruction shows the relationship between the main plane, flap elements and endplates; it does not claim a team-specific pressure map or proprietary section profile.',vi:'Luật 2022 quy định chặt chẽ các biên dạng cánh, đầu cánh và endplate như một cụm thống nhất. Phân tích kỹ thuật chính thức của Formula 1 liên hệ cách đơn giản hóa này với vùng nhiễu hẹp và sạch hơn. Bản dựng Model B thể hiện quan hệ giữa main plane, flap và endplate; không tuyên bố bản đồ áp suất hay biên dạng độc quyền của bất kỳ đội đua nào.'},
    function:{en:'Generate front aerodynamic load and manage the quality and direction of downstream airflow.',vi:'Tạo tải khí động phía trước và kiểm soát chất lượng, hướng của luồng khí đi về phía sau.'},
    sourceIds:['fia-2022-technical-regulations-i13','f1-2022-front-wing-cleaner-wake'],
    geometryProvenance:'newly-authored-illustrative',
    provenanceLabel:{en:'Podium-authored closed geometry derived from the accepted Model B envelope.',vi:'Hình học kín do Podium dựng từ envelope Model B đã được chấp nhận.'},
    sourceVerificationStatus:'verified',
    reviewerApprovalStatus:'pending-owner',
  },
  {
    id:'left-sidepod-radiator-2022-cooling',
    semanticComponentIds:['LEFT_SIDEPOD','LEFT_SIDEPOD.EXTERIOR_SHELL','COOLING_LEFT.RADIATOR_CORE','COOLING_LEFT.INLET_DUCT','COOLING_LEFT.COOLANT_CIRCUIT','COOLING_LEFT.THERMAL_BARRIER'],
    title:{en:'Sidepod and radiator · moving heat through an aerodynamic envelope',vi:'Hông xe và két tản nhiệt · dẫn nhiệt qua một vỏ khí động'},
    summary:{en:'The sidepod is external aerodynamic bodywork; beneath it, heat exchangers and ducts route cooling air through a tightly packaged region.',vi:'Sidepod là lớp vỏ khí động bên ngoài; bên dưới, két trao đổi nhiệt và ống dẫn đưa khí làm mát qua một vùng đóng gói chặt chẽ.'},
    detail:{en:'The FIA rules separately define sidepod bodywork, cooling-flow apertures, coolant lines and heat exchangers. Contemporary 2022 Formula 1 analysis shows that radiator placement, inlet size and exit treatment are packaging choices with aerodynamic consequences. Model B’s exterior shell is source-derived; the radiator, duct, coolant circuit and thermal barrier shown here are Podium-authored explanatory geometry, not manufacturer CAD.',vi:'Luật FIA tách riêng quy định về vỏ sidepod, cửa thoát khí làm mát, đường coolant và bộ trao đổi nhiệt. Phân tích Formula 1 năm 2022 cho thấy vị trí két, kích thước cửa nạp và cách xử lý cửa thoát là những lựa chọn đóng gói có hệ quả khí động. Vỏ ngoài Model B bắt nguồn từ hình học nguồn; radiator, duct, mạch coolant và tấm chắn nhiệt tại đây là hình học giải thích do Podium dựng, không phải CAD của nhà sản xuất.'},
    function:{en:'Package the cooling path while preserving the external surfaces that condition airflow toward the floor edge and rear bodywork.',vi:'Đóng gói đường làm mát đồng thời duy trì bề mặt ngoài định hướng luồng khí về mép sàn và thân sau.'},
    sourceIds:['fia-2022-technical-regulations-i13','f1-2022-sidepod-radiator-layout','f1-2022-rb18-cooling-channel'],
    geometryProvenance:'mixed-source-and-illustrative',
    provenanceLabel:{en:'Model B source-derived shell with Podium-authored illustrative cooling internals.',vi:'Vỏ lấy từ nguồn Model B; hệ thống làm mát bên trong là hình học minh họa do Podium dựng.'},
    sourceVerificationStatus:'verified',
    reviewerApprovalStatus:'pending-owner',
  },
  {
    id:'powertrain-illustrative-path',
    semanticComponentIds:['POWERTRAIN','POWERTRAIN.ENGINE_BLOCK','POWERTRAIN.TURBO_ASSEMBLY','POWERTRAIN.GEARBOX','POWERTRAIN.REAR_DRIVE_SHAFTS','POWERTRAIN.MOUNTING_POINTS'],
    title:{en:'Mechanical heart · an illustrative power path',vi:'Trái tim cơ khí · đường truyền công suất minh họa'},
    summary:{en:'Engine, turbo, gearbox and drive shafts are staged as one explanatory chain from energy conversion to torque delivery.',vi:'Động cơ, turbo, hộp số và bán trục được trình bày như một chuỗi giải thích từ chuyển đổi năng lượng tới truyền mô-men.'},
    detail:{en:'The FIA regulations separately govern the power unit and transmission. Model B does not expose manufacturer internals, so this scene explains system relationships only. Every visible internal part is authored illustrative geometry and must not be interpreted as a team-specific architecture or dimension.',vi:'Luật FIA quy định riêng bộ nguồn và hệ truyền động. Model B không cung cấp kết cấu bên trong của nhà sản xuất, vì vậy cảnh này chỉ giải thích quan hệ hệ thống. Mọi chi tiết nội bộ nhìn thấy đều là hình học minh họa do Podium dựng, không đại diện cho kiến trúc hay kích thước của một đội đua cụ thể.'},
    function:{en:'Convert energy into torque, manage the operating path and transmit drive toward the rear wheels.',vi:'Chuyển đổi năng lượng thành mô-men, quản lý đường vận hành và truyền lực tới bánh sau.'},
    sourceIds:['fia-2022-technical-regulations-i13'],
    geometryProvenance:'newly-authored-illustrative',
    provenanceLabel:{en:'Podium-authored explanatory internals inside the accepted Model B envelope.',vi:'Hệ thống bên trong mang tính giải thích do Podium dựng trong envelope Model B đã được chấp nhận.'},
    sourceVerificationStatus:'verified',
    reviewerApprovalStatus:'pending-owner',
  },
];

export const sourceById=(id:string)=>ENGINEERING_SOURCES.find(source=>source.id===id);
export const narrationById=(id:string|null|undefined)=>ENGINEERING_NARRATIONS.find(narration=>narration.id===id);
