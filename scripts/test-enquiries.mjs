// End-to-end checks for POST /api/enquiries and /api/admin/enquiries against a local server
// (npm run dev:api with .dev.vars, which sets Cloudflare's always-pass Turnstile test secret).
// Usage: node scripts/test-enquiries.mjs [baseUrl] [turnstileFailBaseUrl]
// The second URL, if given, must be a server started with Cloudflare's always-FAIL test secret:
//   wrangler pages dev --port 8789 --ip 127.0.0.1 --binding TURNSTILE_SECRET=2x0000000000000000000000000000000AA
// Each check uses its own made-up visitor IP (203.0.113.x, reserved for documentation), which the
// local server accepts in CF-Connecting-IP (Cloudflare overwrites it in production). Everything
// the test creates is deleted again at the end: enquiries via the admin API, rate-limit rows via
// wrangler (local database only).
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

const base = process.argv[2] ?? "http://127.0.0.1:8788";
const failBase = process.argv[3];
const ADMIN = { "X-AEC-Admin": "1" };
const TOKEN = "XXXX.DUMMY.TOKEN.XXXX"; // Cloudflare's documented dummy token for the test keys
const PREFIX = "Zz Enquiry Test";
const usedIps = new Set();
let passed = 0;
let ipCounter = Math.floor(Math.random() * 150) + 50;
const nextIp = () => {
  const ip = `203.0.113.${ipCounter++}`;
  usedIps.add(ip);
  return ip;
};

async function call(method, path, body, { headers = {}, baseUrl = base } = {}) {
  const init = { method, headers: { ...headers } };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
    init.headers["Content-Type"] = "application/json";
  }
  const res = await fetch(baseUrl + path, init);
  const text = await res.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}
const submit = (input, { ip = nextIp(), baseUrl = base, headers = {} } = {}) =>
  call("POST", "/api/enquiries", { turnstileToken: TOKEN, ...input }, { baseUrl, headers: { "CF-Connecting-IP": ip, ...headers } });
const admin = (method, path, body) => call(method, `/api/admin/enquiries${path}`, body, { headers: ADMIN });
const ok = (name) => {
  passed++;
  console.log(`  ok  ${name}`);
};
const expect = async (name, promise, status, { error, field } = {}) => {
  const res = await promise;
  assert.equal(res.status, status, `${name}: got ${res.status} ${JSON.stringify(res.body)}`);
  if (error) assert.match(res.body.error, error, name);
  if (field) assert.equal(res.body.field, field, `${name}: field`);
  ok(`${name} -> ${status}${res.body?.error ? ` "${res.body.error}"` : ""}`);
  return res;
};
const valid = (extra = {}) => ({ name: `${PREFIX} ${Math.random().toString(36).slice(2, 7)}`, email: "qa@example.com", message: "Need gloves.", ...extra });
async function findByName(name) {
  for (const status of ["new", "read", "archived"]) {
    const list = await admin("GET", `?status=${status}`);
    const hit = list.body.enquiries.find((e) => e.name === name);
    if (hit) return hit;
  }
  return null;
}
const countAll = async () => {
  const { counts } = (await admin("GET", "?status=new")).body;
  return counts.new + counts.read + counts.archived;
};

const before = await countAll();

