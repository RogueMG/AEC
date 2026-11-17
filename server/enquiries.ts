// Enquiry form handling: validation, spam protection (honeypot, Cloudflare Turnstile, per-visitor
// rate limit), storage, and an optional email notification through the mailer Worker.
import type { Enquiry, EnquiryInput, EnquiryList, EnquiryStatus } from "../src/lib/enquiries/types";
import { AdminInputError } from "./admin";
import { notify } from "./notify";

export type EnquiryEnv = {
  DB: D1Database;
  /** Turnstile secret key. Without it, the bot check is skipped (fine locally, not in production). */
  TURNSTILE_SECRET?: string;
  /** Salt for hashing visitor IPs in the rate-limit log. */
  ENQUIRY_SALT?: string;
  /** Service binding to the mailer Worker (workers/mailer). Without it, enquiries are only stored. */
  MAILER?: Fetcher;
};

const LIMIT_PER_HOUR = 5;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[0-9+()\-.\s]{6,40}$/;

function field(value: unknown, label: string, max: number, required = false): string {
  if (value !== undefined && value !== null && typeof value !== "string") throw new AdminInputError(`${label} is invalid`, 400, label.toLowerCase());
  const text = (value ?? "").trim();
  if (required && !text) throw new AdminInputError(`Please enter your ${label.toLowerCase()}`, 400, label.toLowerCase());
  if (text.length > max) throw new AdminInputError(`${label} must be at most ${max} characters`, 400, label.toLowerCase());
  return text;
}

export function parseEnquiry(input: EnquiryInput) {
  if (!input || typeof input !== "object") throw new AdminInputError("Invalid request");
  const enquiry = {
    name: field(input.name, "Name", 120, true),
    company: field(input.company, "Company", 120),
    email: field(input.email, "Email", 200),
    phone: field(input.phone, "Phone", 40),
    interest: field(input.interest, "Interest", 200),
    message: field(input.message, "Message", 4000, true),
    page: field(input.page, "Page", 300),
  };
  if (!enquiry.email && !enquiry.phone) throw new AdminInputError("Please give an email address or a phone number so we can reply", 400, "email");
  if (enquiry.email && !EMAIL.test(enquiry.email)) throw new AdminInputError("Please check the email address", 400, "email");
  if (enquiry.phone && !PHONE.test(enquiry.phone)) throw new AdminInputError("Please check the phone number", 400, "phone");
  return enquiry;
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyTurnstile(env: EnquiryEnv, token: string | undefined, ip: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET);
  body.append("response", token);
  body.append("remoteip", ip);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

export type SubmitResult = { ok: true } | { ok: false; status: 400 | 403 | 429; error: string; field?: string };

export async function submitEnquiry(env: EnquiryEnv, request: Request, input: EnquiryInput): Promise<SubmitResult> {
  // Bots that fill the hidden field get a normal-looking success and nothing is stored.
  if (input && typeof input === "object" && typeof input.website === "string" && input.website.trim()) return { ok: true };

  const enquiry = parseEnquiry(input);
  const ip = request.headers.get("CF-Connecting-IP") ?? "local";
  const visitor = await sha256(`${env.ENQUIRY_SALT ?? "aec-enquiries"}:${ip}`);

  const recent = await env.DB.prepare(
    `SELECT count(*) AS n FROM enquiry_attempts WHERE visitor = ? AND created_at > datetime('now', '-1 hour')`,
  )
    .bind(visitor)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= LIMIT_PER_HOUR) {
    return { ok: false, status: 429, error: "You've sent several enquiries in the last hour. Please call or WhatsApp us instead." };
  }

  if (!(await verifyTurnstile(env, input.turnstileToken, ip))) {
    return { ok: false, status: 403, error: "We couldn't confirm you're not a robot. Please try again." };
  }

  const saved = await env.DB.batch([
    env.DB.prepare(`INSERT INTO enquiry_attempts (visitor) VALUES (?)`).bind(visitor),
    env.DB.prepare(`DELETE FROM enquiry_attempts WHERE created_at < datetime('now', '-1 day')`),
    env.DB.prepare(
      `INSERT INTO enquiries (name, company, email, phone, interest, message, page) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    ).bind(enquiry.name, enquiry.company, enquiry.email, enquiry.phone, enquiry.interest, enquiry.message, enquiry.page),
  ]);
  const id = (saved[2].results[0] as { id: number }).id;

  // The enquiry is already safe in the database; email is a convenience on top.
  if (await notify(env.MAILER, enquiry)) {
    await env.DB.prepare(`UPDATE enquiries SET notified = 1 WHERE id = ?`).bind(id).run();
  }
  return { ok: true };
}

// ---------- admin inbox

type Row = { id: number; name: string; company: string; email: string; phone: string; interest: string; message: string; page: string; status: EnquiryStatus; notified: number; created_at: string };

const toEnquiry = (r: Row): Enquiry => ({
  id: r.id,
  name: r.name,
  company: r.company,
  email: r.email,
  phone: r.phone,
  interest: r.interest,
  message: r.message,
  page: r.page,
  status: r.status,
  notified: r.notified === 1,
  createdAt: `${r.created_at.replace(" ", "T")}Z`,
});

const STATUSES: EnquiryStatus[] = ["new", "read", "archived"];

export async function listEnquiries(db: D1Database, status: string | null): Promise<EnquiryList> {
  const filter = STATUSES.includes(status as EnquiryStatus) ? (status as EnquiryStatus) : null;
  const [rows, counts] = await db.batch([
    filter
      ? db.prepare(`SELECT * FROM enquiries WHERE status = ? ORDER BY created_at DESC, id DESC LIMIT 500`).bind(filter)
      : db.prepare(`SELECT * FROM enquiries WHERE status <> 'archived' ORDER BY created_at DESC, id DESC LIMIT 500`),
    db.prepare(`SELECT status, count(*) AS n FROM enquiries GROUP BY status`),
  ]);
  const tally = { new: 0, read: 0, archived: 0 };
  for (const row of counts.results as { status: EnquiryStatus; n: number }[]) tally[row.status] = row.n;
  return { enquiries: (rows.results as Row[]).map(toEnquiry), counts: tally };
}

export async function setEnquiryStatus(db: D1Database, id: number, status: unknown): Promise<Enquiry> {
  if (!STATUSES.includes(status as EnquiryStatus)) throw new AdminInputError("Status is invalid", 400, "status");
  const row = await db.prepare(`UPDATE enquiries SET status = ? WHERE id = ? RETURNING *`).bind(status, id).first<Row>();
  if (!row) throw new AdminInputError("Enquiry not found", 404);
  return toEnquiry(row);
}

export async function deleteEnquiry(db: D1Database, id: number): Promise<void> {
  const result = await db.prepare(`DELETE FROM enquiries WHERE id = ?`).bind(id).run();
  if (!result.meta.changes) throw new AdminInputError("Enquiry not found", 404);
}
