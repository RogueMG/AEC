// Read-side catalogue logic shared by the public API functions.
// The categories table is small, so it is loaded once per request and walked in memory;
// products and images are fetched with targeted prepared statements.
import type {
  Brand,
  BrandSummary,
  CategoryNode,
  CategorySummary,
  ContentImage,
  PathLink,
  ProductCard,
  ProductNode,
  Spec,
  Tone,
  TreeCategory,
} from "../src/lib/content/types";
import { resolveTone } from "../src/lib/content/tone";

export type Env = { DB: D1Database; MEDIA: R2Bucket };

type CategoryRow = {
  id: number;
  parent_id: number | null;
  slug: string;
  title: string;
  summary: string;
  image_key: string | null;
  image_url: string | null;
  image_alt: string;
  tone: string;
  show_on_home: number;
  made_in_house: number;
};

type ProductLinkRow = { id: number; category_id: number; slug: string; title: string };

type CardRow = {
  id: number;
  category_id: number;
  slug: string;
  title: string;
  summary: string;
  brand_name: string | null;
  brand_in_house: number | null;
  image_key: string | null;
  image_url: string | null;
  image_alt: string | null;
};

// Uploaded files are served by /media/<key>; linked images are used as given.
export function toImage(key: string | null, url: string | null, alt: string | null): ContentImage | null {
  if (key) return { src: `/media/${key}`, alt: alt ?? "" };
  if (url) return { src: url, alt: alt ?? "" };
  return null;
}

