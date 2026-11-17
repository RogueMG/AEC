// Builds the raw RFC 822 email the mailer sends. No runtime imports, so it can be unit-tested in
// Node (scripts/test-enquiry-units.ts).

export type MailConfig = { MAIL_FROM: string; MAIL_TO: string };
export type MailRequest = { subject?: unknown; text?: unknown; replyTo?: unknown };
export type BuiltMessage = { ok: true; raw: string } | { ok: false; status: 400; error: string };

// Header values must never contain line breaks (that would let someone add headers).
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();
const EMAIL = /^[^\s@<>,;:"]+@[^\s@<>,;:"]+\.[^\s@<>,;:"]{2,}$/;

const base64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

export function buildMessage(
  body: MailRequest | null,
  config: MailConfig,
  now = new Date(),
  id: string = crypto.randomUUID(),
): BuiltMessage {
  if (!body || typeof body.subject !== "string" || typeof body.text !== "string") return { ok: false, status: 400, error: "Bad request" };
  const subject = oneLine(body.subject).slice(0, 200);
  const text = body.text.slice(0, 10000);
  const replyTo = typeof body.replyTo === "string" && EMAIL.test(oneLine(body.replyTo)) ? oneLine(body.replyTo) : null;
  const domain = config.MAIL_FROM.split("@")[1];

  const raw = [
    `From: Asiatic Engineering website <${config.MAIL_FROM}>`,
    `To: ${config.MAIL_TO}`,
    `Subject: =?UTF-8?B?${base64(subject)}?=`,
    `Date: ${now.toUTCString()}`,
    `Message-ID: <${id}@${domain}>`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64(text).replace(/.{76}/g, "$&\r\n"),
  ].join("\r\n");
  return { ok: true, raw };
}
