import { deleteProduct, getProduct, updateProduct, type AdminEnv } from "../../../../server/admin";
import { noStoreJson, paramId, readJson } from "../../../../server/http";
import type { ProductInput } from "../../../../src/lib/admin/types";

// /api/admin/products/:id: GET reads, PUT replaces (including moving), DELETE removes.
export const onRequestGet: PagesFunction<AdminEnv, "id"> = async ({ env, params }) => noStoreJson(await getProduct(env, paramId(params.id)));
export const onRequestPut: PagesFunction<AdminEnv, "id"> = async ({ env, params, request }) =>
  noStoreJson(await updateProduct(env, paramId(params.id), await readJson<ProductInput>(request)));
export const onRequestDelete: PagesFunction<AdminEnv, "id"> = async ({ env, params }) => {
  await deleteProduct(env, paramId(params.id));
  return new Response(null, { status: 204 });
};
