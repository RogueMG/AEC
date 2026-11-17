// Search-engine and link-preview information for each public page. The site is a single-page
// app, so functions/_middleware.ts uses this to fill in the shared index.html before it's sent:
// the title, description, canonical URL, Open Graph/Twitter tags, JSON-LD structured data, and a
// plain-text summary of the page for crawlers that don't run JavaScript (React replaces it).
import { company, contact, locations } from "../src/data/site";
import type { CategoryNode, ContentImage, PathLink, ProductNode, TreeCategory } from "../src/lib/content/types";
import { imageSizes, variantSrcSet } from "../src/lib/imageVariants";
import { getNode, getTree } from "./catalogue";

export type SeoEnv = {
  DB: D1Database;
  /** The site's public address without a trailing slash, e.g. https://asiatic-engineering.pages.dev. */
  SITE_URL?: string;
};

export type PageSeo = {
  status: 200 | 404;
  title: string;
  description: string;
  /** Path for the canonical URL; null on pages that shouldn't be indexed. */
  canonicalPath: string | null;
  noindex: boolean;
  image: { src: string; alt: string };
  ogType: "website" | "product";
  jsonLd: Record<string, unknown>[];
  /** HTML placed inside #root until the app takes over. */
  summary: string;
  /** The page's main photo, so the browser starts fetching it before the app has rendered. */
  preload?: Preload;
};

export type Preload = { href: string; srcset?: string; sizes?: string };
const preloadFor = (src: string | undefined, sizes: string): Preload | undefined =>
  src ? { href: src, srcset: variantSrcSet(src), sizes: variantSrcSet(src) ? sizes : undefined } : undefined;

export const SITE_NAME = company.name;
export const DEFAULT_TITLE = `${company.name} | Industrial products and supply, Chennai`;
export const DEFAULT_DESCRIPTION =
  "Asiatic Engineering Co. makes knitted industrial gloves and PPE and supplies tools, consumables and MRO products to manufacturers in South India. Since 1999.";
const PRODUCTS_DESCRIPTION =
  "Industrial gloves and PPE from our own factory, plus tools, consumables and MRO supplies from Asiatic Engineering Co., Chennai.";
const DEFAULT_IMAGE = { src: "/images/og-image.jpg", alt: "Asiatic Engineering Co.: industrial products and supply, Chennai" };

// ---------- helpers

export const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function siteUrl(env: SeoEnv, requestUrl: URL): string {
  return (env.SITE_URL || requestUrl.origin).replace(/\/+$/, "");
}

/** Absolute URL for an image or page path ("/media/x", "images/x.jpg" or a full URL). */
export function absolute(base: string, src: string): string {
  if (/^https?:\/\//i.test(src)) return src;
  return `${base}/${src.replace(/^\/+/, "")}`;
}

const pageTitle = (title: string) => `${title} | ${SITE_NAME}`;

/** One line of plain text, at most `max` characters, cut at a word. */
function clip(text: string, max = 160): string {
  const plain = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).replace(/[\s,;:.]+$/, "")}…`;
}

const link = (href: string, text: string) => `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;
const list = (items: string[]) => (items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>` : "");
const productHref = (path: string) => `/products/${path}`;
const summaryTrail = (trail: PathLink[]) =>
  `<p>${[link("/", "Home"), link("/products", "Products"), ...trail.map((c) => link(productHref(c.path), c.title))].join(" › ")}</p>`;

// ---------- structured data

const ORG_ID = "#organization";

function organization(base: string) {
  return {
    "@type": "Organization",
    "@id": `${base}/${ORG_ID}`,
    name: company.name,
    alternateName: company.shortName,
    url: `${base}/`,
    logo: `${base}/images/logo-mark.png`,
    foundingDate: String(company.established),
    email: contact.email.label,
    telephone: "+91-98400-47672",
    taxID: company.gst,
    contactPoint: [
      { "@type": "ContactPoint", telephone: "+91-98400-47672", contactType: "sales", areaServed: "IN" },
    ],
  };
}

function website(base: string) {
  return { "@type": "WebSite", "@id": `${base}/#website`, url: `${base}/`, name: company.name, alternateName: company.shortName, publisher: { "@id": `${base}/${ORG_ID}` } };
}

