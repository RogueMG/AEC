// Checks what search engines and link previews see, against a local server running the built site
// (npm run build:local, then npm run dev:api). Usage: node scripts/test-seo.mjs [baseUrl] [siteUrlBase]
// The second URL, if given, must be a server started with --binding SITE_URL=https://aec.example
// (and a different --port/--inspector-port); it proves canonical links follow SITE_URL.
// A temporary category with a hostile title is created to prove nothing can break out of the
// page's HTML or JSON-LD; it is deleted again at the end.
import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://127.0.0.1:8788";
const siteUrlBase = process.argv[3];
const ADMIN = { "X-AEC-Admin": "1", "Content-Type": "application/json" };
let passed = 0;
const ok = (name) => {
  passed++;
  console.log(`  ok  ${name}`);
};

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
async function page(path, from = base) {
  const res = await fetch(from + path);
  const html = await res.text();
  const one = (re) => {
    const m = re.exec(html);
    return m ? decode(m[1]) : null;
  };
  return {
    status: res.status,
    headers: res.headers,
    html,
    title: one(/<title>([^<]*)<\/title>/),
    description: one(/<meta name="description" content="([^"]*)"/),
    canonical: one(/<link rel="canonical" href="([^"]*)"/),
    robots: one(/<meta name="robots" content="([^"]*)"/),
    og: Object.fromEntries([...html.matchAll(/<meta property="og:([a-z_:]+)" content="([^"]*)"/g)].map((m) => [m[1], decode(m[2])])),
    twitter: Object.fromEntries([...html.matchAll(/<meta name="twitter:([a-z_:]+)" content="([^"]*)"/g)].map((m) => [m[1], decode(m[2])])),
    jsonLd: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])),
    summary: one(/<div class="seo-summary">([\s\S]*?)<\/div>\s*<\/div>/) ?? "",
    titleCount: (html.match(/<title>/g) ?? []).length,
    descriptionCount: (html.match(/<meta name="description"/g) ?? []).length,
  };
}
const nodes = (p) => p.jsonLd.flatMap((d) => d["@graph"] ?? [d]);
const ofType = (p, type) => nodes(p).filter((n) => n["@type"] === type);

function checkCommon(name, p, { canonicalPath, title }) {
  assert.equal(p.status, 200, `${name}: status`);
  assert.equal(p.titleCount, 1, `${name}: one title`);
  assert.equal(p.descriptionCount, 1, `${name}: one description`);
  assert.equal(p.title, title, `${name}: title`);
  assert.ok(p.description && p.description.length >= 50 && p.description.length <= 160, `${name}: description length ${p.description?.length}`);
  assert.equal(p.canonical, `${base}${canonicalPath}`, `${name}: canonical`);
  assert.equal(p.robots, null, `${name}: indexable`);
  for (const key of ["site_name", "type", "title", "description", "url", "image", "image:alt", "locale"]) assert.ok(p.og[key], `${name}: og:${key}`);
  assert.equal(p.og.url, p.canonical, `${name}: og:url = canonical`);
  assert.equal(p.og.title, p.title, `${name}: og:title`);
  assert.ok(p.og.image.startsWith("http"), `${name}: og:image absolute`);
  assert.equal(p.twitter.card, "summary_large_image", `${name}: twitter card`);
  assert.ok(ofType(p, "Organization").length === 1, `${name}: Organization`);
  assert.ok(/<h1>/.test(p.summary), `${name}: summary has a heading`);
  assert.ok(!p.headers.get("x-robots-tag"), `${name}: no X-Robots-Tag`);
}

const tree = await (await fetch(`${base}/api/tree`)).json();
const firstCategory = tree[0];
const productLink = tree.flatMap((c) => c.products)[0];
const productNode = await (await fetch(`${base}/api/node?path=${productLink.path}`)).json();
let temp = null;

