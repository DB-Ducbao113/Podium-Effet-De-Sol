import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/corinthia/400.css";
import "@fontsource/corinthia/700.css";
import "@fontsource-variable/dancing-script/wght.css";
import "@fontsource-variable/manrope/wght.css";
import "@fontsource-variable/dm-sans/wght.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/cormorant-garamond/wght.css";
import "@fontsource-variable/cormorant-garamond/wght-italic.css";
import "@fontsource-variable/nunito/wght.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import App from "./App";
import "./index.css";
import "./styles/compactDesktop.css";
import "./styles/densityV2.css";
import "./styles/visualZoom.css";
import { BrowserRouter } from "react-router-dom";
import { DocumentIntroController } from "./components/common/DocumentIntroController";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

const rootElement = document.getElementById("root")!;
if (rootElement.dataset.prerendered === "true") rootElement.replaceChildren();

// Pre-warm Vietnamese editorial & display font subsets after initial paint so
// switching EN -> VI renders Cormorant Garamond Variable & Manrope instantaneously
// with zero swap flash and zero fallback even if a local dev server restarts.
if (typeof window !== "undefined" && "fonts" in document) {
  const prewarmVietnameseFaces = () => {
    const sample = "CHIẾN THẮNG ĐIÊU KHẮC GIẢI MÃ BIÊN ĐỘ ẫệợưđ";
    void Promise.allSettled([
      document.fonts.load("italic 400 16px 'Cormorant Garamond Variable'", sample),
      document.fonts.load("400 16px 'Cormorant Garamond Variable'", sample),
      document.fonts.load("700 16px 'Manrope Variable'", sample),
      document.fonts.load("800 16px 'Manrope Variable'", sample),
    ]);
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(prewarmVietnameseFaces, { timeout: 800 });
  } else {
    globalThis.setTimeout(prewarmVietnameseFaces, 120);
  }
}

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
