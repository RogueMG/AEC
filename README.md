# Asiatic Engineering Co. website

Catalogue site for Asiatic Engineering Co., Chennai. React + Vite + Tailwind v4, deployed to GitHub
Pages from `main` at https://roguemg.github.io/AEC/.

## Pages

| Path | Page |
| --- | --- |
| `/` | Home |
| `/products` | All categories |
| `/products/:category` | One category and its products |
| `/products/:category/:product` | Product page |

## Content

Products, categories and brands currently come from the starter catalogue in
`src/data/catalogue.ts`, read through the hooks in `src/lib/content/hooks.ts`. They are moving to
a Cloudflare D1 database with an admin panel.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Site dev server at http://localhost:5173/AEC/ |
| `npm run build` | Production build into `dist/`, including the `404.html` fallback for deep links |
| `npm run lint` | ESLint |
| `npm run build:cf` | Production build for Cloudflare Pages (served from `/`) |
| `npm run dev:cf` | Builds and runs the site locally the way Cloudflare runs it, at http://127.0.0.1:8788, with the local database (`DB`) and image storage (`MEDIA`) |
| `npm run db:migrate:local` | Applies `migrations/` to the local D1 database |
| `npm run db:seed:local` | Loads the starter catalogue into the local database (safe to re-run; never overwrites) |

## Design system

Colour, type, spacing and the cut angle are defined as tokens in `src/index.css`.
