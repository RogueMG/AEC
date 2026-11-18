# Technical reference

How the Asiatic Engineering Co. site is put together, what runs where, and how to deploy and look
after it. For editing content, see [ADMIN.md](ADMIN.md). The [README](../README.md) covers local
development and feature details (enquiries, SEO, security headers).

## Architecture

| Part | What it is | Where |
| --- | --- | --- |
| Website | React single-page app built by Vite into `dist/` | Cloudflare Pages project **`asiatic-engineering`** |
| Server code | Pages Functions: the API, `/media`, sitemap/robots, and a middleware on every request | `functions/` (routes), `server/` (shared logic) |
| Database | Cloudflare D1 (SQLite) **`aec-db`**, binding `DB`, region APAC | `migrations/` |
| Image storage | Cloudflare R2 bucket **`aec-media`**, binding `MEDIA` | admin uploads under `uploads/` |
| Admin sign-in | Cloudflare Access, Zero Trust team `floral-recipe-5149.cloudflareaccess.com`, application "AEC admin" | Cloudflare dashboard |
| Bot check | Cloudflare Turnstile widget for `asiatic-engineering.pages.dev` | Cloudflare dashboard |
| Email (later) | Separate Worker **`aec-mailer`** using Email Routing, reached over a service binding `MAILER` | `workers/mailer/` (not deployed yet) |

`functions/_middleware.ts` runs on every request. For pages it fills `index.html` with that page's
title, description, canonical link, preview tags, structured data, a first-load data block and a
crawlable summary, and returns 404 for unknown paths (`server/seo.ts`). For every response it adds
the security headers.

## Endpoints

### Public

| Method and path | Returns |
| --- | --- |
| `GET /api/tree` | Top-level categories with sub-categories nested to any depth, plus each one's product links |
| `GET /api/node?path=a/b/c` | The category or (published) product at that path, or 404 |
| `GET /api/brands` | All brands in display order |
| `POST /api/enquiries` | Saves an enquiry (validation, honeypot, rate limit, Turnstile). 201 on success; 400/403/429 with `{ error, field? }` |
| `GET /media/<key>` | An uploaded image from R2, cached for a year (keys are never reused) |
| `GET /sitemap.xml`, `GET /robots.txt` | Generated from the database and `SITE_URL` |
| any other `/api/…` | JSON 404 |

Public catalogue responses are cached for 60 seconds (`stale-while-revalidate=300`), which is why
edits can take up to a minute to show.

### Admin (`/api/admin/*`)

Every request needs a Cloudflare Access sign-in token, checked twice: by Access at the edge, then by
`server/auth.ts` (RS256 signature against the team's certificates, plus audience, issuer, expiry and
email). Changes also need the header `X-AEC-Admin: 1` and a same-site `Origin`.

| Path | Methods |
| --- | --- |
| `me` | `GET`: the signed-in email |
| `tree` | `GET`: every category and product (including drafts) for the admin tree |
| `upload` | `POST` multipart `file`: WebP/JPEG/PNG/AVIF up to 5 MB → `{ key, src }` |
| `categories` | `POST` create |
| `categories/:id` | `GET`, `PUT` (also moves it), `DELETE` (only when empty) |
| `categories/reorder` | `POST { parentId, ids }`: the full list of siblings in the new order (`parentId: null` for top level) |
| `products` | `POST` create |
| `products/:id` | `GET`, `PUT` (also moves it), `DELETE` |
| `products/reorder` | `POST { parentId, ids }`: `parentId` is the category, `ids` the full list of its products in the new order |
| `brands` | `GET`, `POST` |
| `brands/:id` | `PUT`, `DELETE` |
| `brands/reorder` | `POST { parentId: null, ids }` |
| `enquiries?status=new\|read\|archived` | `GET`: the list plus counts (no status: everything not archived) |
| `enquiries/:id` | `PUT { status }`, `DELETE` |

Uploaded images that nothing refers to any more are deleted from R2 when the record that used them
changes or is deleted. Errors come back as `{ error, field? }` in plain language.

