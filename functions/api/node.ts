import { getNode, json, type Env } from "../../server/catalogue";

// GET /api/node?path=a/b/c: the category or product at that path, or 404.
export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const path = new URL(request.url).searchParams.get("path") ?? "";
  const node = await getNode(env.DB, path);
  return node ? json(node) : json({ error: "not_found" }, { status: 404 });
};
