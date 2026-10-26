import { MODEL_B_HOTSPOTS } from "../../dev/commercial-b/modelBExperience";

export interface AnatomyChapter {
  id: string;
  name: { vi: string; en: string };
  principle: { vi: string; en: string };
  explanation: { vi: string; en: string };
  caveat: { vi: string; en: string };
  diagram:
    | "flow"
    | "cooling"
    | "pressure"
    | "recovery"
    | "load"
    | "platform"
    | "safety";
  hotspot: (typeof MODEL_B_HOTSPOTS)[number];
}

const content: Omit<AnatomyChapter, "hotspot">[] = [
  {
    id: "front-wing",
    name: { vi: "Cánh trước", en: "Front wing" },
    principle: {
      vi: "Định hình luồng khí đầu xe",
      en: "Conditioning the incoming flow",
    },
    explanation: {
      vi: "Cánh trước tạo tải khí động ở đầu xe và định hướng không khí đi tới bánh trước cùng phần sàn. Hiệu quả phụ thuộc hình dạng cánh, độ cao và dòng khí thực tế.",
      en: "The front wing contributes front-axle aerodynamic load and influences flow toward the front wheels and floor. Its effect depends on wing shape, ride height and the real flow field.",
    },
    caveat: {
      vi: "Hotspot là điểm tham chiếu gần đúng; không thể suy ra phân bố áp suất từ mesh này.",
      en: "The marker is approximate; this mesh cannot establish a pressure distribution.",
    },
    diagram: "flow",
  },
  {
    id: "sidepods",
    name: { vi: "Hông xe", en: "Sidepods" },
    principle: {
      vi: "Làm mát và điều hòa dòng khí",
      en: "Cooling and flow conditioning",
    },
    explanation: {
      vi: "Cửa hút ở hông cấp không khí cho hệ làm mát. Bề mặt hông đồng thời dẫn dòng khí dọc thân xe về khu vực phía sau.",
      en: "Sidepod inlets supply cooling air. The surrounding surfaces also guide external flow along the body toward the rear.",
    },
    caveat: {
      vi: "Model không cho thấy đường ống làm mát bên trong.",
      en: "The model does not reveal internal cooling ducts.",
    },
    diagram: "cooling",
  },
  {
    id: "floor",
    name: { vi: "Sàn và hiệu ứng mặt đất", en: "Floor & ground effect" },
    principle: { vi: "Tạo lực ép dưới gầm", en: "Generating underfloor load" },
    explanation: {
      vi: "Dòng khí đi qua vùng dưới sàn có thể làm giảm áp suất so với phía trên, tạo lực ép xuống. Khoảng sáng gầm và khả năng giữ kín dòng khí ảnh hưởng mạnh đến kết quả.",
      en: "Air accelerated beneath the floor can lower pressure relative to the upper body, contributing downforce. Ride height and control of the underfloor flow strongly affect the result.",
    },
    caveat: {
      vi: "Không có dữ liệu CFD hoặc mặt cắt hầm gió để định lượng lực ép.",
      en: "No CFD or wind-tunnel sections are available to quantify downforce.",
    },
    diagram: "pressure",
  },
  {
    id: "diffuser",
    name: { vi: "Bộ khuếch tán", en: "Diffuser" },
    principle: {
      vi: "Khôi phục áp suất ở đuôi sàn",
      en: "Underfloor pressure recovery",
    },
    explanation: {
      vi: "Phần sau sàn mở rộng đường thoát cho không khí dưới gầm. Sự mở rộng có kiểm soát hỗ trợ duy trì dòng khí và hiệu quả lực ép của sàn.",
      en: "The diffuser expands the underfloor exit. Controlled expansion helps maintain flow through the floor and supports its aerodynamic load.",
    },
    caveat: {
      vi: "Chú thích không mô phỏng dòng khí hay cấu hình diffuser thực.",
      en: "This annotation is not a flow simulation or a verified diffuser section.",
    },
    diagram: "recovery",
  },
  {
    id: "rear-wing",
    name: { vi: "Cánh sau", en: "Rear wing" },
    principle: {
      vi: "Cân bằng lực ép và lực cản",
      en: "Balancing load and drag",
    },
    explanation: {
      vi: "Cánh sau góp phần tạo lực ép cho trục sau, đồng thời tăng lực cản khí động. Thiết lập cánh là sự đánh đổi tùy đường đua và điều kiện vận hành.",
      en: "The rear wing contributes rear-axle load while adding aerodynamic drag. Its setup is a trade-off shaped by the circuit and operating conditions.",
    },
    caveat: {
      vi: "Đây là model tĩnh; DRS không được mô phỏng.",
      en: "This is a static model; DRS is not simulated.",
    },
    diagram: "load",
  },
  {
    id: "suspension",
    name: { vi: "Hệ thống treo", en: "Suspension" },
    principle: {
      vi: "Kiểm soát nền tảng cơ học",
      en: "Controlling the mechanical platform",
    },
    explanation: {
      vi: "Các liên kết treo định vị bánh so với khung xe và truyền tải lực. Việc kiểm soát chuyển động thân xe cũng giúp giữ điều kiện làm việc ổn định cho khí động học.",
      en: "Suspension links locate each wheel relative to the chassis and transfer loads. Controlling body motion also helps keep the aerodynamic platform in a useful operating range.",
    },
    caveat: {
      vi: "Không suy ra động học treo hay cấu trúc bên trong từ model này.",
      en: "Suspension kinematics and internal construction cannot be inferred from this model.",
    },
    diagram: "platform",
  },
  {
    id: "halo",
    name: { vi: "Halo", en: "Halo" },
    principle: { vi: "Bảo vệ khoang lái", en: "Cockpit protection" },
    explanation: {
      vi: "Halo là kết cấu bảo vệ vùng đầu tay đua, được tích hợp với khung xe. Vị trí của nó trên model giúp xác định vùng bảo vệ, không chứng minh khả năng chịu tải.",
      en: "The halo is a structure protecting the driver’s head area and is integrated with the chassis. Its location on this model identifies the protective zone, not a tested load capacity.",
    },
    caveat: {
      vi: "Không dùng hình học tham chiếu này để đánh giá an toàn va chạm.",
      en: "This reference geometry is not evidence for crash-safety performance.",
    },
    diagram: "safety",
  },
];

const anatomyCameraAdjustments: Partial<
  Record<string, Partial<(typeof MODEL_B_HOTSPOTS)[number]>>
> = {
  diffuser: {
    position: [0, 0.12, 2.3],
    cameraPos: [0.5, 0.65, 3.7],
    cameraTarget: [0, 0.22, 2],
  },
  "rear-wing": { position: [-0.2, 0.78, 2.3] },
  suspension: { position: [0.78, 0.4, -1.7] },
  halo: { position: [0, 0.92, -0.17] },
};

export const ANATOMY_CHAPTERS: AnatomyChapter[] = content.map((chapter) => ({
  ...chapter,
  hotspot: {
    ...MODEL_B_HOTSPOTS.find((item) => item.id === chapter.id)!,
    ...anatomyCameraAdjustments[chapter.id],
  },
}));

export const getAnatomyChapter = (id: string | null) =>
  ANATOMY_CHAPTERS.find((chapter) => chapter.id === id) ?? ANATOMY_CHAPTERS[0];