## Database tables

| Table | Holds |
| --- | --- |
| `categories` | `parent_id` (any depth; `NULL` = top level), `slug` (unique among siblings), `title`, `summary`, image (`image_key` for an upload **or** `image_url` for a link, plus `image_alt`), `tone`, `show_on_home`, `made_in_house`, `sort_order` |
| `products` | `category_id`, `brand_id`, `slug` (unique in its category), `title`, `summary`, `description` (sanitised HTML), `key_features` / `specifications` / `variants` (JSON arrays), `is_sample`, `published`, `sort_order` |
| `product_images` | `product_id`, image key **or** URL, `alt`, `sort_order` (the first is the main image) |
| `brands` | `slug`, `name`, `in_house`, logo key or URL with `logo_alt`, `sort_order` |
| `enquiries` | `name`, `company`, `email`, `phone`, `interest`, `message`, `page`, `status` (new/read/archived), `notified`, `created_at` |
| `enquiry_attempts` | Salted SHA-256 of the visitor's IP and a time, for the 5-per-hour limit. Rows older than a day are deleted |

Every table except the enquiry ones has `created_at` and `updated_at` (UTC). The sitemap's dates come
from `updated_at`. Triggers stop a product slug from matching a sibling category's slug and vice
versa, and stop a category being its own parent; deeper loops are refused by the API. D1 enforces
the foreign keys.

## Settings

| Name | Kind | Where it's set | Notes |
| --- | --- | --- | --- |
| `DB`, `MEDIA` | Bindings | `wrangler.toml` | D1 and R2 |
| `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` | Variables (not secret) | `wrangler.toml` `[vars]` | Must match the Access application |
| `TURNSTILE_SECRET` | Secret | Pages secret, Production **and** Preview | Set together with the site key |
| `ENQUIRY_SALT` | Secret | Pages secret, Production **and** Preview | Any long random string |
| `VITE_TURNSTILE_SITE_KEY` | Build-time, public | `.env.production` (committed) | Locally: `.env.development.local`, `.env.localtest.local` |
| `SITE_URL` | Variable | Not set yet | Add to `wrangler.toml` when the custom domain is connected (see below) |
| `MAILER` | Service binding | `wrangler.toml` (commented out) | Uncomment once `aec-mailer` is deployed |
| `ADMIN_DEV_BYPASS` | Local only | `.dev.vars` | **Never** set on Cloudflare; ignored except on localhost anyway |

Because the repository has a `wrangler.toml`, Cloudflare treats it as the source of truth for the
project's bindings and plain variables. Only secrets are managed in the dashboard. Set or change a
secret from a terminal (it asks for the value, so it never appears on screen or in history):

```bash
npx wrangler pages secret put TURNSTILE_SECRET --project-name asiatic-engineering
npx wrangler pages secret put TURNSTILE_SECRET --project-name asiatic-engineering --env preview
npx wrangler pages secret list --project-name asiatic-engineering
```

## Deploying

The Pages project is connected to GitHub `RogueMG/AEC`.

- **Production** builds from **`main`**: `https://asiatic-engineering.pages.dev`.
- **Previews** build from every other branch, e.g. `develop` → `https://develop.asiatic-engineering.pages.dev`,
  plus a fixed address per build (`https://<id>.asiatic-engineering.pages.dev`). Cloudflare adds
  `X-Robots-Tag: noindex` to previews, so they stay out of search results.
- Build command `npm run build`, output `dist`, Node version from `.node-version`.

So deploying is: **push to `develop`** to check a preview, then **merge into `main`** to go live.
Check builds with `npx wrangler pages deployment list --project-name asiatic-engineering`.

**Database changes** (new files in `migrations/`) are not applied by a deploy. Apply them first:

```bash
npm run db:migrate:remote
```

`npm run db:seed:remote` loads the starter catalogue. It only adds rows that don't exist yet, but
it's meant for an empty database; don't run it on a live one without checking.

