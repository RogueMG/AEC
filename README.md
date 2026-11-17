# Asiatic Engineering Co. website

Catalogue site for Asiatic Engineering Co., Chennai. React + Vite + Tailwind v4, deployed to GitHub
Pages from `main` at https://roguemg.github.io/AEC/.

## Pages

| Path | Page |
| --- | --- |
| `/` | Home |
| `/products` | All categories |
| `/products/<category>/…` | A category at any depth: its sub-categories and products |
| `/products/<category>/…/<product>` | Product page |
| `/admin` | Admin: catalogue tree and edit forms (behind Cloudflare Access) |
| `/admin/brands` | Admin: brands |
| `/admin/enquiries` | Admin: enquiries inbox |

## Content

Categories (nested to any depth), products and brands live in a Cloudflare D1 database and are
served by Pages Functions:

| Endpoint | Returns |
| --- | --- |
| `GET /api/tree` | Top-level categories with sub-categories nested to any depth |
| `GET /api/node?path=a/b/c` | The category or product at that path, or 404 |
| `GET /api/brands` | All brands in display order |
| `GET /media/<key>` | An uploaded image from R2 |

### Admin API

`/api/admin/*` creates, edits, moves, reorders and deletes categories, products and brands, and
uploads images to R2 (`/api/admin/upload`). Every request must carry a valid Cloudflare Access
sign-in token, verified in `server/auth.ts`; changes must also send the `X-AEC-Admin: 1` header.
Product descriptions are cleaned to safe HTML on save (`server/sanitize.ts`), and uploads that
nothing uses any more are deleted from R2.

The admin screens live in `src/admin/` and are only downloaded by people who open `/admin`.
Uploads are resized in the browser to WebP (at most 1600px) before they're sent.

For local development, copy `.dev.vars.example` to `.dev.vars`. It skips the Access check for
requests to localhost only.

Server code is in `functions/` (routes) and `server/` (shared logic); response types are in
`src/lib/content/types.ts`. The starter catalogue in `src/data/catalogue.ts` seeds the database.

In `npm run dev`, Vite forwards `/api` and `/media` to the local Cloudflare server and keeps the
browser's `Host` header (`changeOrigin: false` in `vite.config.ts`). The API only accepts changes
whose `Origin` matches the address it was called on, so without this every form send and admin
save would be refused locally. Production doesn't use the proxy.

## Enquiries

The Contact section on the home page has an enquiry form (`src/components/contact/EnquiryForm.tsx`).
"Send an enquiry" buttons on product and category pages link to `/?interest=<path>#contact`, which
opens the form with that product or category already chosen.

1. `POST /api/enquiries` (`functions/api/enquiries.ts`, logic in `server/enquiries.ts`) checks the
   fields (name and message required; an email or a phone number required), then:
   - **Honeypot:** a hidden `website` field. If a bot fills it in, it gets a normal-looking success
     and nothing is saved.
   - **Rate limit:** at most 5 enquiries per visitor per hour. Visitors are tracked by a salted hash
     of their IP (`enquiry_attempts`), never the IP itself; rows older than a day are removed.
   - **Cloudflare Turnstile:** a free, usually invisible bot check, verified when `TURNSTILE_SECRET` is set.
2. The enquiry is saved in D1 first. Then, if the mailer is connected, an email notification is
   sent (`server/notify.ts`) and the enquiry is marked `notified`. A failed email never loses an
   enquiry.
3. The admin **Enquiries** tab lists them under New / Read / Archived, with reply buttons (email,
   WhatsApp, call), archive and delete. Opening a new enquiry marks it read.

Admin endpoints: `GET /api/admin/enquiries?status=new|read|archived`,
`PUT /api/admin/enquiries/:id` `{ status }`, `DELETE /api/admin/enquiries/:id`.

The site also has a floating WhatsApp button on every public page, whose message names the page
being viewed, and location cards whose Google map only loads when the visitor clicks "Show map".

### Turnstile settings

| Setting | Where | Value |
| --- | --- | --- |
| `VITE_TURNSTILE_SITE_KEY` | Build-time variable (public). Locally: `.env.development.local` and `.env.cloudflare.local` (see `.env.example`). Production: a **build** environment variable on the Cloudflare Pages project | The widget's site key |
| `TURNSTILE_SECRET` | Server secret. Locally: `.dev.vars`. Production: a Pages **secret** | The widget's secret key |
| `ENQUIRY_SALT` | Pages secret (optional locally) | Any long random string, for hashing visitor IPs |

Locally both keys use Cloudflare's test values that always pass. **Set the site key and the secret
together in production:** if the secret is set but the site key isn't, the form has no widget and
every enquiry is rejected.

### Email notifications (mailer Worker)

Pages Functions can't send email themselves, so `workers/mailer/` is a small separate Worker that
the site calls over a private service binding (`MAILER`). It has no public address. It builds the
email in `workers/mailer/src/message.ts` and sends it through Cloudflare Email Routing. Until it's
deployed, enquiries are only saved, and the admin shows them as "Not emailed".

To turn it on (needs a custom domain on Cloudflare):

1. Enable **Email Routing** on the domain and verify the inbox that should receive notifications.
2. Deploy the Worker with its two settings (not committed):
   `npx wrangler deploy --config workers/mailer/wrangler.toml`, then set `MAIL_FROM` (an address on
   the domain, e.g. `enquiries@yourdomain.com`) and `MAIL_TO` (the verified inbox) on the Worker.
3. Uncomment the `[[services]]` `MAILER` block in `wrangler.toml` and redeploy the site.
4. Send a test enquiry and check that the email arrives and the admin says "Email sent".

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev:full` | **Day-to-day development:** site with instant reload at http://localhost:5173 plus the local Cloudflare server for `/api` and `/media` |
| `npm run dev` | Site dev server only (needs `npm run dev:api` running for content) |
| `npm run dev:api` | Local Cloudflare server only, at http://127.0.0.1:8788 |
| `npm run build` | Production build into `dist/`, including the `404.html` fallback for deep links |
| `npm run lint` | ESLint |
| `npm run build:cf` | Production build for Cloudflare Pages (served from `/`) |
| `npm run dev:cf` | Builds and runs the site locally the way Cloudflare runs it, at http://127.0.0.1:8788, with the local database (`DB`) and image storage (`MEDIA`) |
| `npm run db:migrate:local` | Applies `migrations/` to the local D1 database |
| `npm run db:seed:local` | Loads the starter catalogue into the local database (safe to re-run; never overwrites) |
| `npm run test:auth` | Checks sign-in token verification (signs test tokens with a throwaway key) |
| `npm run test:admin` | End-to-end admin API checks against a running `npm run dev:api` (cleans up after itself) |
| `npm run test:enquiries` | End-to-end enquiry checks (validation, honeypot, rate limit, Turnstile, admin inbox) against a running `npm run dev:api`. Add a second URL for a server started with `--binding TURNSTILE_SECRET=2x0000000000000000000000000000000AA` to also test a failed bot check. Cleans up after itself |
| `npm run test:enquiry-units` | Email notification and mailer message checks, with stand-in mailers and no network |

## Design system

Colour, type, spacing and the cut angle are defined as tokens in `src/index.css`.