const parseList = <T>(json: string): T[] => {
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

// Everything about the category tree that's needed to resolve paths and draw tiles.
class Tree {
  readonly byId = new Map<number, CategoryRow>();
  readonly children = new Map<number | null, CategoryRow[]>();
  readonly productsByCategory = new Map<number, ProductLinkRow[]>();
  private readonly paths = new Map<number, string>();
  private readonly tones = new Map<number, Tone>();

  constructor(categories: CategoryRow[], products: ProductLinkRow[]) {
    for (const row of categories) {
      this.byId.set(row.id, row);
      const siblings = this.children.get(row.parent_id) ?? [];
      // "auto" colours cycle by position among siblings (rows arrive in display order).
      this.tones.set(row.id, resolveTone(row.tone, siblings.length));
      siblings.push(row);
      this.children.set(row.parent_id, siblings);
    }
    for (const row of products) {
      const list = this.productsByCategory.get(row.category_id) ?? [];
      list.push(row);
      this.productsByCategory.set(row.category_id, list);
    }
  }

  path(id: number): string {
    const cached = this.paths.get(id);
    if (cached !== undefined) return cached;
    const row = this.byId.get(id);
    if (!row) return "";
    const path = row.parent_id === null ? row.slug : `${this.path(row.parent_id)}/${row.slug}`;
    this.paths.set(id, path);
    return path;
  }

  tone(id: number): Tone {
    return this.tones.get(id) ?? "navy";
  }

  breadcrumb(id: number | null): PathLink[] {
    const crumbs: PathLink[] = [];
    for (let row = id === null ? undefined : this.byId.get(id); row; row = row.parent_id === null ? undefined : this.byId.get(row.parent_id)) {
      crumbs.unshift({ path: this.path(row.id), title: row.title });
    }
    return crumbs;
  }

  summary(row: CategoryRow): CategorySummary {
    const path = this.path(row.id);
    return {
      id: row.id,
      slug: row.slug,
      path,
      title: row.title,
      summary: row.summary,
      image: toImage(row.image_key, row.image_url, row.image_alt),
      tone: this.tone(row.id),
      showOnHome: row.show_on_home === 1,
      madeInHouse: row.made_in_house === 1,
      subcategories: (this.children.get(row.id) ?? []).map((c) => ({ path: this.path(c.id), title: c.title })),
      products: (this.productsByCategory.get(row.id) ?? []).map((p) => ({ path: `${path}/${p.slug}`, title: p.title })),
    };
  }

  treeNode(row: CategoryRow): TreeCategory {
    return { ...this.summary(row), children: (this.children.get(row.id) ?? []).map((c) => this.treeNode(c)) };
  }
}

async function loadTree(db: D1Database): Promise<Tree> {
  const [categories, products] = await db.batch([
    db.prepare(
      `SELECT id, parent_id, slug, title, summary, image_key, image_url, image_alt, tone, show_on_home, made_in_house
       FROM categories ORDER BY sort_order, title`,
    ),
    db.prepare(
      `SELECT id, category_id, slug, title FROM products WHERE published = 1 ORDER BY sort_order, title`,
    ),
  ]);
  return new Tree(categories.results as CategoryRow[], products.results as ProductLinkRow[]);
}

// Card fields plus the first image, for one category or a list of product ids.
const CARD_SELECT = `
  SELECT p.id, p.category_id, p.slug, p.title, p.summary,
         b.name AS brand_name, b.in_house AS brand_in_house,
         i.image_key, i.image_url, i.alt AS image_alt
  FROM products p
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN product_images i ON i.id = (
    SELECT id FROM product_images WHERE product_id = p.id ORDER BY sort_order, id LIMIT 1
  )`;

function toCard(row: CardRow, tree: Tree): ProductCard {
  return {
    id: row.id,
    slug: row.slug,
    path: `${tree.path(row.category_id)}/${row.slug}`,
    title: row.title,
    summary: row.summary,
    image: toImage(row.image_key, row.image_url, row.image_alt),
    brand: row.brand_name === null ? null : ({ name: row.brand_name, inHouse: row.brand_in_house === 1 } satisfies BrandSummary),
  };
}

export async function getTree(db: D1Database): Promise<TreeCategory[]> {
  const tree = await loadTree(db);
  return (tree.children.get(null) ?? []).map((row) => tree.treeNode(row));
}

const SLUG = /^[a-z0-9-]+$/;

// Resolves a path to a category or product, or null when nothing lives there.
export async function getNode(db: D1Database, rawPath: string): Promise<CategoryNode | ProductNode | null> {
  const segments = rawPath.split("/").filter(Boolean);
  if (segments.length === 0 || !segments.every((s) => SLUG.test(s))) return null;

  const tree = await loadTree(db);
  let current: CategoryRow | null = null;

  for (const [i, segment] of segments.entries()) {
    const next: CategoryRow | undefined = (tree.children.get(current ? current.id : null) ?? []).find((c) => c.slug === segment);
    if (next) {
      current = next;
      continue;
    }
    // Only the last segment may be a product, and products always live in a category.
    if (i !== segments.length - 1 || !current) return null;
    return getProduct(db, tree, current, segment);
  }

  if (!current) return null;
  const cards = await db
    .prepare(`${CARD_SELECT} WHERE p.category_id = ? AND p.published = 1 ORDER BY p.sort_order, p.title`)
    .bind(current.id)
    .all<CardRow>();

  return {
    ...tree.summary(current),
    kind: "category",
    breadcrumb: tree.breadcrumb(current.parent_id),
    children: (tree.children.get(current.id) ?? []).map((c) => tree.summary(c)),
    productCards: cards.results.map((row) => toCard(row, tree)),
  };
}

type ProductRow = CardRow & {
  description: string;
  key_features: string;
  specifications: string;
  variants: string;
  is_sample: number;
};

async function getProduct(db: D1Database, tree: Tree, category: CategoryRow, slug: string): Promise<ProductNode | null> {
  const product = await db
    .prepare(
      `SELECT p.id, p.category_id, p.slug, p.title, p.summary, p.description, p.key_features,
              p.specifications, p.variants, p.is_sample,
              b.name AS brand_name, b.in_house AS brand_in_house,
              NULL AS image_key, NULL AS image_url, NULL AS image_alt
       FROM products p LEFT JOIN brands b ON b.id = p.brand_id
       WHERE p.category_id = ? AND p.slug = ? AND p.published = 1`,
    )
    .bind(category.id, slug)
    .first<ProductRow>();
  if (!product) return null;

  const [images, related] = await db.batch([
    db.prepare(`SELECT image_key, image_url, alt FROM product_images WHERE product_id = ? ORDER BY sort_order, id`).bind(product.id),
    db
      .prepare(`${CARD_SELECT} WHERE p.category_id = ? AND p.id <> ? AND p.published = 1 ORDER BY p.sort_order, p.title LIMIT 3`)
      .bind(category.id, product.id),
  ]);

  const gallery = (images.results as { image_key: string | null; image_url: string | null; alt: string }[])
    .map((row) => toImage(row.image_key, row.image_url, row.alt))
    .filter((image): image is ContentImage => image !== null);

  return {
    ...toCard(product, tree),
    image: gallery[0] ?? null,
    kind: "product",
    breadcrumb: tree.breadcrumb(category.id),
    category: { path: tree.path(category.id), title: category.title, tone: tree.tone(category.id) },
    images: gallery,
    keyFeatures: parseList<string>(product.key_features),
    description: product.description,
    specifications: parseList<Spec>(product.specifications),
    variants: parseList<string>(product.variants),
    isSample: product.is_sample === 1,
    related: (related.results as CardRow[]).map((row) => toCard(row, tree)),
  };
}

export async function getBrands(db: D1Database): Promise<Brand[]> {
  const rows = await db
    .prepare(`SELECT id, slug, name, in_house, logo_key, logo_url, logo_alt FROM brands ORDER BY sort_order, name`)
    .all<{ id: number; slug: string; name: string; in_house: number; logo_key: string | null; logo_url: string | null; logo_alt: string }>();
  return rows.results.map((row) => {
    const logo = toImage(row.logo_key, row.logo_url, row.logo_alt);
    return { id: row.id, slug: row.slug, name: row.name, inHouse: row.in_house === 1, ...(logo ? { logo } : {}) };
  });
}

// JSON responses. Public catalogue data may be cached briefly, so edits show within a minute.
export function json(data: unknown, init: { status?: number; cache?: boolean } = {}): Response {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": init.cache === false ? "no-store" : "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
