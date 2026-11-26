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

export interface HostIndexingInput {
  readonly configuredSiteUrl: string | null;
  readonly indexingRequested: boolean;
  readonly deploymentContext?: string;
  readonly locationOrigin?: string;
  readonly locationHostname?: string;
}

export const resolveCanIndexHost = ({
  configuredSiteUrl,
  indexingRequested,
  deploymentContext,
  locationOrigin,
  locationHostname,
}: HostIndexingInput) => {
  if (
    !configuredSiteUrl ||
    !indexingRequested ||
    deploymentContext === "preview" ||
    !locationOrigin ||
    !locationHostname
  ) {
    return false;
  }
  if (locationHostname === "localhost" || locationHostname === "127.0.0.1") {
    return false;
  }
  return (
    locationOrigin === configuredSiteUrl || !isPreviewHostname(locationHostname)
  );
};

export const canIndexCurrentHost = () =>
  typeof window !== "undefined" &&
  resolveCanIndexHost({
    configuredSiteUrl: CONFIGURED_SITE_URL,
    indexingRequested: INDEXING_REQUESTED,
    deploymentContext: DEPLOYMENT_CONTEXT,
    locationOrigin: window.location.origin,
    locationHostname: window.location.hostname,
  });
