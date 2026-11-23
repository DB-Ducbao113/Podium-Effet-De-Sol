import React from "react";
import { EngineeringIndexPage } from "./EngineeringIndexPage";

/**
 * Synchronizes `/engineering/car-anatomy` (including legacy `?chapter=...` deep links)
 * directly onto the unified production 3D Disassembly & F1 Cockpit Engineering experience.
 */
const EngineeringAnatomyPageImpl: React.FC = () => {
  return <EngineeringIndexPage />;
};

export const EngineeringAnatomyPage = React.memo(EngineeringAnatomyPageImpl);
EngineeringAnatomyPage.displayName = "EngineeringAnatomyPage";

export default EngineeringAnatomyPage;
