import { getEngineeringArticle } from "../../data/engineeringArticles";

export const routeCopy = (pathname: string, lang: "vi" | "en") => {
  if (pathname === "/engineering/car-anatomy") {
    return {
      title:
        lang === "vi"
          ? "Giải phẫu xe đua 3D | Podium EDS"
          : "3D Race Car Disassembly | Podium EDS",
      description:
        lang === "vi"
          ? "Giải phẫu 3D tương tác 47 cụm linh kiện và buồng lái vô-lăng F1 song ngữ trên Podium EDS."
          : "Interactive 47-part 3D race car disassembly and F1 cockpit telemetry view on Podium EDS.",
      type: "website",
      image: "/images/eds/engineering/ground-effect-flow.svg",
    };
  }
  if (pathname === "/engineering") {
    return {
      title: "Engineering Insights | Podium EDS",
      description:
        lang === "vi"
          ? "Giải phẫu 3D xe đua 47 cụm chi tiết, soi buồng lái F1 và bốn chuyên đề kỹ thuật song ngữ."
          : "Interactive 47-part 3D race car disassembly, F1 cockpit view and bilingual engineering features.",
      type: "website",
      image: "/images/eds/engineering/ground-effect-flow.svg",
    };
  }
  const article = getEngineeringArticle(
    pathname.match(/^\/engineering\/([^/]+)\/?$/)?.[1],
  );
  if (article)
    return {
      title: `${article.title[lang]} | Podium EDS`,
      description: article.description[lang],
      type: "article",
      image: article.socialImage,
      article,
    };
  const pages: Record<string, [string, string, string, string]> = {
    "/": [
      "Podium EDS | Kỹ thuật và dữ liệu đua xe",
      "Podium EDS | Race Engineering and Data",
      "Ấn phẩm đua xe độc lập với Garage 3D FP-04 RB, chuyên đề kỹ thuật 47 cụm và dữ liệu kết quả xác thực.",
      "An independent motorsport publication with the FP-04 RB 3D Garage, 47-part engineering features and verified race results.",
    ],
    "/showroom": [
      "Garage 3D FP-04 RB | Podium EDS",
      "FP-04 RB 3D Garage | Podium EDS",
      "Khám phá Pit Garage 2 khoang 11 đội 2026 trên mô hình nghiên cứu FP-04 RB với pit crew và điểm kỹ thuật tương tác.",
      "Explore the 2-bay 11-team 2026 Pit Garage on the FP-04 RB study mesh with interactive inspection and wheel service.",
    ],
    "/teams": [
      "Danh bạ đội đua | Podium EDS",
      "Team Directory | Podium EDS",
      "Thông tin biên tập về các đội đua trong hệ hình ảnh nguyên bản Podium EDS.",
      "Editorial team reference presented through Podium EDS original visual assets.",
    ],
    "/drivers": [
      "Danh bạ tay đua | Podium EDS",
      "Driver Directory | Podium EDS",
      "Thông tin tay đua và mùa giải trong trải nghiệm biên tập độc lập.",
      "Driver and season reference in an independent editorial experience.",
    ],
    "/about": [
      "Về Podium EDS",
      "About Podium EDS",
      "Phương pháp, tính độc lập và phạm vi biên tập của Podium Effet De Sol.",
      "The methods, independence and editorial scope of Podium Effet De Sol.",
    ],
  };
  const exact = pages[pathname];
  if (exact)
    return {
      title: lang === "vi" ? exact[0] : exact[1],
      description: lang === "vi" ? exact[2] : exact[3],
      type: "website",
      image: "/logo/og-preview.jpg",
    };
  if (pathname.startsWith("/season/"))
    return {
      title:
        lang === "vi"
          ? "Mùa giải và kết quả | Podium EDS"
          : "Season and Results | Podium EDS",
      description:
        lang === "vi"
          ? "Lịch, bảng xếp hạng và kết quả mùa giải."
          : "Season schedule, standings and results.",
      type: "website",
      image: "/logo/og-preview.jpg",
    };
  if (/^\/(teams|drivers|cars)\//.test(pathname))
    return {
      title:
        lang === "vi"
          ? "Hồ sơ đua xe | Podium EDS"
          : "Motorsport Profile | Podium EDS",
      description:
        lang === "vi"
          ? "Hồ sơ biên tập độc lập của Podium EDS."
          : "An independent Podium EDS editorial profile.",
      type: "profile",
      image: "/logo/og-preview.jpg",
    };
  return {
    title:
      lang === "vi"
        ? "Không tìm thấy trang | Podium EDS"
        : "Page Not Found | Podium EDS",
    description:
      lang === "vi"
        ? "Trang không tồn tại."
        : "The requested page does not exist.",
    type: "website",
    image: "/logo/og-preview.jpg",
    notFound: true,
  };
};
