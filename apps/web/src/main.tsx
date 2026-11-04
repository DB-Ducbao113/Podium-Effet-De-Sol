import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource/barlow-condensed/700-italic.css";
import "@fontsource/barlow-condensed/800-italic.css";
import "@fontsource-variable/space-grotesk/wght.css";
import "@fontsource-variable/manrope/wght.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { DocumentIntroController } from "./components/common/DocumentIntroController";

const rootElement = document.getElementById("root")!;
if (rootElement.dataset.prerendered === "true") rootElement.replaceChildren();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <DocumentIntroController />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
