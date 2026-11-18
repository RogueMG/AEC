// End-to-end checks for /api/admin/* against a local server (npm run dev:api with .dev.vars).
// Usage: node scripts/test-admin.mjs [baseUrl] [authCheckBaseUrl]
// The second URL, if given, must be a server running WITHOUT the dev bypass and with fake
// Access settings; it is used to prove unauthenticated requests are refused.
// Everything the test creates is deleted again at the end.
import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://127.0.0.1:8788";
const lockedBase = process.argv[3];
const H = { "X-AEC-Admin": "1" };
let passed = 0;

async function call(method, path, body, { headers = {}, raw = false, baseUrl = base } = {}) {
  const init = { method, headers: { ...H, ...headers } };
  if (body instanceof FormData) init.body = body;
  else if (body !== undefined) {
    init.body = raw ? body : JSON.stringify(body);
    init.headers["Content-Type"] = "application/json";
  }
  const res = await fetch(baseUrl + path, init);
  const text = await res.text();
  return { status: res.status, body: text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null };
}
const ok = (name) => { passed++; console.log(`  ok  ${name}`); };
const expectError = async (name, promise, status, match) => {
  const res = await promise;
  assert.equal(res.status, status, `${name}: status ${res.status} ${JSON.stringify(res.body)}`);
  if (match) assert.match(res.body.error, match, name);
  ok(`${name} -> ${status} "${res.body?.error ?? ""}"`);
};

const created = { categories: [], products: [], brands: [] };
const countsBefore = await (await fetch(`${base}/api/admin/tree`, { headers: H })).json();

