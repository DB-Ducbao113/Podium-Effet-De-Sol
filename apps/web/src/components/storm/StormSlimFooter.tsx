import { memo } from "react";
import { Link } from "react-router-dom";

export interface StormSlimFooterProps {
  readonly lang: "vi" | "en";
}

export const StormSlimFooter = memo(function StormSlimFooter({
  lang,
}: StormSlimFooterProps) {
  const isVi = lang === "vi";

  return (
    <footer
      className="sp-slim-footer"
      data-testid="storm-slim-footer"
      aria-label={
        isVi ? "Thông tin dự án & bản quyền" : "Project & provenance footer"
      }
    >
      <div className="sp-slim-footer__inner">
        <p className="sp-slim-footer__copy">
          <strong>PODIUM · Effet de Sol</strong> —{" "}
          {isVi
            ? "Trải nghiệm biên tập & dữ liệu F1 độc lập (Jolpica & OpenF1), không liên kết FIA/F1. Hình ảnh concept mang tính minh họa biên tập; nghiên cứu 3D dựa trên FP-04 RB."
            : "Independent F1 editorial & verified telemetry showcase (Jolpica & OpenF1), unaffiliated with FIA/F1. Concept visuals are illustrative; 3D studies use FP-04 RB."}
        </p>
        <nav
          className="sp-slim-footer__links"
          aria-label={isVi ? "Liên kết nhanh" : "Footer links"}
        >
          <Link to="/showroom">{isVi ? "Garage 3D" : "3D Garage"}</Link>
          <Link to="/engineering">{isVi ? "Kỹ thuật" : "Engineering"}</Link>
          <Link to="/about">
            {isVi ? "Giới thiệu & Bản quyền" : "About & Provenance"}
          </Link>
        </nav>
      </div>
    </footer>
  );
});
