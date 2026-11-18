// /sitemap.xml and /robots.txt. The sitemap lists every public page, built from the database so
// new categories and products appear as soon as they're published.
import { escapeHtml, siteUrl, type SeoEnv } from "./seo";

type CategoryRow = { id: number; parent_id: number | null; slug: string; updated_at: string };
type ProductRow = { category_id: number; slug: string; updated_at: string };

// D1 stores "YYYY-MM-DD HH:MM:SS" in UTC; sitemaps want W3C dates.
const w3c = (sqlite: string) => `${sqlite.replace(" ", "T")}Z`;
const latest = (dates: string[]) => dates.reduce((a, b) => (b > a ? b : a), "");

export async function sitemapXml(env: SeoEnv, requestUrl: URL): Promise<string> {
  const base = siteUrl(env, requestUrl);
  const [categories, products] = await env.DB.batch([
    env.DB.prepare(`SELECT id, parent_id, slug, updated_at FROM categories ORDER BY parent_id, sort_order, title`),
    env.DB.prepare(`SELECT category_id, slug, updated_at FROM products WHERE published = 1 ORDER BY category_id, sort_order, title`),
  ]);
  const cats = categories.results as CategoryRow[];
  const prods = products.results as ProductRow[];

  const byId = new Map(cats.map((c) => [c.id, c]));
  const paths = new Map<number, string>();
  const pathOf = (id: number): string => {
    const known = paths.get(id);
    if (known !== undefined) return known;
    const row = byId.get(id)!;
    const path = row.parent_id === null ? row.slug : `${pathOf(row.parent_id)}/${row.slug}`;
    paths.set(id, path);
    return path;
  };

  const everything = latest([...cats.map((c) => c.updated_at), ...prods.map((p) => p.updated_at)]);
  const urls: { loc: string; lastmod?: string }[] = [
    { loc: `${base}/`, lastmod: everything || undefined },
    { loc: `${base}/products`, lastmod: everything || undefined },
    ...cats.map((c) => {
      // A category page changes when it or the products listed on it change.
      const own = prods.filter((p) => p.category_id === c.id).map((p) => p.updated_at);
      return { loc: `${base}/products/${pathOf(c.id)}`, lastmod: latest([c.updated_at, ...own]) };
    }),
    ...prods.map((p) => ({ loc: `${base}/products/${pathOf(p.category_id)}/${p.slug}`, lastmod: p.updated_at })),
  ];

  const body = urls
    .map((u) => `  <url><loc>${escapeHtml(u.loc)}</loc>${u.lastmod ? `<lastmod>${w3c(u.lastmod)}</lastmod>` : ""}</url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function robotsTxt(env: SeoEnv, requestUrl: URL): string {
  return ["User-agent: *", "Disallow: /admin", "Disallow: /api/", "", `Sitemap: ${siteUrl(env, requestUrl)}/sitemap.xml`, ""].join("\n");
}
