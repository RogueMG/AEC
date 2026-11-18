import type { SeoEnv } from "../server/seo";
import { sitemapXml } from "../server/sitemap";

// GET /sitemap.xml: every public page, from the database.
export const onRequestGet: PagesFunction<SeoEnv> = async ({ env, request }) =>
  new Response(await sitemapXml(env, new URL(request.url)), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