function localBusinesses(base: string) {
  return locations.map((location) => ({
    "@type": "LocalBusiness",
    "@id": `${base}/#${location.id}`,
    name: `${company.name}, ${location.name}`,
    url: `${base}/`,
    image: `${base}${DEFAULT_IMAGE.src}`,
    logo: `${base}/images/logo-mark.png`,
    // The main mobile line: which location the landline belongs to isn't confirmed yet.
    telephone: "+91-98400-47672",
    email: contact.email.label,
    address: {
      "@type": "PostalAddress",
      streetAddress: location.postal.street,
      addressLocality: location.postal.locality,
      addressRegion: location.postal.region,
      postalCode: location.postal.postalCode,
      addressCountry: "IN",
    },
    hasMap: location.mapsHref,
    parentOrganization: { "@id": `${base}/${ORG_ID}` },
  }));
}

function breadcrumbList(base: string, items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: `${base}${item.path}` })),
  };
}

const crumbs = (trail: PathLink[], self?: { name: string; path: string }) => [
  { name: "Home", path: "/" },
  { name: "Products", path: "/products" },
  ...trail.map((c) => ({ name: c.title, path: productHref(c.path) })),
  ...(self ? [self] : []),
];

const graph = (...nodes: Record<string, unknown>[]) => [{ "@context": "https://schema.org", "@graph": nodes }];

// ---------- pages

function home(base: string, tree: TreeCategory[]): PageSeo {
  const categories = tree.map((c) => `${link(productHref(c.path), c.title)}${c.summary ? `: ${escapeHtml(c.summary)}` : ""}`);
  return {
    status: 200,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonicalPath: "/",
    noindex: false,
    image: DEFAULT_IMAGE,
    ogType: "website",
    jsonLd: graph(organization(base), website(base), ...localBusinesses(base)),
    preload: preloadFor("/images/hero-sparks.webp", imageSizes.half),
    summary: [
      `<h1>${escapeHtml(company.name)}</h1>`,
      `<p>${escapeHtml(DEFAULT_DESCRIPTION)}</p>`,
      `<h2>Products</h2>`,
      list(categories),
      `<h2>Contact</h2>`,
      `<p>Mobile and WhatsApp ${link(contact.mobile.href, contact.mobile.label)} · Landline ${link(contact.landline.href, contact.landline.label)} · Email ${link(contact.email.href, contact.email.label)}</p>`,
      list(locations.map((l) => `${escapeHtml(l.name)}: ${escapeHtml(l.address)}`)),
    ].join(""),
  };
}

function productsIndex(base: string, tree: TreeCategory[]): PageSeo {
  const items = tree.map((c) => {
    const subs = c.children.map((s) => link(productHref(s.path), s.title));
    return `${link(productHref(c.path), c.title)}${c.summary ? `: ${escapeHtml(c.summary)}` : ""}${list(subs)}`;
  });
  return {
    status: 200,
    title: pageTitle("Products"),
    description: PRODUCTS_DESCRIPTION,
    canonicalPath: "/products",
    noindex: false,
    image: DEFAULT_IMAGE,
    ogType: "website",
    jsonLd: graph(organization(base), breadcrumbList(base, [{ name: "Home", path: "/" }, { name: "Products", path: "/products" }])),
    summary: `<h1>Products</h1><p>${escapeHtml(PRODUCTS_DESCRIPTION)}</p>${list(items)}`,
  };
}

const imageOr = (image: ContentImage | null, fallbackAlt: string) => (image ? { src: image.src, alt: image.alt || fallbackAlt } : DEFAULT_IMAGE);