**Backups:** D1 keeps a point-in-time history ("Time Travel"). To restore, use
`npx wrangler d1 time-travel info aec-db` and `npx wrangler d1 time-travel restore aec-db`; for a
copy you can keep, `npx wrangler d1 export aec-db --remote --output aec-db-backup.sql`.

## Connecting a custom domain (when bought)

1. Add the domain to Cloudflare (change its nameservers at the registrar to the ones Cloudflare gives).
2. In the Pages project: **Custom domains** → add the domain (and `www` if wanted).
3. Add the domain to the **Access** application (paths `admin` and `api/admin`) and to the
   **Turnstile** widget's hostnames.
4. Set `SITE_URL` in `wrangler.toml`, for production only, so canonicals, previews and the sitemap use
   the domain:

   ```toml
   [env.production.vars]
   SITE_URL = "https://www.example.com"
   ACCESS_TEAM_DOMAIN = "floral-recipe-5149.cloudflareaccess.com"
   ACCESS_AUD = "<the AUD tag>"
   ```

   An `[env.production]` section replaces the top-level settings for production, so it must repeat
   the variables, and the D1/R2 bindings under `[[env.production.d1_databases]]` and
   `[[env.production.r2_buckets]]`. Check the build log after pushing.
5. **Enquiry emails:** enable **Email Routing** on the domain and verify the destination inbox; deploy
   the mailer (`npx wrangler deploy --config workers/mailer/wrangler.toml`) and set its `MAIL_FROM`
   (an address on the domain) and `MAIL_TO` (the verified inbox) in the dashboard; uncomment the
   `[[services]] MAILER` block in `wrangler.toml` and push; send a test enquiry and check the admin
   says "Email sent".

## Free-plan limits

As published by Cloudflare on 2026-11-19. They change, so check the linked pages before relying on
them.

| Service | Free allowance | Source |
| --- | --- | --- |
| Pages static files | Unlimited requests | [Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/) |
| Pages Functions | 100,000 requests per day (shared with Workers on the account), 10 ms CPU per request; resets at midnight UTC | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) |
| Pages builds | 500 per month, 1 at a time, 20-minute timeout; up to 20,000 files, 25 MiB per file | [Pages limits](https://developers.cloudflare.com/pages/platform/limits/) |
| D1 | 5 million rows read and 100,000 rows written per day; 5 GB in total; 10 databases; 500 MB per database | [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) |
| R2 | 10 GB-month storage; 1 million Class A and 10 million Class B operations per month; no egress charge | [R2 pricing](https://developers.cloudflare.com/r2/pricing/) |
| Workers Paid (if ever needed) | From $5 per month per account | [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) |

**These are shared with the other project on the same Cloudflare account** (`mstradingco`): the
daily Functions requests, the 10 databases and the D1 totals count both sites together.

What uses the allowance here: every page view runs the middleware (one Functions request, plus a
few D1 reads), and API calls and `/media` images are Functions requests too. Static files (scripts,
styles, the photos in `/images`) are free. A B2B catalogue is very unlikely to come near 100,000
Functions requests a day; if it ever does, Workers Paid lifts the limits.

The Zero Trust (Access) free plan's user limit isn't stated on Cloudflare's plan pages; the admin
needs only a handful of users.

## Tests

| Command | Checks | Needs |
| --- | --- | --- |
| `npm run test:auth` | Sign-in token verification (16 checks) | Nothing |
| `npm run test:enquiry-units` | Email notification and mailer message (15) | Nothing |
| `npm run test:admin` | Admin API end to end (37); pass a second URL for the locked-server checks | `npm run dev:api` |
| `npm run test:enquiries` | Enquiry API end to end (37–39) | `npm run dev:api` |
| `npm run test:seo` | Tags, structured data, 404s, sitemap, robots, escaping, first-load data (14) | `npm run build:local` + `npm run dev:api` |

All tests run against the local server and clean up after themselves. The README describes the
extra servers some of them can use (a locked admin, an always-failing bot check, a custom `SITE_URL`).
