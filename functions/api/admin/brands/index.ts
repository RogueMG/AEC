import { createBrand, listBrands, type AdminEnv } from "../../../../server/admin";
import { noStoreJson, readJson } from "../../../../server/http";
import type { BrandInput } from "../../../../src/lib/admin/types";

// GET /api/admin/brands; POST /api/admin/brands creates one.
export const onRequestGet: PagesFunction<AdminEnv> = async ({ env }) => noStoreJson(await listBrands(env));
export const onRequestPost: PagesFunction<AdminEnv> = async ({ env, request }) =>
  noStoreJson(await createBrand(env, await readJson<BrandInput>(request)), 201);