try {
  console.log("Home");
  const home = await page("/");
  checkCommon("home", home, { canonicalPath: "/", title: "Asiatic Engineering Co. | Industrial products and supply, Chennai" });
  assert.equal(ofType(home, "WebSite").length, 1);
  const shops = ofType(home, "LocalBusiness");
  assert.equal(shops.length, 2);
  for (const shop of shops) {
    for (const key of ["streetAddress", "addressLocality", "addressRegion", "postalCode", "addressCountry"]) assert.ok(shop.address[key], `${shop.name}: ${key}`);
    assert.ok(shop.telephone && shop.name && shop.parentOrganization["@id"]);
  }
  assert.deepEqual(shops.map((s) => s.address.postalCode).sort(), ["600001", "602105"]);
  const org = ofType(home, "Organization")[0];
  assert.equal(org.address.postalCode, "600001", "company address is the head office");
  assert.equal(org.address.addressCountry, "IN");
  assert.ok(org.image?.startsWith("http"), "company image is an absolute URL");
  ok("title, description, canonical, Open Graph, Twitter");
  ok("JSON-LD: Organization (with head-office address and image), WebSite, LocalBusiness ×2 with full addresses");
  assert.ok(tree.every((c) => home.summary.includes(`href="/products/${c.path}"`)));
  assert.ok(home.summary.includes("tel:+919840047672"));
  ok("summary links every top-level category and the phone number");

  console.log("All products");
  const index = await page("/products");
  checkCommon("products", index, { canonicalPath: "/products", title: "Products | Asiatic Engineering Co." });
  assert.deepEqual(ofType(index, "BreadcrumbList")[0].itemListElement.map((i) => i.name), ["Home", "Products"]);
  ok("tags, breadcrumbs, summary");

  console.log("Category");
  const cat = await page(`/products/${firstCategory.path}`);
  checkCommon("category", cat, { canonicalPath: `/products/${firstCategory.path}`, title: `${firstCategory.title} | Asiatic Engineering Co.` });
  const catCrumbs = ofType(cat, "BreadcrumbList")[0].itemListElement;
  assert.deepEqual(catCrumbs.map((i) => i.position), [1, 2, 3]);
  assert.equal(catCrumbs.at(-1).item, cat.canonical);
  assert.ok(firstCategory.products.every((p) => cat.summary.includes(`href="/products/${p.path}"`)));
  ok("tags, breadcrumbs ending at the page, summary links its products");

  console.log("Product");
  const prod = await page(`/products/${productLink.path}`);
  checkCommon("product", prod, { canonicalPath: `/products/${productLink.path}`, title: `${productNode.title} | Asiatic Engineering Co.` });
  assert.equal(prod.og.type, "product");
  const prodCrumbs = ofType(prod, "BreadcrumbList")[0].itemListElement;
  assert.equal(prodCrumbs.length, 2 + productNode.breadcrumb.length + 1);
  assert.equal(prodCrumbs.at(-1).name, productNode.title);
  assert.equal(ofType(prod, "Product").length, 0, "no Product markup without prices");
  if (productNode.image) assert.equal(prod.og.image, new URL(productNode.image.src, base + "/").href);
  for (const feature of productNode.keyFeatures) assert.ok(prod.summary.includes(feature.replace(/&/g, "&amp;")), feature);
  ok("tags, og:type product, product image, breadcrumbs, key features in summary");

  console.log("Not found");
  for (const path of ["/products/no-such-thing", `/products/${firstCategory.path}/no-such-thing`, "/no-such-page", "/products/Bad%20Path", "/products/%E0%A4%A"]) {
    const p = await page(path);
    assert.equal(p.status, 404, path);
    assert.equal(p.robots, "noindex", path);
    assert.equal(p.canonical, null, path);
    assert.equal(p.headers.get("x-robots-tag"), "noindex", path);
    assert.equal(p.title, "Page not found | Asiatic Engineering Co.", path);
    assert.ok(p.html.includes('<div id="root">'), `${path}: the app still loads`);
  }
  ok("unknown paths (incl. bad characters) → 404, noindex, no canonical, app still loads");
  const slash = await page(`/products/${firstCategory.path}/`);
  assert.equal(slash.status, 200);
  assert.equal(slash.canonical, `${base}/products/${firstCategory.path}`);
  const query = await page(`/products/${firstCategory.path}?utm_source=x`);
  assert.equal(query.canonical, `${base}/products/${firstCategory.path}`);
  ok("trailing slash and query strings point to the same canonical address");

  console.log("Initial data (saves the app a request on first load)");
  const initial = (p) => JSON.parse(p.html.split('<script type="application/json" id="aec-initial-data">')[1].split("</script>")[0]);
  assert.deepEqual(Object.keys(initial(home)).sort(), ["brands", "tree"]);
  assert.deepEqual(initial(home).tree, tree, "home: same tree as /api/tree");
  assert.deepEqual(Object.keys(initial(index)), ["tree"]);
  assert.deepEqual(initial(prod)[`node:${productLink.path}`], productNode, "product: same as /api/node");
  assert.equal(initial(cat)[`node:${firstCategory.path}`].title, firstCategory.title);
  assert.deepEqual(initial(slash), { [`node:${firstCategory.path}`]: initial(cat)[`node:${firstCategory.path}`] }, "trailing slash uses the app's key");
  assert.deepEqual(initial(await page("/products/no-such-thing")), { "node:no-such-thing": null });
  assert.deepEqual(initial(await page("/no-such-page")), {});
  ok("each page carries exactly the data the app asks for first, keyed the same way");

  console.log("Admin, API, files");
  const admin = await fetch(`${base}/admin`);
  assert.equal(admin.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.ok(!(await admin.text()).includes('rel="canonical"'));
  ok("admin: noindex header, no SEO tags added");
  const api = await fetch(`${base}/api/tree`);
  assert.match(api.headers.get("content-type"), /application\/json/);
  const img = await fetch(`${base}/images/og-image.jpg`);
  assert.equal(img.status, 200);
  assert.match(img.headers.get("content-type"), /image\/jpeg/);
  ok("API and static files are untouched");

  console.log("Sitemap and robots");
  const robots = await (await fetch(`${base}/robots.txt`)).text();
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Disallow: \/admin$/m);
  assert.match(robots, /^Disallow: \/api\/$/m);
  assert.match(robots, new RegExp(`^Sitemap: ${base.replace(/\./g, "\\.")}/sitemap\\.xml$`, "m"));
  ok("robots.txt blocks /admin and /api and names the sitemap");
  const sitemapRes = await fetch(`${base}/sitemap.xml`);
  assert.match(sitemapRes.headers.get("content-type"), /xml/);
  const sitemap = await sitemapRes.text();
  assert.ok(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  const countNodes = (cats) => cats.reduce((n, c) => n + 1 + c.products.length + countNodes(c.children), 0);
  assert.equal(locs.length, 2 + countNodes(tree), "home + products + every category and product");
  assert.equal(new Set(locs).size, locs.length, "no duplicates");
  assert.ok(lastmods.length === locs.length && lastmods.every((d) => /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(d)));
  for (const loc of locs) {
    const p = await page(loc.slice(base.length));
    assert.equal(p.status, 200, loc);
    assert.equal(p.canonical, loc, `${loc}: canonical matches`);
  }
  ok(`sitemap: ${locs.length} addresses, all 200, each its own canonical, valid dates`);

  console.log("Escaping");
  const hostile = `Zz SEO Test </title><script>alert(1)</script> & "quotes" 'single' </script>`;
  const created = await fetch(`${base}/api/admin/categories`, { method: "POST", headers: ADMIN, body: JSON.stringify({ title: hostile, slug: "zz-seo-test", parentId: null, summary: `Summary with <b>tags</b> & "quotes"` }) });
  temp = await created.json();
  assert.equal(created.status, 201, JSON.stringify(temp));
  const evil = await page("/products/zz-seo-test");
  assert.equal(evil.status, 200);
  assert.equal(evil.title, `${hostile} | Asiatic Engineering Co.`, "title shows the text exactly");
  assert.ok(!/<script>alert/.test(evil.html), "no injected script tag");
  assert.equal(evil.titleCount, 1);
  assert.equal(evil.jsonLd.length, 1, "JSON-LD still parses");
  assert.equal(ofType(evil, "BreadcrumbList")[0].itemListElement.at(-1).name, hostile);
  assert.ok(!/<\/script>[^<]*'single'/.test(evil.html.split('application/ld+json">')[1].split("</script>")[0]));
  // Checked in the raw HTML: page() decodes entities in the fields it extracts.
  assert.ok(evil.html.includes("Summary with &lt;b&gt;tags&lt;/b&gt; &amp; &quot;quotes&quot;"), "summary text escaped");
  const rawData = evil.html.split('<script type="application/json" id="aec-initial-data">')[1].split("</script>")[0];
  assert.ok(!rawData.includes("<"), "no raw < inside the initial-data block");
  assert.equal(JSON.parse(rawData)["node:zz-seo-test"].title, hostile, "initial data round-trips exactly");
  ok("hostile category title and summary can't break the HTML, the JSON-LD or the initial data");

  if (siteUrlBase) {
    console.log("SITE_URL");
    const p = await page(`/products/${firstCategory.path}`, siteUrlBase);
    assert.equal(p.canonical, `https://aec.example/products/${firstCategory.path}`);
    assert.ok(p.og.image.startsWith("https://aec.example/"));
    const sm = await (await fetch(`${siteUrlBase}/sitemap.xml`)).text();
    assert.ok([...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].every((m) => m[1].startsWith("https://aec.example/")));
    assert.match(await (await fetch(`${siteUrlBase}/robots.txt`)).text(), /Sitemap: https:\/\/aec\.example\/sitemap\.xml/);
    ok("canonical, images, sitemap and robots all use SITE_URL");
  } else console.log("  --  skipped SITE_URL check (no second server URL given)");
} finally {
  if (temp?.id) {
    const res = await fetch(`${base}/api/admin/categories/${temp.id}`, { method: "DELETE", headers: ADMIN });
    console.log(`\nDeleted the temporary category (${res.status}).`);
  }
}
console.log(`${passed} checks passed.`);
