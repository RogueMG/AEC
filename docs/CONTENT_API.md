# Content API: products, categories and brands

Products, categories and brands live in **Sanity**, a hosted content database with a free plan.
Editors add and change content in the admin (Sanity Studio). The website and any other client read it
over a public, read-only HTTP API. New content appears on the site within about a minute (the
CDN cache), with no rebuild or redeploy.

| What | Where |
| --- | --- |
| Admin (Sanity Studio) | `https://roguemg.github.io/AEC/studio/`, built from [`studio/`](../studio) |
| Content model (schemas) | [`studio/schemaTypes/`](../studio/schemaTypes) |
| Project settings | [`sanity.project.json`](../sanity.project.json): `projectId`, `dataset`, `apiVersion` |
| Queries the site uses | [`src/lib/content/queries.ts`](../src/lib/content/queries.ts) |
| Response types | [`src/lib/content/types.ts`](../src/lib/content/types.ts) |
| Starter content | [`src/data/catalogue.ts`](../src/data/catalogue.ts) → [`sanity/seed.ndjson`](../sanity/seed.ndjson) |

Until `projectId` is set, the site renders the starter content in `src/data/catalogue.ts`, so it
works before Sanity is connected.

---

## One-time setup

1. **Create the project.** Sign in at [sanity.io/manage](https://www.sanity.io/manage), create a
   project on the free plan, and create a dataset named `production` with **public** visibility.
   Copy the project ID.
2. **Connect the repo.** Put the ID in `sanity.project.json` and push. The deploy workflow then also
   builds the Studio into `/AEC/studio/`.
3. **Allow the site's origins (CORS).** From `studio/`, after `npx sanity login`:

   ```bash
   npx sanity cors add https://roguemg.github.io --credentials
   ```

   ```bash
   npx sanity cors add http://localhost:3333 --credentials
   ```

   ```bash
   npx sanity cors add http://localhost:5173
   ```

   `--credentials` is needed for the Studio, because editors sign in there. The site itself only
   reads public data.
4. **Import the starter content** (optional), from the repo root:

   ```bash
   npm run seed:build
   ```

   ```bash
   npm run seed --prefix studio
   ```

   This creates the four categories, ten dealer brands plus the in-house brand, and eight sample
   products. Sample products are flagged **Sample listing**; turn the flag off once details are final.
   `--missing` skips documents that already exist, so re-running it never overwrites edits.
5. **Invite editors** in sanity.io/manage → Members. They sign in at `/AEC/studio/` with Google,
   GitHub or email.

---

## Content model

Every type has an `order` number: lower numbers come first, then items sort alphabetically.

### Category (`category`)

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Required |
| `slug` | slug | Required. Used in `/products/{slug}` |
| `summary` | text | Required, max 180 characters. Home tile and category page |
| `image` | Image | Required. See [Images](#images) |
| `tone` | `auto` · `coral` · `yellow` · `teal` · `navy` | `auto` cycles colours by position |
| `showOnHome` | boolean | Default `true`. Home tiles wrap four to a row |
| `madeInHouse` | boolean | Shows the "Made in-house" badge |
| `order` | number | Default 100 |

### Product (`product`)

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Required |
| `slug` | slug | Required. Used in `/products/{category}/{slug}` |
| `category` | reference → category | Required |
| `brand` | reference → brand | Optional |
| `summary` | text | Required, max 220 characters. Cards and product page intro |
| `images` | Image[] | Required, at least one. The first is the main image |
| `keyFeatures` | string[] | Bullet list |
| `description` | Portable Text | Paragraphs, h3 headings, bullet lists, bold and italic |
| `specifications` | `{ label, value }[]` | e.g. `Material` / `Cotton knit` |
| `variants` | string[] | Sizes or variants, e.g. `S`, `M`, `L` |
| `isSample` | boolean | Shows a "details to be confirmed" note |
| `order` | number | Order within the category |

### Brand (`brand`)

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required |
| `slug` | slug | Required |
| `inHouse` | boolean | `true` for Asiatic Engineering's own range. Not listed among dealer brands |
| `logo` | Image | Optional. Without a logo the name renders as text |
| `order` | number | The home page names the first three dealer brands |

### Images

An Image (`mediaImage`) is **either an upload or a link**, plus alt text:

```json
{ "upload": { "asset": { "_ref": "image-…" } }, "url": null, "alt": "Cotton knitted gloves" }
{ "upload": null, "url": "https://example.com/gloves.jpg", "alt": "Cotton knitted gloves" }
```

The queries below resolve both to a single `src`. Uploaded images are served from
`cdn.sanity.io` and can be resized on request by adding parameters, e.g.
`?w=800&fit=max&auto=format`. Linked images are used exactly as given.

---

## Endpoints

All reads are HTTP `GET` requests to the query API. No key is needed, because the dataset is public.

```
https://{projectId}.apicdn.sanity.io/v{apiVersion}/data/query/{dataset}?query={GROQ}&${param}={JSON value}
```

- `apicdn` is cached at the edge and is right for websites. Use `api` instead of `apicdn` for
  uncached reads, for example straight after an edit.
- `query` is a URL-encoded [GROQ](https://www.sanity.io/docs/groq) query. Parameters are passed as
  `$name=` with a **JSON-encoded** value, so strings keep their quotes: `$slug=%22mro%22`.
- The response is `{ "result": …, "ms": …, "query": … }`.
- Queries can be tried live in the Studio under **Vision**.

The site's four queries are below. The full text, including the shared image and card fragments,
is in [`src/lib/content/queries.ts`](../src/lib/content/queries.ts).

### All categories (home tiles, products page)

```groq
*[_type == "category"] | order(order asc, title asc) {
  "id": _id, "slug": slug.current, title, summary,
  "image": image{ "src": coalesce(upload.asset->url, url), alt },
  tone, showOnHome, madeInHouse,
  "products": *[_type == "product" && references(^._id)] | order(order asc, title asc) {
    "slug": slug.current, title
  }
}
```

Returns `Category[]`. The site turns `tone: "auto"` into a colour by position (see
`src/lib/content/tone.ts`).

### One category with its product cards: `$slug`

```groq
*[_type == "category" && slug.current == $slug][0] {
  …category fields…,
  "productCards": *[_type == "product" && references(^._id)] | order(order asc, title asc) {
    "id": _id, "slug": slug.current, title, summary,
    "image": images[0]{ "src": coalesce(upload.asset->url, url), alt },
    "brand": brand->{ name, inHouse },
    "categorySlug": category->slug.current
  }
}
```

Returns `CategoryWithProducts`, or `null` if no category has that slug.

### One product: `$category`, `$slug`

```groq
*[_type == "product" && slug.current == $slug && category->slug.current == $category][0] {
  …card fields…,
  "category": category->{ "slug": slug.current, title, tone },
  "images": images[]{ "src": coalesce(upload.asset->url, url), alt },
  keyFeatures, description, specifications[]{ label, value }, variants, isSample,
  "related": *[_type == "product" && category._ref == ^.category._ref && _id != ^._id]
    | order(order asc, title asc) [0...3] { …card fields… }
}
```

Returns `Product`, or `null`. A product is only found under its own category, so old links break
cleanly if a product moves.

### All brands

```groq
*[_type == "brand"] | order(order asc, name asc) {
  "id": _id, "slug": slug.current, name, inHouse,
  "logo": logo{ "src": coalesce(upload.asset->url, url), alt }
}
```

Returns `Brand[]`. Filter out `inHouse: true` to get dealer brands.

### Example request

```bash
curl -G "https://PROJECT_ID.apicdn.sanity.io/v2026-10-01/data/query/production" \
  --data-urlencode 'query=*[_type == "product" && category->slug.current == $category]{ title, "slug": slug.current }' \
  --data-urlencode '$category="safety-ppe"'
```

From JavaScript, the official [`@sanity/client`](https://www.npmjs.com/package/@sanity/client)
wraps the same API. The site uses plain `fetch` instead (see `src/lib/content/sanity.ts`), to keep
the bundle small.

---

## Checking queries locally

`npm run test:queries` runs every site query against `sanity/seed.ndjson` with Sanity's own GROQ
engine and checks the result shapes. Run it after changing a query or a schema. It needs the
Studio's dependencies (`npm ci --prefix studio`).

## Limits to know about

- The free plan has hard caps on documents, API requests, bandwidth and seats. When a cap is hit,
  that function stops until the next month; there are no surprise bills. Check the current numbers
  at [sanity.io/pricing](https://www.sanity.io/pricing).
- A **public** dataset can be read by anyone with the project ID. That is fine for a catalogue, but
  never store private data (prices for specific customers, contacts) in it.
- Writes need an authenticated editor or an API token with write access. Never put a write token in
  the website's code.
