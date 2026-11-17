import { reorderProducts, type AdminEnv } from "../../../../server/admin";
import { noStoreJson, readJson } from "../../../../server/http";
import type { ReorderInput } from "../../../../src/lib/admin/types";

// POST /api/admin/products/reorder { parentId, ids }: ids is the full sibling list in its new order.
export const onRequestPost: PagesFunction<AdminEnv> = async ({ env, request }) => {
  await reorderProducts(env, await readJson<ReorderInput>(request));
  return noStoreJson({ ok: true });
};
