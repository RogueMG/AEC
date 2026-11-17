// Unit checks for server/auth.ts: signs tokens with a throwaway RSA key and serves its public
// key in place of Cloudflare Access's certificate endpoint, so both acceptance and every
// rejection path are exercised without a real Access team. Run with: npm run test:auth
import assert from "node:assert/strict";
import { authenticate } from "../server/auth.ts";

const TEAM = "aec-test.cloudflareaccess.com";
const AUD = "test-audience";
const env = { ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD };

const { privateKey, publicKey } = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true,
  ["sign", "verify"],
);
const jwk = { ...(await crypto.subtle.exportKey("jwk", publicKey)), kid: "key-1" };

let certFetches = 0;
globalThis.fetch = (async (input: RequestInfo | URL) => {
  assert.equal(String(input), `https://${TEAM}/cdn-cgi/access/certs`);
  certFetches++;
  return new Response(JSON.stringify({ keys: [jwk] }));
}) as typeof fetch;

const b64url = (data: Uint8Array | string) =>
  Buffer.from(typeof data === "string" ? data : data).toString("base64url");

async function sign(claims: Record<string, unknown>, header: Record<string, unknown> = { alg: "RS256", kid: "key-1" }) {
  const head = b64url(JSON.stringify(header));
  const body = b64url(JSON.stringify(claims));
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${b64url(new Uint8Array(signature))}`;
}

const now = Math.floor(Date.now() / 1000);
const good = { aud: [AUD], iss: `https://${TEAM}`, exp: now + 600, iat: now, email: "owner@example.com" };
const request = (token?: string, viaCookie = false, url = "https://aec.example.com/api/admin/me") =>
  new Request(url, {
    headers: token ? (viaCookie ? { Cookie: `other=1; CF_Authorization=${token}` } : { "Cf-Access-Jwt-Assertion": token }) : {},
  });

let passed = 0;
async function expect(name: string, token: string | undefined, outcome: "ok" | 401 | 403 | 500, opts: { cookie?: boolean; env?: object; url?: string } = {}) {
  const result = await authenticate(request(token, opts.cookie, opts.url), (opts.env ?? env) as typeof env);
  if (outcome === "ok") assert.ok(result.ok, `${name}: ${JSON.stringify(result)}`);
  else assert.ok(!result.ok && result.status === outcome, `${name}: ${JSON.stringify(result)}`);
  passed++;
  console.log(`  ok  ${name} -> ${result.ok ? `accepted (${result.email})` : `${result.status} ${result.reason}`}`);
}

await expect("valid token in header", await sign(good), "ok");
await expect("valid token in CF_Authorization cookie", await sign(good), "ok", { cookie: true });
await expect("audience as a plain string", await sign({ ...good, aud: AUD }), "ok");
await expect("no token", undefined, 401);
await expect("wrong audience", await sign({ ...good, aud: ["someone-else"] }), 403);
await expect("wrong issuer", await sign({ ...good, iss: "https://evil.cloudflareaccess.com" }), 403);
await expect("expired", await sign({ ...good, exp: now - 10 }), 403);
await expect("not valid yet", await sign({ ...good, nbf: now + 3600 }), 403);
await expect("no email claim", await sign({ ...good, email: undefined }), 403);
await expect("unknown signing key", await sign(good, { alg: "RS256", kid: "key-2" }), 403);
await expect("algorithm 'none'", await sign(good, { alg: "none", kid: "key-1" }), 403);
const valid = await sign(good);
const [h, , s] = valid.split(".");
await expect("payload swapped after signing", `${h}.${b64url(JSON.stringify({ ...good, email: "attacker@example.com" }))}.${s}`, 403);
await expect("garbage", "not-a-token", 403);
await expect("Access settings missing", await sign(good), 500, { env: {} });
await expect("dev bypass ignored on a real hostname", undefined, 401, { env: { ...env, ADMIN_DEV_BYPASS: "1" } });
await expect("dev bypass honoured on localhost", undefined, "ok", { env: { ...env, ADMIN_DEV_BYPASS: "1" }, url: "http://127.0.0.1:8788/api/admin/me" });

assert.ok(certFetches <= 3, `certificates fetched ${certFetches} times; expected caching`);
console.log(`\n${passed} checks passed (certificates fetched ${certFetches}x, cached between checks)`);
