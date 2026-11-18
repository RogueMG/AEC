import { createCategory, type AdminEnv } from "../../../../server/admin";
import { noStoreJson, readJson } from "../../../../server/http";
import type { CategoryInput } from "../../../../src/lib/admin/types";

// POST /api/admin/categories creates one.
export const onRequestPost: PagesFunction<AdminEnv> = async ({ env, request }) =>
  noStoreJson(await createCategory(env, await readJson<CategoryInput>(request)), 201);
