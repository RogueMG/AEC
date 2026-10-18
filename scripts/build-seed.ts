// Builds sanity/seed.ndjson from the starter catalogue in src/data/catalogue.ts.
// Run with: npm run seed:build   (then import with: npm run seed --prefix studio)
// Images are imported as links to the live GitHub Pages copies, so nothing needs uploading.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { seedBrands, seedCategories, seedProducts, type SeedImage } from "../src/data/catalogue.ts";

const SITE = "https://roguemg.github.io/AEC/";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const slug = (current: string) => ({ _type: "slug", current });
const ref = (id: string) => ({ _type: "reference", _ref: id });
const image = (img: SeedImage, key?: string) => ({
  _type: "mediaImage",
  ...(key ? { _key: key } : {}),
  url: SITE + img.src,
  alt: img.alt,
});

const docs: object[] = [
  ...seedCategories.map((c) => ({
    _id: `category.${c.slug}`,
    _type: "category",
    title: c.title,
    slug: slug(c.slug),
    summary: c.summary,
    image: image(c.image),
    tone: c.tone,
    showOnHome: c.showOnHome,
    madeInHouse: c.madeInHouse,
    order: c.order,
  })),
  ...seedBrands.map((b) => ({
    _id: `brand.${b.slug}`,
    _type: "brand",
    name: b.name,
    slug: slug(b.slug),
    inHouse: b.inHouse,
    order: b.order,
  })),
  ...seedProducts.map((p) => ({
    _id: `product.${p.slug}`,
    _type: "product",
    title: p.title,
    slug: slug(p.slug),
    category: ref(`category.${p.category}`),
    ...(p.brand ? { brand: ref(`brand.${p.brand}`) } : {}),
    summary: p.summary,
    images: p.images.map((img, i) => image(img, `img${i}`)),
    keyFeatures: p.keyFeatures,
    description: p.description.map((text, i) => ({
      _type: "block",
      _key: `p${i}`,
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: `s${i}`, text, marks: [] }],
    })),
    specifications: p.specifications.map((s, i) => ({ _type: "spec", _key: `spec${i}`, ...s })),
    variants: p.variants,
    order: p.order,
    isSample: p.isSample,
  })),
];

const out = join(root, "sanity", "seed.ndjson");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, docs.map((d) => JSON.stringify(d)).join("\n") + "\n");
console.log(`Wrote ${docs.length} documents to ${out}`);
