import type { AdminEnv } from "../../../../server/admin";
import { listEnquiries } from "../../../../server/enquiries";
import { noStoreJson } from "../../../../server/http";

// GET /api/admin/enquiries?status=new|read|archived (default: everything not archived).
export const onRequestGet: PagesFunction<AdminEnv> = async ({ env, request }) =>
  noStoreJson(await listEnquiries(env.DB, new URL(request.url).searchParams.get("status")));
