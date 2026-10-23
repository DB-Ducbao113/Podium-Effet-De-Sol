import articlesJson from './engineeringArticles.json';

export type Language = 'vi' | 'en';
export type LocalizedText = Record<Language, string>;

export interface EngineeringSection {
  id: string;
  heading: LocalizedText;
  paragraphs: Record<Language, string[]>;
}

export interface EngineeringSource {
  title: string;
  url: string;
  version: string;
  accessed: string;
  verification: LocalizedText;
}

export interface EditorialReview {
  status: 'SOURCE_CHECKED_HUMAN_REVIEW_REQUIRED';
  reviewedOn: string;
  note: LocalizedText;
}

export interface EngineeringArticle {
  slug: string;
  topic: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  readingMinutes: number;
  heroImage: string;
  socialImage: string;
  imageAlt: LocalizedText;
  standfirst: LocalizedText;
  sections: EngineeringSection[];
  hotspots: string[];
  related: string[];
  sources: EngineeringSource[];
  editorialReview: EditorialReview;
}

export const ENGINEERING_ARTICLES = articlesJson as EngineeringArticle[];

export const getEngineeringArticle = (slug?: string) =>
  ENGINEERING_ARTICLES.find((article) => article.slug === slug);

export const getRelatedEngineeringArticles = (article: EngineeringArticle) =>
  article.related
    .map((slug) => getEngineeringArticle(slug))
    .filter((candidate): candidate is EngineeringArticle => Boolean(candidate));

export const HOTSPOT_LABELS: Record<string, LocalizedText> = {
  wings: { vi: 'Cánh khí động', en: 'Aerodynamic wings' },
  drs: { vi: 'Cơ cấu cánh chuyển động', en: 'Moving wing mechanism' },
  power_unit: { vi: 'Power Unit', en: 'Power unit' },
  halo: { vi: 'Khoang lái & Halo', en: 'Cockpit & halo' },
  sidepods: { vi: 'Sidepod & làm mát', en: 'Sidepods & cooling' },
  tires: { vi: 'Lốp & hệ treo', en: 'Tyres & suspension' },
  floor: { vi: 'Sàn & bộ khuếch tán', en: 'Floor & diffuser' },
};