try {
  console.log("Validation");
  await expect("missing name", submit(valid({ name: "  " })), 400, { error: /enter your name/, field: "name" });
  await expect("missing message", submit(valid({ message: "" })), 400, { error: /enter your message/, field: "message" });
  await expect("neither email nor phone", submit(valid({ email: "", phone: "" })), 400, { error: /email address or a phone number/, field: "email" });
  await expect("bad email", submit(valid({ email: "not-an-email" })), 400, { error: /check the email/, field: "email" });
  await expect("bad phone", submit(valid({ email: "", phone: "call me maybe" })), 400, { error: /check the phone/, field: "phone" });
  await expect("name too long", submit(valid({ name: "x".repeat(121) })), 400, { error: /at most 120/, field: "name" });
  await expect("message too long", submit(valid({ message: "x".repeat(4001) })), 400, { error: /at most 4000/, field: "message" });
  await expect("wrong type", submit(valid({ company: 42 })), 400, { error: /invalid/, field: "company" });
  await expect("not JSON", call("POST", "/api/enquiries", "{oops", { headers: { "CF-Connecting-IP": nextIp() } }), 400, { error: /Invalid request/ });
  await expect("another site's Origin", submit(valid(), { headers: { Origin: "https://evil.example" } }), 403, { error: /blocked/ });
  assert.equal(await countAll(), before);
  ok("nothing was stored by the rejected requests");

  console.log("Accepted enquiries");
  const phoneOnly = valid({ email: "", phone: "+91 98765 43210", company: "QA Pvt Ltd", interest: "Safety / PPE", page: "/products/safety-ppe" });
  await expect("phone only (no email) is accepted", submit(phoneOnly), 201);
  const stored = await findByName(phoneOnly.name);
  assert.ok(stored, "stored");
  assert.equal(stored.status, "new");
  assert.equal(stored.notified, false);
  assert.equal(stored.phone, "+91 98765 43210");
  assert.equal(stored.interest, "Safety / PPE");
  assert.equal(stored.page, "/products/safety-ppe");
  assert.ok(!Number.isNaN(Date.parse(stored.createdAt)));
  ok("stored as new, not emailed (no mailer locally), every field kept");
  const trimmed = valid({ name: `  ${PREFIX} trim  `, email: " qa@example.com " });
  await expect("email only, with spaces around fields", submit(trimmed), 201);
  assert.ok(await findByName(`${PREFIX} trim`), "trimmed name stored");
  ok("fields are trimmed before saving");

  console.log("Spam protection");
  const bot = valid({ website: "https://spam.example" });
  const botCountBefore = await countAll();
  await expect("honeypot filled -> fake success", submit(bot), 201);
  assert.equal(await countAll(), botCountBefore);
  assert.equal(await findByName(bot.name), null);
  ok("honeypot enquiry was not stored");

  await expect("no Turnstile token", submit(valid({ turnstileToken: "" })), 403, { error: /not a robot/ });

  const limitedIp = nextIp();
  for (let i = 1; i <= 5; i++) await expect(`same visitor, enquiry ${i} of 5`, submit(valid(), { ip: limitedIp }), 201);
  await expect("same visitor, 6th within the hour", submit(valid(), { ip: limitedIp }), 429, { error: /several enquiries in the last hour/ });
  await expect("a different visitor is not affected", submit(valid()), 201);

  if (failBase) {
    const failing = valid();
    await expect("Turnstile says no (always-fail secret)", submit(failing, { baseUrl: failBase }), 403, { error: /not a robot/ });
    assert.equal(await findByName(failing.name), null);
    ok("enquiry that failed Turnstile was not stored");
  } else console.log("  --  skipped Turnstile-fail check (no second server URL given)");

  console.log("Admin inbox");
  const counts = (await admin("GET", "?status=new")).body.counts;
  // Created above: phone-only, trimmed, 5 from the rate-limited visitor, 1 from another visitor.
  assert.ok(counts.new >= 8, `at least 8 new, got ${counts.new}`);
  ok(`list with counts (new ${counts.new}, read ${counts.read}, archived ${counts.archived})`);
  const defaultList = await admin("GET", "");
  assert.ok(defaultList.body.enquiries.every((e) => e.status !== "archived"));
  ok("default list leaves out archived enquiries");
  const newest = (await admin("GET", "?status=new")).body.enquiries;
  assert.ok(newest.every((e, i) => i === 0 || e.createdAt <= newest[i - 1].createdAt));
  ok("newest first");

  const read = await expect("mark read", admin("PUT", `/${stored.id}`, { status: "read" }), 200);
  assert.equal(read.body.status, "read");
  assert.ok((await admin("GET", "?status=read")).body.enquiries.some((e) => e.id === stored.id));
  await expect("archive", admin("PUT", `/${stored.id}`, { status: "archived" }), 200);
  assert.ok((await admin("GET", "?status=archived")).body.enquiries.some((e) => e.id === stored.id));
  ok("moves between Read and Archived lists");
  await expect("bad status", admin("PUT", `/${stored.id}`, { status: "spam" }), 400, { error: /Status is invalid/ });
  await expect("status of a missing enquiry", admin("PUT", "/999999", { status: "read" }), 404, { error: /not found/ });
  await expect("delete", admin("DELETE", `/${stored.id}`), 204);
  assert.equal(await findByName(phoneOnly.name), null);
  ok("deleted enquiry is gone");
  await expect("delete it again", admin("DELETE", `/${stored.id}`), 404, { error: /not found/ });
  await expect("change without the admin header", call("PUT", `/api/admin/enquiries/${stored.id}`, { status: "read" }), 403, { error: /blocked/ });
} finally {
  // Remove every enquiry this run created, then its rate-limit rows (local database only).
  let removed = 0;
  for (const status of ["new", "read", "archived"]) {
    const list = await admin("GET", `?status=${status}`);
    for (const e of list.body?.enquiries ?? []) {
      if (e.name.startsWith(PREFIX)) {
        await admin("DELETE", `/${e.id}`);
        removed++;
      }
    }
  }
  const local = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base);
  if (local && usedIps.size) {
    const salt = process.env.ENQUIRY_SALT ?? "aec-enquiries";
    const hashes = [...usedIps].map((ip) => `'${createHash("sha256").update(`${salt}:${ip}`).digest("hex")}'`).join(",");
    execSync(`npx wrangler d1 execute aec-db --local --command "DELETE FROM enquiry_attempts WHERE visitor IN (${hashes})"`, { stdio: "ignore" });
  }
  console.log(`\nCleaned up ${removed} test enquiries${local ? " and their rate-limit rows" : ""}.`);
}

assert.equal(await countAll(), before, "enquiry count back to where it started");
console.log(`${passed} checks passed.`);
