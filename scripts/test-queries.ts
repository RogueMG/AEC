// Runs the site's GROQ queries against sanity/seed.ndjson with Sanity's own GROQ engine,
// so query mistakes show up before any content is live. Run with: npm run test:queries
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import { queries } from "../src/lib/content/queries.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// groq-js ships with the Studio's dependencies.
const require = createRequire(join(root, "studio", "package.json"));
const { parse, evaluate } = (await import(pathToFileURL(require.resolve("groq-js")).href)) as typeof import("groq-js");

const dataset = readFileSync(join(root, "sanity", "seed.ndjson"), "utf8")
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));

async function run(name: keyof typeof queries, params: Record<string, string> = {}) {
  const tree = parse(queries[name], { params });
  const value = await (await evaluate(tree, { dataset, params })).get();
  return value;
}

const categories = await run("categories");
assert.equal(categories.length, 4, "four categories");
assert.deepEqual(
  categories.map((c: { position: number }) => c.position),
  [0, 1, 2, 3],
  "positions follow display order",
);
assert.equal(categories[0].products.length, 3, "Safety / PPE lists its three products");
assert.ok(categories[0].image.src.startsWith("https://"), "category image resolves to a link");

const category = await run("category", { slug: "hardware-tools" });
assert.equal(category.title, "Hardware & Tools");
assert.equal(category.productCards.length, 3);
assert.equal(category.productCards[0].categorySlug, "hardware-tools");

const product = await run("product", { category: "safety-ppe", slug: "cotton-knitted-industrial-gloves" });
assert.equal(product.title, "Cotton knitted industrial gloves");
assert.equal(product.category.slug, "safety-ppe");
assert.equal(product.category.position, 0);
assert.equal(product.brand.name, "Asiatic Engineering");
assert.equal(product.brand.inHouse, true);
assert.equal(product.images.length, 2);
assert.equal(product.specifications.length, 3);
assert.deepEqual(product.variants, ["S", "M", "L", "XL"]);
assert.equal(product.related.length, 2, "related excludes the product itself");
assert.equal(product.description[0]._type, "block");

const wrongCategory = await run("product", { category: "mro", slug: "cotton-knitted-industrial-gloves" });
assert.equal(wrongCategory, null, "a product is only found under its own category");

const brands = await run("brands");
assert.equal(brands.length, 11);
assert.equal(brands.filter((b: { inHouse: boolean }) => !b.inHouse).length, 10, "ten dealer brands");

console.log("All content queries returned the expected shapes.");
