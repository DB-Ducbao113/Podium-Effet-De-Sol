import { useNavigationStore } from "../../../store/useNavigationStore";
import { StormAboutView } from "../StormAboutView";

export function StormAboutRoute() {
  const lang = useNavigationStore((s) => s.lang);
  return <StormAboutView lang={lang} />;
}

export default StormAboutRoute;
