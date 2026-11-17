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

## Design system

Colour, type, spacing and the cut angle are defined as tokens in `src/index.css`.
