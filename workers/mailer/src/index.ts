// The mailer Worker: sends enquiry notifications with Cloudflare Email Routing's send_email
// binding, which Pages Functions can't use directly. The site calls it over a private service
// binding (MAILER); it has no public address (workers_dev = false, no routes).
import { EmailMessage } from "cloudflare:email";
import { buildMessage, type MailRequest } from "./message";

type Env = {
  SEND: SendEmail;
  /** Sender on your domain, e.g. "enquiries@yourdomain.com" (Email Routing must be enabled). */
  MAIL_FROM: string;
  /** Inbox to notify; must be a verified Email Routing destination address. */
  MAIL_TO: string;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST" || new URL(request.url).pathname !== "/send") return new Response("Not found", { status: 404 });
    if (!env.MAIL_FROM || !env.MAIL_TO) return new Response("Mailer not configured", { status: 503 });

    const body = (await request.json().catch(() => null)) as MailRequest | null;
    const message = buildMessage(body, env);
    if (!message.ok) return new Response(message.error, { status: message.status });

    await env.SEND.send(new EmailMessage(env.MAIL_FROM, env.MAIL_TO, message.raw));
    return new Response(null, { status: 202 });
  },
};
