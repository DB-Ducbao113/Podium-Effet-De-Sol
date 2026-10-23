import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputArg = process.argv.find((value) => value.startsWith('--output='));
const distDir = path.resolve(outputArg?.slice('--output='.length) || 'dist');
const shellArg = process.argv.find((value) => value.startsWith('--shell='));
const shell = await readFile(
  path.resolve(shellArg?.slice('--shell='.length) || path.join('dist', 'index.html')),
  'utf8',
);
const articles = JSON.parse(await readFile('src/data/engineeringArticles.json', 'utf8'));
const siteUrl = (() => {
  try {
    return process.env.VITE_SITE_URL ? new URL(process.env.VITE_SITE_URL).origin : null;
  } catch {
    return null;
  }
})();
const deploymentContext =
  process.env.VITE_DEPLOYMENT_CONTEXT ?? process.env.VERCEL_ENV ?? process.env.CONTEXT;
const previewBuild = ['preview', 'deploy-preview', 'branch-deploy'].includes(deploymentContext);
const indexing = Boolean(siteUrl && process.env.VITE_ALLOW_INDEXING === 'true' && !previewBuild);
const esc = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const metadataPattern =
  /<meta\b[^>]*(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/gi;
const replaceMeta = (html, { title, description, route, image, imageAlt, type, content }) => {
  const canonical = siteUrl ? `${siteUrl}${route}` : null;
  const imageUrl = siteUrl ? new URL(image, siteUrl).href : image;
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<meta name="robots" content="${indexing ? 'index, follow' : 'noindex, nofollow'}">`,
    `<meta property="og:type" content="${type}">`,
    '<meta property="og:site_name" content="Podium Effet De Sol">',
    '<meta property="og:locale" content="vi_VN">',
    '<meta property="og:locale:alternate" content="en_US">',
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:image" content="${esc(imageUrl)}">`,
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(imageAlt)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${esc(imageUrl)}">`,
    `<meta name="twitter:image:alt" content="${esc(imageAlt)}">`,
    ...(canonical
      ? [
          `<meta property="og:url" content="${esc(canonical)}">`,
          `<link rel="canonical" href="${esc(canonical)}">`,
        ]
      : []),
  ].join('');
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(metadataPattern, '')
    .replace(/<link\b[^>]*rel="canonical"[^>]*>\s*/gi, '')
    .replace('</head>', `${head}</head>`)
    .replace('<div id="root"></div>', `<div id="root" data-prerendered="true">${content}</div>`);
};

const indexContent = `<main><h1>Engineering Insights</h1>${articles.map((article) => `<article><h2><a href="/engineering/${esc(article.slug)}">${esc(article.title.vi)} / ${esc(article.title.en)}</a></h2><p lang="vi">${esc(article.description.vi)}</p><p lang="en">${esc(article.description.en)}</p></article>`).join('')}</main>`;
const indexHtml = replaceMeta(shell, {
  title: 'Engineering Insights | Podium EDS',
  description:
    'Chuyên đề kỹ thuật xe đua song ngữ về khí động học, hybrid và động lực học xe qua nguyên mẫu EDS-G01.',
  route: '/engineering',
  image: articles[0].socialImage,
  imageAlt: 'Podium EDS Engineering Insights',
  type: 'website',
  content: indexContent,
});
await mkdir(path.join(distDir, 'engineering'), { recursive: true });
await writeFile(path.join(distDir, 'engineering', 'index.html'), indexHtml, 'utf8');

for (const article of articles) {
  const body = `<article><header><p>${esc(article.topic.vi)} / ${esc(article.topic.en)}</p><h1>${esc(article.title.vi)}</h1><p lang="en"><strong>${esc(article.title.en)}</strong></p><p>${esc(article.standfirst.vi)}</p><p lang="en">${esc(article.standfirst.en)}</p><img src="${esc(article.heroImage)}" alt="${esc(article.imageAlt.vi)}"></header>${article.sections.map((section) => `<section id="${esc(section.id)}"><h2>${esc(section.heading.vi)}</h2>${section.paragraphs.vi.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}<div lang="en"><h3>${esc(section.heading.en)}</h3>${section.paragraphs.en.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}</div></section>`).join('')}<section><h2>Nguồn kỹ thuật / Technical sources</h2><p>${esc(article.editorialReview.note.vi)} / ${esc(article.editorialReview.note.en)}</p><ul>${article.sources.map((source) => `<li><a href="${esc(source.url)}">${esc(source.title)}</a><p>${esc(source.version)} · ${esc(source.verification.vi)}</p></li>`).join('')}</ul></section></article>`;
  const canonical = siteUrl ? `${siteUrl}/engineering/${article.slug}` : null;
  const imageUrl = siteUrl ? new URL(article.socialImage, siteUrl).href : article.socialImage;
  const schema = `<script id="route-structured-data" type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'TechArticle', headline: article.title.vi, alternativeHeadline: article.title.en, description: article.description.vi, image: imageUrl, inLanguage: ['vi', 'en'], ...(canonical ? { mainEntityOfPage: canonical } : {}), author: { '@type': 'Organization', name: 'Podium EDS Editorial' }, publisher: { '@type': 'Organization', name: 'Podium Effet De Sol' } }).replaceAll('<', '\\u003c')}</script>`;
  const html = replaceMeta(shell, {
    title: `${article.title.vi} | Podium EDS`,
    description: article.description.vi,
    route: `/engineering/${article.slug}`,
    image: article.socialImage,
    imageAlt: article.imageAlt.vi,
    type: 'article',
    content: body,
  }).replace('</head>', `${schema}</head>`);
  const articleDir = path.join(distDir, 'engineering', article.slug);
  await mkdir(articleDir, { recursive: true });
  await writeFile(path.join(articleDir, 'index.html'), html, 'utf8');
}

console.log(
  `Prerendered Engineering Insights index and ${articles.length} articles; indexing=${indexing}; context=${deploymentContext ?? 'UNSET'}.`,
);
