import { getAdminTree, type AdminEnv } from "../../../server/admin";
import { noStoreJson } from "../../../server/http";

// GET /api/admin/tree: every category and product, drafts included.
export const onRequestGet: PagesFunction<AdminEnv> = async ({ env }) => noStoreJson(await getAdminTree(env));
