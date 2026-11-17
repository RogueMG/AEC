import { deleteCategory, getCategory, updateCategory, type AdminEnv } from "../../../../server/admin";
import { noStoreJson, paramId, readJson } from "../../../../server/http";
import type { CategoryInput } from "../../../../src/lib/admin/types";

// /api/admin/categories/:id: GET reads, PUT replaces (including moving), DELETE removes.
export const onRequestGet: PagesFunction<AdminEnv, "id"> = async ({ env, params }) => noStoreJson(await getCategory(env, paramId(params.id)));
export const onRequestPut: PagesFunction<AdminEnv, "id"> = async ({ env, params, request }) =>
  noStoreJson(await updateCategory(env, paramId(params.id), await readJson<CategoryInput>(request)));
export const onRequestDelete: PagesFunction<AdminEnv, "id"> = async ({ env, params }) => {
  await deleteCategory(env, paramId(params.id));
  return new Response(null, { status: 204 });
};
