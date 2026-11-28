import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/corinthia/400.css";
import "@fontsource/corinthia/700.css";
import "@fontsource-variable/dancing-script/wght.css";
import "@fontsource/chakra-petch/400.css";
import "@fontsource/chakra-petch/500.css";
import "@fontsource/chakra-petch/600.css";
import "@fontsource/chakra-petch/700.css";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource-variable/cormorant-garamond/wght.css";
import "@fontsource-variable/cormorant-garamond/wght-italic.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import App from "./App";
import "./index.css";
import "./styles/liquidGlass.css";
import "./styles/compactDesktop.css";
import "./styles/densityV2.css";
import "./styles/visualZoom.css";
import { BrowserRouter } from "react-router-dom";
import { DocumentIntroController } from "./components/common/DocumentIntroController";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

const rootElement = document.getElementById("root")!;
if (rootElement.dataset.prerendered === "true") rootElement.replaceChildren();

// Pre-warm Vietnamese editorial, motorsport display, and UI font subsets after initial
// paint so switching EN <-> VI renders Chakra Petch, Cormorant Garamond Variable, and
// Be Vietnam Pro instantaneously with zero swap flash and zero fallback.
if (typeof window !== "undefined" && "fonts" in document) {
  const prewarmVietnameseFaces = () => {
    const sample = "CHIẾN THẮNG ĐIÊU KHẮC GIẢI MÃ BIÊN ĐỘ ẫệợưđ";
    void Promise.allSettled([
      document.fonts.load("italic 400 16px 'Cormorant Garamond Variable'", sample),
      document.fonts.load("400 16px 'Cormorant Garamond Variable'", sample),
      document.fonts.load("600 16px 'Chakra Petch'", sample),
      document.fonts.load("700 16px 'Chakra Petch'", sample),
      document.fonts.load("400 16px 'Be Vietnam Pro'", sample),
      document.fonts.load("600 16px 'Be Vietnam Pro'", sample),
      document.fonts.load("700 16px 'Be Vietnam Pro'", sample),
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
