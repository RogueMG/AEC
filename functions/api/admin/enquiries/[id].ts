import type { AdminEnv } from "../../../../server/admin";
import { deleteEnquiry, setEnquiryStatus } from "../../../../server/enquiries";
import { noStoreJson, paramId, readJson } from "../../../../server/http";

// PUT /api/admin/enquiries/:id { status } marks it new, read or archived; DELETE removes it (spam).
export const onRequestPut: PagesFunction<AdminEnv, "id"> = async ({ env, params, request }) => {
  const { status } = await readJson<{ status?: unknown }>(request);
  return noStoreJson(await setEnquiryStatus(env.DB, paramId(params.id), status));
};
export const onRequestDelete: PagesFunction<AdminEnv, "id"> = async ({ env, params }) => {
  await deleteEnquiry(env.DB, paramId(params.id));
  return new Response(null, { status: 204 });
};
