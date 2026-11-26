import { StormEntityDetailPage } from "../StormEntityDetailPage";

export function StormTeamDetailRoute() {
  return <StormEntityDetailPage entityKind="team" />;
}

export function StormDriverDetailRoute() {
  return <StormEntityDetailPage entityKind="driver" />;
}

export function StormCarDetailRoute() {
  return <StormEntityDetailPage entityKind="car" />;
}

export default StormTeamDetailRoute;
