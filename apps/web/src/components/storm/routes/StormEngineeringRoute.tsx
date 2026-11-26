import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { StormEngineeringShow } from "../StormEngineeringShow";

export function StormEngineeringRoute() {
  const lang = useNavigationStore((s) => s.lang);
  const reducedMotion = useReducedMotion();

  return (
    <div className="sp-lg-eng-host">
      <StormEngineeringShow lang={lang} reducedMotion={reducedMotion} />
    </div>
  );
}

export default StormEngineeringRoute;
