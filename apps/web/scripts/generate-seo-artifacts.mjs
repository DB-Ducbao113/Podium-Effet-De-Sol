import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputArg = process.argv.find((value) => value.startsWith('--output='));
const outputDir = path.resolve(outputArg?.slice('--output='.length) || 'dist');
const parseSiteUrl = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.origin : null;
  } catch {
    return null;
  }
};
const siteUrl = parseSiteUrl(process.env.VITE_SITE_URL);
const allowIndexing = process.env.VITE_ALLOW_INDEXING === 'true';
const deploymentContext =
  process.env.VITE_DEPLOYMENT_CONTEXT ?? process.env.VERCEL_ENV ?? process.env.CONTEXT;
const previewBuild = ['preview', 'deploy-preview', 'branch-deploy'].includes(deploymentContext);
const indexing = Boolean(siteUrl && allowIndexing && !previewBuild);
const articles = JSON.parse(await readFile('src/data/engineeringArticles.json', 'utf8'));
const extractRecordKeys = (source, startMarker, endMarker) => {
  const block = source.slice(source.indexOf(startMarker), source.indexOf(endMarker));
  return [...block.matchAll(/^ {2}([a-z][a-z0-9_]*):\s*{/gm)].map((match) => match[1]);
};
const teamsSource = await readFile('src/data/teams.ts', 'utf8');
const driversSource = await readFile('src/data/drivers.ts', 'utf8');
const teams = extractRecordKeys(teamsSource, 'const RAW_TEAMS_DATA', 'export const TEAMS_DATA');
const drivers = extractRecordKeys(
  driversSource,
  'const RAW_DRIVERS_DATA',
  'export const DRIVERS_DATA',
);
const carSources = await Promise.all(
  ['2024', '2025', '2026'].map((season) => readFile(`src/data/cars/${season}.ts`, 'utf8')),
);
const cars = carSources.flatMap((source) =>
  [...source.matchAll(/\bid:\s*'([^']+)'/g)].map((match) => match[1]),
);
if (!teams.length || !drivers.length || !cars.length)
  throw new Error('SEO route discovery failed for teams, drivers or cars.');
const routes = [
  ...new Set([
    '/',
    '/season/2024',
    '/season/2025',
    '/season/2026',
    '/showroom',
    '/teams',
    '/drivers',
    '/about',
    '/engineering',
    ...articles.map((article) => `/engineering/${article.slug}`),
    ...teams.map((id) => `/teams/${id}`),
    ...drivers.map((id) => `/drivers/${id}`),
    ...cars.map((id) => `/cars/${id}`),
  ]),
];
const xmlEscape = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const sitemap = siteUrl
  ? `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((route) => `  <url><loc>${xmlEscape(`${siteUrl}${route}`)}</loc></url>`).join('\n')}\n</urlset>\n`
  : '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n';
const robots = indexing
  ? `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n';
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'sitemap.xml'), sitemap, 'utf8');
await writeFile(path.join(outputDir, 'robots.txt'), robots, 'utf8');
console.log(
  `SEO artifacts: ${routes.length} routes; indexing=${indexing}; context=${deploymentContext ?? 'UNSET'}; site=${siteUrl ?? 'UNCONFIGURED'}`,
);
