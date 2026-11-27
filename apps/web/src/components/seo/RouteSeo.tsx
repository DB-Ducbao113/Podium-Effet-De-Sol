import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { CONFIGURED_SITE_URL, canIndexCurrentHost } from "../../config/site";
import { useNavigationStore } from "../../store/useNavigationStore";
import { routeCopy } from "./routeCopy";
import { normalizeRoutePath } from "./routePath";

const upsertMeta = (
  selector: string,
  attribute: "name" | "property",
  key: string,
  content: string,
) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

export const RouteSeo = () => {
  const { pathname } = useLocation();
  const routePath = normalizeRoutePath(pathname);
  const lang = useNavigationStore((state) => state.lang);
  useLayoutEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    const copy = routeCopy(routePath, lang);
    const canonicalUrl = CONFIGURED_SITE_URL
      ? `${CONFIGURED_SITE_URL}${routePath}`
      : null;
    const imageUrl = CONFIGURED_SITE_URL
      ? new URL(copy.image, CONFIGURED_SITE_URL).href
      : copy.image;
    const indexable = canIndexCurrentHost() && !copy.notFound;
    document.documentElement.lang = lang;
    document.title = copy.title;
    upsertMeta(
      'meta[name="description"]',
      "name",
      "description",
      copy.description,
    );
    upsertMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      indexable ? "index, follow" : "noindex, nofollow",
    );
    upsertMeta('meta[property="og:type"]', "property", "og:type", copy.type);
    upsertMeta('meta[property="og:title"]', "property", "og:title", copy.title);
    upsertMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      copy.description,
    );
    upsertMeta('meta[property="og:image"]', "property", "og:image", imageUrl);
    upsertMeta(
      'meta[property="og:image:type"]',
      "property",
      "og:image:type",
      "image/png",
    );
    upsertMeta(
      'meta[property="og:image:width"]',
      "property",
      "og:image:width",
      "1200",
    );
    upsertMeta(
      'meta[property="og:image:height"]',
      "property",
      "og:image:height",
      "630",
    );
    upsertMeta(
      'meta[property="og:image:alt"]',
      "property",
      "og:image:alt",
      copy.title,
    );
    upsertMeta(
      'meta[property="og:locale"]',
      "property",
      "og:locale",
      lang === "vi" ? "vi_VN" : "en_US",
    );
    upsertMeta(
      'meta[property="og:locale:alternate"]',
      "property",
      "og:locale:alternate",
      lang === "vi" ? "en_US" : "vi_VN",
    );
    upsertMeta(
      'meta[name="twitter:title"]',
      "name",
      "twitter:title",
      copy.title,
    );
    upsertMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      copy.description,
    );
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", imageUrl);
    upsertMeta(
      'meta[name="twitter:image:alt"]',
      "name",
      "twitter:image:alt",
      copy.title,
    );
    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (canonicalUrl) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
      upsertMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    } else {
      canonical?.remove();
      document.head.querySelector('meta[property="og:url"]')?.remove();
    }
    document.getElementById("route-structured-data")?.remove();
    const schema = copy.article
      ? {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: copy.article.title[lang],
        alternativeHeadline: copy.article.title[lang === "vi" ? "en" : "vi"],
        description: copy.article.description[lang],
        image: imageUrl,
        inLanguage: ["vi", "en"],
        ...(canonicalUrl ? { mainEntityOfPage: canonicalUrl } : {}),
        author: { "@type": "Organization", name: "Podium EDS Editorial" },
        publisher: { "@type": "Organization", name: "Podium Effet De Sol" },
      }
      : canonicalUrl
        ? {
          "@context": "https://schema.org",
          "@type":
            routePath === "/engineering" ? "CollectionPage" : "WebPage",
          name: copy.title,
          description: copy.description,
          url: canonicalUrl,
        }
        : null;
    if (schema) {
      const script = document.createElement("script");
      script.id = "route-structured-data";
      script.type = "application/ld+json";
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }, [lang, routePath]);
  return null;
};
