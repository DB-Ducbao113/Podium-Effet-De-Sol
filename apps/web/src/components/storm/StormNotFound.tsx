import { Link } from "react-router-dom";
import { useNavigationStore } from "../../store/useNavigationStore";

export interface StormNotFoundProps {
  readonly kicker?: string;
  readonly title?: string;
  readonly description?: string;
  readonly backHref?: string;
  readonly backLabel?: string;
}

export function StormNotFound({
  kicker = "HTTP 404 · UNRECOGNIZED ROUTE",
  title,
  description,
  backHref = "/",
  backLabel,
}: StormNotFoundProps) {
  const lang = useNavigationStore((state) => state.lang);
  const isVi = lang === "vi";

  return (
    <div
      className="sp-lg-wrap"
      data-prototype-tab="404"
      data-testid="storm-not-found"
    >
      <div className="sp-lg-panel sp-404-sim">
        <span className="sp-mono-tag">{kicker}</span>
        <h1>
          {title ?? (isVi ? "Không tìm thấy trang yêu cầu" : "Page not found")}
        </h1>
        <p>
          {description ??
            (isVi
              ? "Đường dẫn không tồn tại hoặc đã chuyển sang hệ điều hướng Storm Midnight chính thức."
              : "The requested route does not exist or has moved under the canonical Storm Midnight navigation.")}
        </p>
        <Link to={backHref} className="sp-storm-btn sp-storm-btn--primary">
          <span>
            {backLabel ?? (isVi ? "Về Tổng quan" : "Return to Overview")}
          </span>
        </Link>
      </div>
    </div>
  );
}
