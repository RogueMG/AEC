import { createProduct, type AdminEnv } from "../../../../server/admin";
import { noStoreJson, readJson } from "../../../../server/http";
import type { ProductInput } from "../../../../src/lib/admin/types";

// POST /api/admin/products creates one.
export const onRequestPost: PagesFunction<AdminEnv> = async ({ env, request }) =>
  noStoreJson(await createProduct(env, await readJson<ProductInput>(request)), 201);