function category(base: string, node: CategoryNode): PageSeo {
  const path = productHref(node.path);
  const description = clip(node.summary || `${node.title} from ${company.name}, Chennai: ${PRODUCTS_DESCRIPTION}`);
  return {
    status: 200,
    title: pageTitle(node.title),
    description,
    canonicalPath: path,
    noindex: false,
    image: imageOr(node.image, node.title),
    ogType: "website",
    preload: preloadFor(node.image?.src ?? node.productCards[0]?.image?.src, node.image ? imageSizes.categoryHeader : imageSizes.tile),
    jsonLd: graph(organization(base), breadcrumbList(base, crumbs(node.breadcrumb, { name: node.title, path }))),
    summary: [
      summaryTrail(node.breadcrumb),
      `<h1>${escapeHtml(node.title)}</h1>`,
      node.summary ? `<p>${escapeHtml(node.summary)}</p>` : "",
      node.children.length ? `<h2>Ranges</h2>${list(node.children.map((c) => link(productHref(c.path), c.title)))}` : "",
      node.productCards.length
        ? `<h2>Products</h2>${list(node.productCards.map((p) => `${link(productHref(p.path), p.title)}${p.summary ? `: ${escapeHtml(p.summary)}` : ""}`))}`
        : "",
    ].join(""),
  };
}

function product(base: string, node: ProductNode): PageSeo {
  const path = productHref(node.path);
  const description = clip(node.summary || node.description || `${node.title} from ${company.name}, Chennai.`);
  return {
    status: 200,
    title: pageTitle(node.title),
    description,
    canonicalPath: path,
    noindex: false,
    image: imageOr(node.image, node.title),
    ogType: "product",
    preload: preloadFor(node.image?.src, imageSizes.half),
    // No Product markup: Google only accepts it with a price, offer or reviews, which this
    // catalogue doesn't publish. Breadcrumbs still show the page's place in the catalogue.
    jsonLd: graph(organization(base), breadcrumbList(base, crumbs(node.breadcrumb, { name: node.title, path }))),
    summary: [
      summaryTrail(node.breadcrumb),
      `<h1>${escapeHtml(node.title)}</h1>`,
      node.brand ? `<p>Brand: ${escapeHtml(node.brand.name)}</p>` : "",
      node.summary ? `<p>${escapeHtml(node.summary)}</p>` : "",
      node.keyFeatures.length ? `<h2>Key features</h2>${list(node.keyFeatures.map(escapeHtml))}` : "",
      // Already sanitised to a small allow-list of tags when it was saved (server/sanitize.ts).
      node.description,
      node.specifications.length ? `<h2>Specifications</h2>${list(node.specifications.map((s) => `${escapeHtml(s.label)}: ${escapeHtml(s.value)}`))}` : "",
      node.variants.length ? `<h2>Available in</h2>${list(node.variants.map(escapeHtml))}` : "",
      `<p>${link(contact.whatsapp.href, "Ask for a quote on WhatsApp")} · ${link(contact.email.href, "Email us")}</p>`,
    ].join(""),
  };
}

function notFound(): PageSeo {
  return {
    status: 404,
    title: pageTitle("Page not found"),
    description: DEFAULT_DESCRIPTION,
    canonicalPath: null,
    noindex: true,
    image: DEFAULT_IMAGE,
    ogType: "website",
    jsonLd: [],
    summary: `<h1>Page not found</h1><p>${link("/", "Go to the home page")} or ${link("/products", "browse all products")}.</p>`,
  };
}

/** What to put in the page at `pathname`, or null for paths this module doesn't handle (the admin). */
export async function seoForPath(env: SeoEnv, pathname: string, base: string): Promise<PageSeo | null> {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/admin" || path.startsWith("/admin/")) return null;
  if (path === "/") return home(base, await getTree(env.DB));
  if (path === "/products") return productsIndex(base, await getTree(env.DB));
  if (path.startsWith("/products/")) {
    let rest: string;
    try {
      rest = decodeURIComponent(path.slice("/products/".length));
    } catch {
      return notFound();
    }
    const node = await getNode(env.DB, rest);
    if (node?.kind === "category") return category(base, node);
    if (node?.kind === "product") return product(base, node);
  }
  return notFound();
}
