const normalizeSiteUrl = (value?: string) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.origin : null;
  } catch {
    return null;
  }
};

export const CONFIGURED_SITE_URL = normalizeSiteUrl(
  import.meta.env.VITE_SITE_URL,
);
export const INDEXING_REQUESTED =
  import.meta.env.VITE_ALLOW_INDEXING === "true";
export const DEPLOYMENT_CONTEXT = import.meta.env.VITE_DEPLOYMENT_CONTEXT;

export const isPreviewHostname = (hostname: string) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname.endsWith(".workers.dev") ||
  hostname.endsWith(".pages.dev");

export const canIndexCurrentHost = () =>
  Boolean(
    CONFIGURED_SITE_URL &&
    INDEXING_REQUESTED &&
    DEPLOYMENT_CONTEXT !== "preview" &&
    typeof window !== "undefined" &&
    !isPreviewHostname(window.location.hostname),
  );
