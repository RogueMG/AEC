// Admin authentication. Cloudflare Access sits in front of /admin and /api/admin and signs
// every request it lets through with a JWT (header Cf-Access-Jwt-Assertion, or the
// CF_Authorization cookie). We verify that token ourselves, so the admin API stays closed
// even if the Access policy were removed or bypassed.
// https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/

export type AuthEnv = {
  /** e.g. "yourteam.cloudflareaccess.com" */
  ACCESS_TEAM_DOMAIN?: string;
  /** The Access application's Audience (AUD) tag. */
  ACCESS_AUD?: string;
  /** "1" skips verification, but only for requests to localhost (local development). */
  ADMIN_DEV_BYPASS?: string;
};

export type AuthResult = { ok: true; email: string } | { ok: false; status: 401 | 403 | 500; reason: string };

type Jwk = JsonWebKey & { kid: string };

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const CERT_CACHE_MS = 60 * 60 * 1000;
let certCache: { team: string; at: number; keys: Jwk[] } | null = null;

const b64urlToBytes = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
};
const b64urlToJson = (value: string) => JSON.parse(new TextDecoder().decode(b64urlToBytes(value)));

async function accessKeys(team: string, refresh = false): Promise<Jwk[]> {
  if (!refresh && certCache && certCache.team === team && Date.now() - certCache.at < CERT_CACHE_MS) {
    return certCache.keys;
  }
  const response = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error(`Could not fetch Access certificates (${response.status})`);
  const { keys } = (await response.json()) as { keys: Jwk[] };
  certCache = { team, at: Date.now(), keys };
  return keys;
}

function readToken(request: Request): string | null {
  const header = request.headers.get("Cf-Access-Jwt-Assertion");
  if (header) return header;
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return match ? match[1] : null;
}

export async function authenticate(request: Request, env: AuthEnv): Promise<AuthResult> {
  const host = new URL(request.url).hostname;
  if (env.ADMIN_DEV_BYPASS === "1" && LOCAL_HOSTS.has(host)) {
    return { ok: true, email: "local-dev@localhost" };
  }

  const team = env.ACCESS_TEAM_DOMAIN;
  const audience = env.ACCESS_AUD;
  if (!team || !audience) return { ok: false, status: 500, reason: "Admin access is not configured" };

  const token = readToken(request);
  if (!token) return { ok: false, status: 401, reason: "Sign in required" };

  try {
    const [headerPart, payloadPart, signaturePart] = token.split(".");
    if (!headerPart || !payloadPart || !signaturePart) throw new Error("malformed");
    const header = b64urlToJson(headerPart) as { alg?: string; kid?: string };
    if (header.alg !== "RS256" || !header.kid) throw new Error("unexpected algorithm");

    let jwk = (await accessKeys(team)).find((k) => k.kid === header.kid);
    // Access rotates keys; refetch once if the key isn't known yet.
    if (!jwk) jwk = (await accessKeys(team, true)).find((k) => k.kid === header.kid);
    if (!jwk) throw new Error("unknown signing key");

    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      b64urlToBytes(signaturePart),
      new TextEncoder().encode(`${headerPart}.${payloadPart}`),
    );
    if (!valid) throw new Error("bad signature");

    const claims = b64urlToJson(payloadPart) as { aud?: string | string[]; iss?: string; exp?: number; nbf?: number; email?: string };
    const now = Math.floor(Date.now() / 1000);
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!audiences.includes(audience)) throw new Error("wrong audience");
    if (claims.iss !== `https://${team}`) throw new Error("wrong issuer");
    if (!claims.exp || claims.exp < now) throw new Error("expired");
    if (claims.nbf && claims.nbf > now + 60) throw new Error("not yet valid");
    if (!claims.email) throw new Error("no email");

    return { ok: true, email: claims.email };
  } catch {
    return { ok: false, status: 403, reason: "Invalid or expired sign-in" };
  }
}
