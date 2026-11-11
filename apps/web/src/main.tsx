import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/corinthia/400.css";
import "@fontsource/corinthia/700.css";
import "@fontsource-variable/dancing-script/wght.css";
import "@fontsource-variable/cormorant-garamond/wght.css";
import "@fontsource-variable/quicksand/wght.css";
import "@fontsource-variable/nunito/wght.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import App from "./App";
import "./index.css";
import "./styles/compactDesktop.css";
import "./styles/densityV2.css";
import "./styles/visualZoom.css";
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
