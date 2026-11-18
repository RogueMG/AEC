// Any /api address that no other route handles: a plain JSON 404, rather than the site's page shell.
export const onRequest: PagesFunction = () =>
  new Response(JSON.stringify({ error: "not_found" }), {
    status: 404,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