try {
  console.log("Access");
  const me = await call("GET", "/api/admin/me");
  assert.equal(me.status, 200); ok(`signed in locally as ${me.body.email}`);
  await expectError("change without the admin header", call("POST", "/api/admin/categories", { title: "x", parentId: null }, { headers: { "X-AEC-Admin": "" } }), 403, /blocked/);
  await expectError("change from another site's Origin", call("POST", "/api/admin/categories", { title: "x", parentId: null }, { headers: { Origin: "https://evil.example" } }), 403, /blocked/);

  console.log("Categories, three levels deep");
  const top = await call("POST", "/api/admin/categories", { title: "Zz Admin Test & Co", parentId: null, tone: "teal" });
  assert.equal(top.status, 201); created.categories.push(top.body.id);
  assert.equal(top.body.slug, "zz-admin-test-and-co"); ok(`created top level, slug "${top.body.slug}"`);
  const mid = await call("POST", "/api/admin/categories", { title: "Mid", parentId: top.body.id });
  created.categories.push(mid.body.id);
  const leaf = await call("POST", "/api/admin/categories", { title: "Leaf", parentId: mid.body.id, summary: "Third level" });
  created.categories.push(leaf.body.id);
  assert.equal(leaf.body.parentId, mid.body.id); ok("created level 2 and 3");

  await expectError("move a category inside its own sub-category", call("PUT", `/api/admin/categories/${mid.body.id}`, { title: "Mid", parentId: leaf.body.id }), 409, /inside itself/);
  await expectError("duplicate sibling slug", call("POST", "/api/admin/categories", { title: "Mid", parentId: top.body.id }), 409, /already uses that slug/);
  await expectError("missing title", call("POST", "/api/admin/categories", { parentId: null }), 400, /Title is required/);
  await expectError("bad slug characters", call("POST", "/api/admin/categories", { title: "x", slug: "Bad Slug", parentId: null }), 400, /lowercase/);
  await expectError("parent that doesn't exist", call("POST", "/api/admin/categories", { title: "x", parentId: 999999 }), 404, /not found/);
  await expectError("non-JSON body", call("POST", "/api/admin/categories", "{oops", { raw: true }), 400, /JSON/);

  console.log("Uploads");
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
  const form = new FormData(); form.append("file", new Blob([png], { type: "image/png" }), "pixel.png");
  const upload = await call("POST", "/api/admin/upload", form);
  assert.equal(upload.status, 201); ok(`uploaded -> ${upload.body.key}`);
  const served = await fetch(base + upload.body.src);
  assert.equal(served.status, 200); assert.equal(served.headers.get("content-type"), "image/png"); ok("upload served from /media with its type");
  const badType = new FormData(); badType.append("file", new Blob(["<svg/>"], { type: "image/svg+xml" }), "x.svg");
  await expectError("SVG upload refused", call("POST", "/api/admin/upload", badType), 400, /WebP, JPEG, PNG or AVIF/);
  await expectError("image link that isn't https", call("POST", "/api/admin/categories", { title: "x", parentId: null, image: { url: "http://example.com/a.jpg", alt: "a" } }), 400, /https/);
  await expectError("upload key that doesn't exist", call("POST", "/api/admin/categories", { title: "x", parentId: null, image: { key: "uploads/00000000-0000-0000-0000-000000000000.webp", alt: "a" } }), 400, /not found/);

  console.log("Products");
  const brand = await call("POST", "/api/admin/brands", { name: "Zz Test Brand" });
  assert.equal(brand.status, 201); created.brands.push(brand.body.id); ok("created brand");
  const evil = `<script>alert(1)</script><p onclick="steal()">Hi <b>bold</b> <a href="javascript:alert(1)">link</a></p><img src=x onerror=alert(1)><h3 style="x">Head</h3><ul><li><i>one</i></li></ul><iframe src="//evil"></iframe><!-- c -->`;
  const product = await call("POST", "/api/admin/products", {
    title: "Deep Product", categoryId: leaf.body.id, brandId: brand.body.id, summary: "s",
    description: evil, keyFeatures: ["A", " ", "B"], specifications: [{ label: "Size", value: "L" }], variants: ["S", "M"],
    images: [{ key: upload.body.key, alt: "pixel" }, { url: "https://example.com/p.jpg", alt: "linked" }],
  });
  assert.equal(product.status, 201, JSON.stringify(product.body)); created.products.push(product.body.id);
  assert.equal(product.body.description, "<p>Hi <strong>bold</strong> link</p><h3>Head</h3><ul><li><em>one</em></li></ul>");
  ok(`description cleaned -> ${product.body.description}`);
  assert.deepEqual(product.body.keyFeatures, ["A", "B"]); ok("blank key features dropped");
  assert.equal(product.body.images.length, 2); ok("two images, upload and link");

  const pub = await (await fetch(`${base}/api/node?path=zz-admin-test-and-co/mid/leaf/deep-product`)).json();
  assert.equal(pub.kind, "product"); assert.equal(pub.images[0].src, upload.body.src); ok("product visible on the public API at its 4-level path");

  await expectError("product slug clashing with a sub-category", call("POST", "/api/admin/products", { title: "Leaf", categoryId: mid.body.id }), 409, /sub-category here already uses/);
  await expectError("category slug clashing with a product", call("POST", "/api/admin/categories", { title: "Deep Product", parentId: leaf.body.id }), 409, /product in that category/);
  await expectError("spec row missing a value", call("PUT", `/api/admin/products/${product.body.id}`, { title: "Deep Product", categoryId: leaf.body.id, specifications: [{ label: "Size", value: "" }] }), 400, /label and a value/);
  await expectError("delete a category that still has content", call("DELETE", `/api/admin/categories/${mid.body.id}`), 409, /first/);

  const updated = await call("PUT", `/api/admin/products/${product.body.id}`, {
    title: "Deep Product", categoryId: mid.body.id, published: false,
    images: [{ url: "https://example.com/p.jpg", alt: "linked" }],
  });
  assert.equal(updated.status, 200); assert.equal(updated.body.categoryId, mid.body.id); ok("moved product up a level and unpublished it");
  assert.equal((await fetch(base + upload.body.src)).status, 404); ok("removed upload deleted from storage");
  assert.equal((await fetch(`${base}/api/node?path=zz-admin-test-and-co/mid/deep-product`)).status, 404); ok("unpublished product hidden from the public API");

  console.log("Reordering");
  const tree = (await call("GET", "/api/admin/tree")).body;
  const topIds = tree.categories.filter((c) => c.parentId === null).map((c) => c.id);
  const moved = [top.body.id, ...topIds.filter((x) => x !== top.body.id)];
  assert.equal((await call("POST", "/api/admin/categories/reorder", { parentId: null, ids: moved })).status, 200);
  const after = (await call("GET", "/api/admin/tree")).body.categories.filter((c) => c.parentId === null).map((c) => c.id);
  assert.deepEqual(after, moved); ok("test category moved to the front");
  assert.equal((await call("POST", "/api/admin/categories/reorder", { parentId: null, ids: topIds })).status, 200); ok("original order restored");
  await expectError("reorder with a stale list", call("POST", "/api/admin/categories/reorder", { parentId: null, ids: topIds.slice(1) }), 409, /out of date/);
} finally {
  console.log("Cleanup");
  for (const p of created.products) await call("DELETE", `/api/admin/products/${p}`);
  for (const c of created.categories.reverse()) await call("DELETE", `/api/admin/categories/${c}`);
  for (const b of created.brands) await call("DELETE", `/api/admin/brands/${b}`);
  const countsAfter = await (await fetch(`${base}/api/admin/tree`, { headers: H })).json();
  assert.equal(countsAfter.categories.length, countsBefore.categories.length);
  assert.equal(countsAfter.products.length, countsBefore.products.length);
  ok(`back to ${countsAfter.categories.length} categories and ${countsAfter.products.length} products`);
}

if (lockedBase) {
  console.log("Locked server (no bypass, fake Access settings)");
  await expectError("no sign-in token", call("GET", "/api/admin/tree", undefined, { baseUrl: lockedBase }), 401, /Sign in required/);
  await expectError("forged token", call("GET", "/api/admin/tree", undefined, { baseUrl: lockedBase, headers: { "Cf-Access-Jwt-Assertion": "aaa.bbb.ccc" } }), 403, /Invalid or expired/);
  const fakeHeader = Buffer.from(JSON.stringify({ alg: "RS256", kid: "x" })).toString("base64url");
  const fakeBody = Buffer.from(JSON.stringify({ aud: ["abc"], email: "a@b.c", exp: 9999999999, iss: "https://x" })).toString("base64url");
  await expectError("well-formed token with an unknown key", call("GET", "/api/admin/tree", undefined, { baseUrl: lockedBase, headers: { "Cf-Access-Jwt-Assertion": `${fakeHeader}.${fakeBody}.c2ln` } }), 403, /Invalid or expired/);
  await expectError("forged cookie", call("POST", "/api/admin/categories", { title: "x", parentId: null }, { baseUrl: lockedBase, headers: { Cookie: "CF_Authorization=aaa.bbb.ccc" } }), 403, /Invalid or expired/);
  const publicOk = await fetch(`${lockedBase}/api/tree`);
  assert.equal(publicOk.status, 200); ok("public API still open on the locked server");
}

console.log(`\n${passed} checks passed`);
