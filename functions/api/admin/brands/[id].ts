import { deleteBrand, updateBrand, type AdminEnv } from "../../../../server/admin";
import { noStoreJson, paramId, readJson } from "../../../../server/http";
import type { BrandInput } from "../../../../src/lib/admin/types";

// /api/admin/brands/:id: PUT replaces (including moving), DELETE removes.
export const onRequestPut: PagesFunction<AdminEnv, "id"> = async ({ env, params, request }) =>
  noStoreJson(await updateBrand(env, paramId(params.id), await readJson<BrandInput>(request)));
export const onRequestDelete: PagesFunction<AdminEnv, "id"> = async ({ env, params }) => {
  await deleteBrand(env, paramId(params.id));
  return new Response(null, { status: 204 });
};
