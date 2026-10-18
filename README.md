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
| `/studio/` | Content admin (Sanity Studio), once Sanity is connected |

## Content

Products, categories and brands come from Sanity, edited in the Studio. See
[docs/CONTENT_API.md](docs/CONTENT_API.md) for setup, the content model and the read endpoints.
Until a Sanity project is connected, the site renders the starter catalogue in
`src/data/catalogue.ts`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Site dev server at http://localhost:5173/AEC/ |
| `npm run build` | Production build into `dist/`, including the `404.html` fallback for deep links |
| `npm run lint` | ESLint |
| `npm run studio` | Studio dev server at http://localhost:3333/AEC/studio (needs `npm ci --prefix studio`) |
| `npm run seed:build` | Regenerates `sanity/seed.ndjson` from the starter catalogue |
| `npm run test:queries` | Runs the site's GROQ queries against the seed file |

## Design system

Colour, type, spacing and the cut angle are defined as tokens in `src/index.css`.
