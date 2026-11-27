import React from "react";
import { Route, Routes } from "react-router-dom";
import { EngineeringLabArticlePage } from "./EngineeringLabArticlePage";
import { EngineeringLabExperiencePage } from "./EngineeringLabExperiencePage";

export const EngineeringLabSandboxRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<EngineeringLabExperiencePage />} />
      <Route path=":slug" element={<EngineeringLabArticlePage />} />
    </Routes>
  );
};

export default EngineeringLabSandboxRoutes;
