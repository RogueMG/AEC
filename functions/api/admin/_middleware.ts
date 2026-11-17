import { AdminInputError, friendlyError, type AdminEnv } from "../../../server/admin";
import { authenticate } from "../../../server/auth";
import { ADMIN_HEADER, noStoreJson } from "../../../server/http";

// Guards every /api/admin/* route: verified Cloudflare Access sign-in, cross-site request
// protection for changes, and consistent JSON errors.
export const onRequest: PagesFunction<AdminEnv> = async (context) => {
  const { request, env } = context;

  const auth = await authenticate(request, env);
  if (!auth.ok) return noStoreJson({ error: auth.reason }, auth.status);

  // Access signs in with a cookie, so a page on another site could try to submit forms here.
  // Changes must carry a custom header (which other sites can't send without CORS, and we
  // allow none) and, when the browser sends one, an Origin matching this site.
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("Origin");
    if (request.headers.get(ADMIN_HEADER) !== "1" || (origin && origin !== new URL(request.url).origin)) {
      return noStoreJson({ error: "Request blocked" }, 403);
    }
  }

  context.data.email = auth.email;
  try {
    const response = await context.next();
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const known = error instanceof AdminInputError ? error : friendlyError(error);
    if (known) return noStoreJson({ error: known.message, ...(known.field ? { field: known.field } : {}) }, known.status);
    console.error("Admin API error", error);
    return noStoreJson({ error: "Something went wrong; try again" }, 500);
  }
};
