import { getTree, json, type Env } from "../../server/catalogue";

// GET /api/tree: top-level categories with sub-categories nested to any depth.
export const onRequestGet: PagesFunction<Env> = async ({ env }) => json(await getTree(env.DB));
