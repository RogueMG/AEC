import type { AdminEnv } from "../../../server/admin";
import { noStoreJson } from "../../../server/http";

// GET /api/admin/me: who is signed in.
export const onRequestGet: PagesFunction<AdminEnv> = async ({ data }) => noStoreJson({ email: data.email });
