import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CONFIGURED_SITE_URL, canIndexCurrentHost } from '../../config/site';
import { getEngineeringArticle } from '../../data/engineeringArticles';
import { useNavigationStore } from '../../store/useNavigationStore';

const upsertMeta = (
  selector: string,
  attribute: 'name' | 'property',
  key: string,
  content: string,
) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

const routeCopy = (pathname: string, lang: 'vi' | 'en') => {
  if (pathname === '/engineering') {
    return {
      title: 'Engineering Insights | Podium EDS',
      description:
        lang === 'vi'
          ? 'Chuyên đề kỹ thuật xe đua song ngữ về khí động học, hybrid và động lực học xe qua nguyên mẫu EDS-G01.'
          : 'Bilingual race-engineering features on aerodynamics, hybrid systems and vehicle dynamics using EDS-G01.',
      type: 'website',
      image: '/images/eds/engineering/ground-effect-flow.svg',
    };
  }
  const article = getEngineeringArticle(pathname.match(/^\/engineering\/([^/]+)\/?$/)?.[1]);
  if (article)
    return {
      title: `${article.title[lang]} | Podium EDS`,
      description: article.description[lang],
      type: 'article',
      image: article.socialImage,
      article,
    };
  const pages: Record<string, [string, string, string, string]> = {
    '/': [
      'Podium EDS | Kỹ thuật và dữ liệu đua xe',
      'Podium EDS | Race Engineering and Data',
      'Ấn phẩm đua xe độc lập với Showroom EDS-G01, chuyên đề kỹ thuật và dữ liệu kết quả.',
      'An independent motorsport publication with the EDS-G01 Showroom, engineering features and results data.',
    ],
    '/showroom': [
      'Showroom kỹ thuật EDS-G01 | Podium EDS',
      'EDS-G01 Technical Showroom | Podium EDS',
      'Khám phá nguyên mẫu EDS-G01 gốc, sáu livery và bảy hotspot kỹ thuật tương tác.',
      'Explore the original EDS-G01 prototype, six liveries and seven interactive engineering hotspots.',
    ],
    '/teams': [
      'Danh bạ đội đua | Podium EDS',
      'Team Directory | Podium EDS',
      'Thông tin biên tập về các đội đua trong hệ hình ảnh nguyên bản Podium EDS.',
      'Editorial team reference presented through Podium EDS original visual assets.',
    ],
    '/drivers': [
      'Danh bạ tay đua | Podium EDS',
      'Driver Directory | Podium EDS',
      'Thông tin tay đua và mùa giải trong trải nghiệm biên tập độc lập.',
      'Driver and season reference in an independent editorial experience.',
    ],
    '/about': [
      'Về Podium EDS',
      'About Podium EDS',
      'Phương pháp, tính độc lập và phạm vi biên tập của Podium Effet De Sol.',
      'The methods, independence and editorial scope of Podium Effet De Sol.',
    ],
  };
  const exact = pages[pathname];
  if (exact)
    return {
      title: lang === 'vi' ? exact[0] : exact[1],
      description: lang === 'vi' ? exact[2] : exact[3],
      type: 'website',
      image: '/logo/og-preview.jpg',
    };
  if (pathname.startsWith('/season/'))
    return {
      title: lang === 'vi' ? 'Mùa giải và kết quả | Podium EDS' : 'Season and Results | Podium EDS',
      description:
        lang === 'vi'
          ? 'Lịch, bảng xếp hạng và kết quả mùa giải.'
          : 'Season schedule, standings and results.',
      type: 'website',
      image: '/logo/og-preview.jpg',
    };
  if (/^\/(teams|drivers|cars)\//.test(pathname))
    return {
      title: lang === 'vi' ? 'Hồ sơ đua xe | Podium EDS' : 'Motorsport Profile | Podium EDS',
      description:
        lang === 'vi'
          ? 'Hồ sơ biên tập độc lập của Podium EDS.'
          : 'An independent Podium EDS editorial profile.',
      type: 'profile',
      image: '/logo/og-preview.jpg',
    };
  return {
    title: lang === 'vi' ? 'Không tìm thấy trang | Podium EDS' : 'Page Not Found | Podium EDS',
    description: lang === 'vi' ? 'Trang không tồn tại.' : 'The requested page does not exist.',
    type: 'website',
    image: '/logo/og-preview.jpg',
    notFound: true,
  };
};

export const RouteSeo = () => {
  const { pathname } = useLocation();
  const lang = useNavigationStore((state) => state.lang);
  useEffect(() => {
    const copy = routeCopy(pathname, lang);
    const canonicalUrl = CONFIGURED_SITE_URL ? `${CONFIGURED_SITE_URL}${pathname}` : null;
    const imageUrl = CONFIGURED_SITE_URL
      ? new URL(copy.image, CONFIGURED_SITE_URL).href
      : copy.image;
    const indexable = canIndexCurrentHost() && !copy.notFound;
    document.documentElement.lang = lang;
    document.title = copy.title;
    upsertMeta('meta[name="description"]', 'name', 'description', copy.description);
    upsertMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      indexable ? 'index, follow' : 'noindex, nofollow',
    );
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', copy.type);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', copy.title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', copy.description);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl);
    upsertMeta('meta[property="og:image:type"]', 'property', 'og:image:type', 'image/png');
    upsertMeta('meta[property="og:image:width"]', 'property', 'og:image:width', '1200');
    upsertMeta('meta[property="og:image:height"]', 'property', 'og:image:height', '630');
    upsertMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt', copy.title);
    upsertMeta(
      'meta[property="og:locale"]',
      'property',
      'og:locale',
      lang === 'vi' ? 'vi_VN' : 'en_US',
    );
    upsertMeta(
      'meta[property="og:locale:alternate"]',
      'property',
      'og:locale:alternate',
      lang === 'vi' ? 'en_US' : 'vi_VN',
    );
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', copy.title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', copy.description);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl);
    upsertMeta('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt', copy.title);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalUrl) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
      upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    } else {
      canonical?.remove();
      document.head.querySelector('meta[property="og:url"]')?.remove();
    }
    document.getElementById('route-structured-data')?.remove();
    const schema = copy.article
      ? {
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: copy.article.title[lang],
          alternativeHeadline: copy.article.title[lang === 'vi' ? 'en' : 'vi'],
          description: copy.article.description[lang],
          image: imageUrl,
          inLanguage: ['vi', 'en'],
          ...(canonicalUrl ? { mainEntityOfPage: canonicalUrl } : {}),
          author: { '@type': 'Organization', name: 'Podium EDS Editorial' },
          publisher: { '@type': 'Organization', name: 'Podium Effet De Sol' },
        }
      : canonicalUrl
        ? {
            '@context': 'https://schema.org',
            '@type': pathname === '/engineering' ? 'CollectionPage' : 'WebPage',
            name: copy.title,
            description: copy.description,
            url: canonicalUrl,
          }
        : null;
    if (schema) {
      const script = document.createElement('script');
      script.id = 'route-structured-data';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }, [lang, pathname]);
  return null;
};
