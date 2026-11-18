import type { Env } from "../../server/catalogue";

// GET /media/<key>: an image uploaded through the admin, streamed from R2.
// Keys are never reused (each upload gets a new one), so responses can be cached forever.
export const onRequestGet: PagesFunction<Env, "key"> = async ({ env, params }) => {
  const key = Array.isArray(params.key) ? params.key.join("/") : (params.key ?? "");
  if (!key) return new Response("Not found", { status: 404 });

  const object = await env.MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
};
