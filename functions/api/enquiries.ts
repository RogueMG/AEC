import { AdminInputError } from "../../server/admin";
import { submitEnquiry, type EnquiryEnv } from "../../server/enquiries";
import type { EnquiryInput } from "../../src/lib/enquiries/types";

const reply = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

// POST /api/enquiries: the public enquiry form.
export const onRequestPost: PagesFunction<EnquiryEnv> = async ({ env, request }) => {
  // Only accept submissions from this site's own pages.
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return reply({ error: "Request blocked" }, 403);

  let input: EnquiryInput;
  try {
    input = (await request.json()) as EnquiryInput;
  } catch {
    return reply({ error: "Invalid request" }, 400);
  }
  try {
    const result = await submitEnquiry(env, request, input);
    return result.ok ? reply({ ok: true }, 201) : reply({ error: result.error, ...(result.field ? { field: result.field } : {}) }, result.status);
  } catch (error) {
    if (error instanceof AdminInputError) return reply({ error: error.message, ...(error.field ? { field: error.field } : {}) }, error.status);
    console.error("Enquiry failed", error);
    return reply({ error: "Something went wrong. Please call or WhatsApp us instead." }, 500);
  }
};
