import { Link } from "react-router-dom";
import { getTeamIdentityStyle } from "../../utils/teamColors";

interface ProfileIdentityCardProps {
  kind: "team" | "driver";
  teamId: string;
  href: string;
  name: string;
  detail: string;
  meta: string;
  action: string;
  number?: number;
}

export function ProfileIdentityCard({
  kind,
  teamId,
  href,
  name,
  detail,
  meta,
  action,
  number,
}: ProfileIdentityCardProps) {
  return (
    <Link
      className={`c11-intro-card c11-intro-card--${kind}`}
      to={href}
      style={getTeamIdentityStyle(teamId)}
    >
      <span className="c11-card-header">
        <span className="c11-card-meta">{meta}</span>
        {kind === "driver" && (
          <span className="c11-card-number">{number ? `#${number}` : "—"}</span>
        )}
      </span>
      <strong>{name}</strong>
      <p>{detail}</p>
      <small className="c11-card-action">
        {action} <span aria-hidden="true">→</span>
      </small>
    </Link>
  );
}
