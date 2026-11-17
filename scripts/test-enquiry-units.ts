// Unit checks for the enquiry email path, with no network and no Cloudflare runtime:
// - server/notify.ts against stand-in mailers (accepts, refuses, crashes, missing);
// - workers/mailer/src/message.ts: the raw email it builds, including header-injection attempts.
// Run with: npm run test:enquiry-units
import assert from "node:assert/strict";
import { notificationText, notify, type MailerBinding, type NotifyEnquiry } from "../server/notify.ts";
import { buildMessage } from "../workers/mailer/src/message.ts";

let passed = 0;
const ok = (name: string) => {
  passed++;
  console.log(`  ok  ${name}`);
};

const enquiry: NotifyEnquiry = {
  name: "Priya Raman",
  company: "Raman Forgings",
  email: "priya@example.com",
  phone: "98765 43210",
  interest: "Safety / PPE › Gloves",
  message: "Need 500 pairs.\nSize L.",
  page: "/products/safety-ppe",
};

// ---------- notify()
console.log("notify()");
{
  const calls: { url: string; init: RequestInit }[] = [];
  const accepting: MailerBinding = { fetch: async (url, init) => (calls.push({ url, init }), new Response(null, { status: 202 })) };
  assert.equal(await notify(accepting, enquiry), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://mailer.internal/send");
  assert.equal(calls[0].init.method, "POST");
  const sent = JSON.parse(String(calls[0].init.body)) as { subject: string; text: string; replyTo?: string };
  assert.equal(sent.subject, "Website enquiry: Safety / PPE › Gloves");
  assert.equal(sent.replyTo, "priya@example.com");
  assert.equal(sent.text, notificationText(enquiry));
  ok("mailer accepts → true, sends subject, text and reply-to");

  const text = notificationText({ ...enquiry, company: "", interest: "" });
  assert.match(text, /Company: {2}-/);
  assert.match(text, /Interest: -/);
  assert.match(text, /Need 500 pairs\.\nSize L\./);
  ok("notification text fills blanks with '-' and keeps the message");

  const noEmail: string[] = [];
  await notify({ fetch: async (_u, init) => (noEmail.push(String(init.body)), new Response(null, { status: 202 })) }, { ...enquiry, email: "", interest: "" });
  const body = JSON.parse(noEmail[0]) as { subject: string; replyTo?: string };
  assert.equal(body.replyTo, undefined);
  assert.equal(body.subject, "Website enquiry: Priya Raman");
  ok("no email → no reply-to; no interest → subject uses the name");

  const long: string[] = [];
  await notify({ fetch: async (_u, init) => (long.push(String(init.body)), new Response(null, { status: 202 })) }, { ...enquiry, interest: "x".repeat(400) });
  assert.equal((JSON.parse(long[0]) as { subject: string }).subject.length, 150);
  ok("subject is capped at 150 characters");

  assert.equal(await notify(undefined, enquiry), false);
  ok("no mailer bound → false (enquiry only stored)");

  assert.equal(await notify({ fetch: async () => new Response("Mailer not configured", { status: 503 }) }, enquiry), false);
  ok("mailer refuses (503) → false");

  const originalError = console.error;
  console.error = () => {};
  try {
    assert.equal(await notify({ fetch: async () => { throw new Error("network down"); } }, enquiry), false);
  } finally {
    console.error = originalError;
  }
  ok("mailer throws → false, no crash");
}

// ---------- buildMessage()
console.log("buildMessage()");
{
  const config = { MAIL_FROM: "enquiries@aec.example", MAIL_TO: "owner@example.com" };
  const now = new Date("2026-11-17T10:00:00Z");
  const decodeBody = (raw: string) => Buffer.from(raw.split("\r\n\r\n")[1].replace(/\r\n/g, ""), "base64").toString("utf8");
  const headers = (raw: string) => raw.split("\r\n\r\n")[0].split("\r\n");

  const built = buildMessage({ subject: "Website enquiry: Gloves › Cotton", text: "Hello ₹ 500\nLine two", replyTo: "priya@example.com" }, config, now, "fixed-id");
  assert.ok(built.ok);
  const h = headers(built.raw);
  assert.ok(h.includes("From: Asiatic Engineering website <enquiries@aec.example>"));
  assert.ok(h.includes("To: owner@example.com"));
  assert.ok(h.includes("Reply-To: priya@example.com"));
  assert.ok(h.includes("Date: Tue, 17 Nov 2026 10:00:00 GMT"));
  assert.ok(h.includes("Message-ID: <fixed-id@aec.example>"));
  assert.ok(h.includes("MIME-Version: 1.0"));
  assert.ok(h.includes("Content-Type: text/plain; charset=utf-8"));
  assert.ok(h.includes("Content-Transfer-Encoding: base64"));
  ok("headers: From, To, Reply-To, Date, Message-ID, MIME type");

  const subject = h.find((line) => line.startsWith("Subject: "))!;
  const encoded = /^Subject: =\?UTF-8\?B\?(.+)\?=$/.exec(subject)![1];
  assert.equal(Buffer.from(encoded, "base64").toString("utf8"), "Website enquiry: Gloves › Cotton");
  ok("subject is UTF-8 encoded and decodes back exactly");

  assert.equal(decodeBody(built.raw), "Hello ₹ 500\nLine two");
  ok("body is base64 and decodes back exactly (incl. ₹)");

  const longBody = buildMessage({ subject: "s", text: "a".repeat(2000) }, config, now, "id");
  assert.ok(longBody.ok);
  const bodyLines = longBody.raw.split("\r\n\r\n")[1].split("\r\n");
  assert.ok(bodyLines.every((line) => line.length <= 76), "body lines ≤ 76 characters");
  assert.equal(decodeBody(longBody.raw), "a".repeat(2000));
  ok("long body wrapped at 76 characters per line");

  const injected = buildMessage(
    { subject: "Hi\r\nBcc: victim@example.com", text: "x", replyTo: "a@example.com\r\nBcc: victim@example.com" },
    config,
    now,
    "id",
  );
  assert.ok(injected.ok);
  const ih = headers(injected.raw);
  assert.ok(!ih.some((line) => /^bcc:/i.test(line)), "no Bcc header line");
  assert.ok(!ih.some((line) => line.startsWith("Reply-To:")), "bad reply-to dropped");
  const injectedSubject = /^Subject: =\?UTF-8\?B\?(.+)\?=$/.exec(ih.find((l) => l.startsWith("Subject: "))!)![1];
  assert.equal(Buffer.from(injectedSubject, "base64").toString("utf8"), "Hi Bcc: victim@example.com");
  ok("line breaks in subject/reply-to can't add headers (Bcc attempt blocked)");

  for (const bad of ["not-an-email", "a@b", "<a@example.com>", "a@example.com, b@example.com"]) {
    const result = buildMessage({ subject: "s", text: "x", replyTo: bad }, config, now, "id");
    assert.ok(result.ok && !result.raw.includes("Reply-To:"), bad);
  }
  ok("invalid or multiple reply-to addresses are left out");

  assert.ok(!buildMessage(null, config).ok);
  assert.ok(!buildMessage({ subject: 1, text: "x" }, config).ok);
  assert.ok(!buildMessage({ subject: "s" }, config).ok);
  ok("missing or wrong-type subject/text → 400");

  const huge = buildMessage({ subject: "s".repeat(500), text: "t".repeat(20000) }, config, now, "id");
  assert.ok(huge.ok);
  const hugeSubject = /^Subject: =\?UTF-8\?B\?(.+)\?=$/.exec(headers(huge.raw).find((l) => l.startsWith("Subject: "))!)![1];
  assert.equal(Buffer.from(hugeSubject, "base64").toString("utf8").length, 200);
  assert.equal(decodeBody(huge.raw).length, 10000);
  ok("subject capped at 200 and body at 10,000 characters");
}

console.log(`\n${passed} checks passed.`);
