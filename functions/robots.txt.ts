import type { SeoEnv } from "../server/seo";
import { robotsTxt } from "../server/sitemap";

// GET /robots.txt: keeps the admin and API out of search engines and points to the sitemap.
export const onRequestGet: PagesFunction<SeoEnv> = ({ env, request }) =>
  new Response(robotsTxt(env, new URL(request.url)), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
