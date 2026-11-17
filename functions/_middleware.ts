// Runs before every request. For page requests (not /api, /media, files, or the admin) it fills
// the shared index.html with that page's title, description, canonical URL, link-preview tags,
// structured data and a plain-text summary, and returns a real 404 status for unknown paths.
// See server/seo.ts.
import { absolute, escapeHtml, seoForPath, siteUrl, type PageSeo, type SeoEnv } from "../server/seo";

const SKIP = /^\/(api|media|assets|images|cdn-cgi)(\/|$)/;
const HAS_EXTENSION = /\/[^/]+\.[a-z0-9]+$/i;

function isPage(request: Request, url: URL): boolean {
  return (request.method === "GET" || request.method === "HEAD") && !SKIP.test(url.pathname) && !HAS_EXTENSION.test(url.pathname);
}

function headTags(seo: PageSeo, base: string): string {
  const meta = (attr: "name" | "property", key: string, value: string) => `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;
  const image = absolute(base, seo.image.src);
  const url = seo.canonicalPath ? `${base}${seo.canonicalPath === "/" ? "/" : seo.canonicalPath}` : null;
  return [
    url ? `<link rel="canonical" href="${escapeHtml(url)}" />` : "",
    seo.preload
      ? `<link rel="preload" as="image" fetchpriority="high" href="${escapeHtml(seo.preload.href)}"${seo.preload.srcset ? ` imagesrcset="${escapeHtml(seo.preload.srcset)}" imagesizes="${escapeHtml(seo.preload.sizes ?? "100vw")}"` : ""} />`
      : "",
    seo.noindex ? meta("name", "robots", "noindex") : "",
    meta("property", "og:site_name", "Asiatic Engineering Co."),
    meta("property", "og:type", seo.ogType === "product" ? "product" : "website"),
    meta("property", "og:title", seo.title),
    meta("property", "og:description", seo.description),
    url ? meta("property", "og:url", url) : "",
    meta("property", "og:image", image),
    meta("property", "og:image:alt", seo.image.alt),
    meta("property", "og:locale", "en_IN"),
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", seo.title),
    meta("name", "twitter:description", seo.description),
    meta("name", "twitter:image", image),
    // "<" is escaped so text in the data can never close the script tag.
    ...seo.jsonLd.map((data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`),
  ]
    .filter(Boolean)
    .join("\n    ");
}

export const onRequest: PagesFunction<SeoEnv> = async ({ request, env, next }) => {
  const url = new URL(request.url);
  if (!isPage(request, url)) return next();

  const response = await next();
  const type = response.headers.get("Content-Type") ?? "";
  if (!type.includes("text/html")) return response;

  // The admin: keep it out of search results, change nothing else.
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
    const headers = new Headers(response.headers);
    headers.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(response.body, { status: response.status, headers });
  }

  let seo: PageSeo | null;
  try {
    seo = await seoForPath(env, url.pathname, siteUrl(env, url));
  } catch (error) {
    // Never let SEO break the site: serve the page as it is.
    console.error("SEO middleware failed", error);
    return response;
  }
  if (!seo) return response;

  const base = siteUrl(env, url);
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  headers.delete("ETag");
  // Pages are generated from the database, so let browsers and Cloudflare revalidate.
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  if (seo.noindex) headers.set("X-Robots-Tag", "noindex");

  const rewritten = new HTMLRewriter()
    .on("title", { element: (el) => void el.setInnerContent(seo.title) })
    .on('meta[name="description"]', { element: (el) => void el.setAttribute("content", seo.description) })
    .on("head", { element: (el) => void el.append(`    ${headTags(seo, base)}\n  `, { html: true }) })
    .on("div#root", { element: (el) => void el.setInnerContent(`<div class="seo-summary">${seo.summary}</div>`, { html: true }) })
    .transform(new Response(response.body, { status: seo.status, headers }));
  return rewritten;
};
