// Write-side catalogue logic for /api/admin/*. Every input is validated here; the database's
// own constraints (migrations/0001_init.sql) are the second line of defence, and their errors
// are translated into plain language by friendlyError().
import type {
  AdminBrand,
  AdminCategory,
  AdminImage,
  AdminProduct,
  AdminProductItem,
  AdminTree,
  BrandInput,
  CategoryInput,
  ImageInput,
  ProductInput,
  ReorderInput,
  Tone,
  UploadResult,
} from "../src/lib/admin/types";
import type { Spec } from "../src/lib/content/types";
import type { AuthEnv } from "./auth";
import { sanitizeDescription } from "./sanitize";

export type AdminEnv = AuthEnv & { DB: D1Database; MEDIA: R2Bucket };

export class AdminInputError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409 = 400,
    readonly field?: string,
  ) {
    super(message);
  }
}

// ---------- validation helpers

const TONES: Tone[] = ["auto", "coral", "yellow", "teal", "navy"];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UPLOAD_KEY = /^uploads\/[0-9a-f-]{36}\.(webp|jpg|png|avif)$/;
const LIMITS = { title: 120, slug: 80, summary: 400, alt: 200, description: 20000, listItem: 200, list: 40 };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, LIMITS.slug)
    .replace(/-+$/, "");
}

function text(value: unknown, field: string, max: number, required = false): string {
  if (value === undefined || value === null) {
    if (required) throw new AdminInputError(`${field} is required`, 400, field);
    return "";
  }
  if (typeof value !== "string") throw new AdminInputError(`${field} must be text`, 400, field);
  const trimmed = value.trim();
  if (required && !trimmed) throw new AdminInputError(`${field} is required`, 400, field);
  if (trimmed.length > max) throw new AdminInputError(`${field} must be at most ${max} characters`, 400, field);
  return trimmed;
}

function slugFrom(value: unknown, title: string): string {
  const slug = value === undefined || value === null || value === "" ? slugify(title) : text(value, "Slug", LIMITS.slug);
  if (!SLUG.test(slug)) {
    throw new AdminInputError("Slug may only use lowercase letters, numbers and single hyphens", 400, "slug");
  }
  return slug;
}

const bool = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);

function id(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new AdminInputError(`${field} is invalid`, 400, field);
  }
  return value;
}

function stringList(value: unknown, field: string): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > LIMITS.list) throw new AdminInputError(`${field} is invalid`, 400, field);
  return value.map((item) => text(item, field, LIMITS.listItem)).filter(Boolean);
}

function specList(value: unknown): Spec[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > LIMITS.list) throw new AdminInputError("Specifications are invalid", 400, "specifications");
  return value
    .map((row) => {
      if (!row || typeof row !== "object") throw new AdminInputError("Specifications are invalid", 400, "specifications");
      const { label, value: v } = row as Record<string, unknown>;
      return { label: text(label, "Specification label", LIMITS.listItem), value: text(v, "Specification value", LIMITS.listItem) };
    })
    .filter((row) => row.label || row.value)
    .map((row) => {
      if (!row.label || !row.value) throw new AdminInputError("Each specification needs a label and a value", 400, "specifications");
      return row;
    });
}

// Uploaded keys must exist in R2; links must be https, or a path to the site's own files.
async function image(env: AdminEnv, input: ImageInput | null | undefined, field: string): Promise<{ key: string | null; url: string | null; alt: string } | null> {
  if (!input) return null;
  const alt = text(input.alt, "Alt text", LIMITS.alt);
  const key = input.key ? String(input.key) : null;
  const url = input.url ? String(input.url).trim() : null;
  if (key && url) throw new AdminInputError("Use either an upload or a link, not both", 400, field);
  if (!key && !url) return null;
  if (key) {
    if (!UPLOAD_KEY.test(key) || !(await env.MEDIA.head(key))) throw new AdminInputError("Uploaded image not found; upload it again", 400, field);
    return { key, url: null, alt };
  }
  const link = url as string;
  const isHttps = /^https:\/\/[^\s]+$/i.test(link) && link.length <= 2000;
  const isSitePath = /^\/[a-z0-9/_.-]+$/i.test(link) && !link.includes("..");
  if (!isHttps && !isSitePath) throw new AdminInputError("Image links must start with https://", 400, field);
  return { key: null, url: link, alt };
}

const toAdminImage = (key: string | null, url: string | null, alt: string): AdminImage | null =>
  key ? { key, url: null, alt, src: `/media/${key}` } : url ? { key: null, url, alt, src: url } : null;

// ---------- database errors in plain language

export function friendlyError(error: unknown): AdminInputError | null {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("slug already used by a sub-category")) return new AdminInputError("A sub-category here already uses that slug", 409, "slug");
  if (message.includes("slug already used by a product")) return new AdminInputError("A product in that category already uses that slug", 409, "slug");
  if (message.includes("categories_sibling_slug")) return new AdminInputError("Another category here already uses that slug", 409, "slug");
  if (message.includes("products.category_id, products.slug")) return new AdminInputError("Another product in that category already uses that slug", 409, "slug");
  if (message.includes("brands.slug")) return new AdminInputError("Another brand already uses that slug", 409, "slug");
  if (message.includes("cannot be its own parent")) return new AdminInputError("A category can't be moved inside itself", 409, "parentId");
  if (message.includes("FOREIGN KEY")) return new AdminInputError("That change would leave items without a valid category", 409);
  if (message.includes("CHECK constraint")) return new AdminInputError("One of the values is not allowed", 400);
  return null;
}

// ---------- unused upload cleanup

async function cleanupUploads(env: AdminEnv, keys: (string | null)[]): Promise<void> {
  for (const key of new Set(keys.filter((k): k is string => !!k))) {
    const row = await env.DB.prepare(
      `SELECT (SELECT count(*) FROM categories WHERE image_key = ?1)
            + (SELECT count(*) FROM brands WHERE logo_key = ?1)
            + (SELECT count(*) FROM product_images WHERE image_key = ?1) AS refs`,
    )
      .bind(key)
      .first<{ refs: number }>();
    if (row && row.refs === 0) await env.MEDIA.delete(key);
  }
}

// ---------- uploads

const UPLOAD_TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/avif": "avif" };
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function uploadImage(env: AdminEnv, file: unknown): Promise<UploadResult> {
  if (!(file instanceof File)) throw new AdminInputError("Choose an image file to upload", 400, "file");
  const ext = UPLOAD_TYPES[file.type];
  if (!ext) throw new AdminInputError("Images must be WebP, JPEG, PNG or AVIF", 400, "file");
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) throw new AdminInputError("Images must be smaller than 5 MB", 400, "file");
  const key = `uploads/${crypto.randomUUID()}.${ext}`;
  await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return { key, src: `/media/${key}` };
}

// ---------- tree

type CategoryRow = {
  id: number;
  parent_id: number | null;
  slug: string;
  title: string;
  summary: string;
  image_key: string | null;
  image_url: string | null;
  image_alt: string;
  tone: Tone;
  show_on_home: number;
  made_in_house: number;
  sort_order: number;
};

const toAdminCategory = (r: CategoryRow): AdminCategory => ({
  id: r.id,
  parentId: r.parent_id,
  slug: r.slug,
  title: r.title,
  summary: r.summary,
  image: toAdminImage(r.image_key, r.image_url, r.image_alt),
  tone: r.tone,
  showOnHome: r.show_on_home === 1,
  madeInHouse: r.made_in_house === 1,
  sortOrder: r.sort_order,
});

export async function getAdminTree(env: AdminEnv): Promise<AdminTree> {
  const [categories, products] = await env.DB.batch([
    env.DB.prepare(`SELECT * FROM categories ORDER BY sort_order, title`),
    env.DB.prepare(
      `SELECT p.id, p.category_id, p.slug, p.title, p.published, p.is_sample, p.sort_order, i.image_key, i.image_url
       FROM products p
       LEFT JOIN product_images i ON i.id = (SELECT id FROM product_images WHERE product_id = p.id ORDER BY sort_order, id LIMIT 1)
       ORDER BY p.sort_order, p.title`,
    ),
  ]);
  return {
    categories: (categories.results as CategoryRow[]).map(toAdminCategory),
    products: (
      products.results as { id: number; category_id: number; slug: string; title: string; published: number; is_sample: number; sort_order: number; image_key: string | null; image_url: string | null }[]
    ).map(
      (r): AdminProductItem => ({
        id: r.id,
        categoryId: r.category_id,
        slug: r.slug,
        title: r.title,
        published: r.published === 1,
        isSample: r.is_sample === 1,
        sortOrder: r.sort_order,
        thumb: r.image_key ? `/media/${r.image_key}` : r.image_url,
      }),
    ),
  };
}

// ---------- categories

async function categoryRow(env: AdminEnv, categoryId: number): Promise<CategoryRow> {
  const row = await env.DB.prepare(`SELECT * FROM categories WHERE id = ?`).bind(categoryId).first<CategoryRow>();
  if (!row) throw new AdminInputError("Category not found", 404);
  return row;
}

export async function getCategory(env: AdminEnv, categoryId: number): Promise<AdminCategory> {
  return toAdminCategory(await categoryRow(env, categoryId));
}

async function nextSortOrder(env: AdminEnv, sql: string, value: number | null): Promise<number> {
  const row = await env.DB.prepare(sql).bind(value).first<{ max: number | null }>();
  return (row?.max ?? 0) + 10;
}

// Rejects moving a category under itself or one of its own descendants.
async function assertValidParent(env: AdminEnv, categoryId: number | null, parentId: number | null): Promise<void> {
  if (parentId === null) return;
  await categoryRow(env, parentId);
  if (categoryId === null) return;
  const { results } = await env.DB.prepare(
    `WITH RECURSIVE ancestors(id, parent_id) AS (
       SELECT id, parent_id FROM categories WHERE id = ?
       UNION ALL
       SELECT c.id, c.parent_id FROM categories c JOIN ancestors a ON c.id = a.parent_id
     ) SELECT id FROM ancestors`,
  )
    .bind(parentId)
    .all<{ id: number }>();
  if (results.some((r) => r.id === categoryId)) {
    throw new AdminInputError("A category can't be moved inside itself or one of its sub-categories", 409, "parentId");
  }
}

async function parseCategory(env: AdminEnv, input: CategoryInput, existingId: number | null) {
  if (!input || typeof input !== "object") throw new AdminInputError("Invalid request");
  const title = text(input.title, "Title", LIMITS.title, true);
  const parentId = input.parentId === null || input.parentId === undefined ? null : id(input.parentId, "Parent");
  await assertValidParent(env, existingId, parentId);
  const tone = input.tone ?? "auto";
  if (!TONES.includes(tone)) throw new AdminInputError("Tile colour is invalid", 400, "tone");
  return {
    parentId,
    title,
    slug: slugFrom(input.slug, title),
    summary: text(input.summary, "Summary", LIMITS.summary),
    image: await image(env, input.image, "image"),
    tone,
    showOnHome: bool(input.showOnHome, true),
    madeInHouse: bool(input.madeInHouse, false),
  };
}

export async function createCategory(env: AdminEnv, input: CategoryInput): Promise<AdminCategory> {
  const c = await parseCategory(env, input, null);
  const sortOrder = await nextSortOrder(env, `SELECT max(sort_order) AS max FROM categories WHERE parent_id IS ?`, c.parentId);
  const row = await env.DB.prepare(
    `INSERT INTO categories (parent_id, slug, title, summary, image_key, image_url, image_alt, tone, show_on_home, made_in_house, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
  )
    .bind(c.parentId, c.slug, c.title, c.summary, c.image?.key ?? null, c.image?.url ?? null, c.image?.alt ?? "", c.tone, c.showOnHome ? 1 : 0, c.madeInHouse ? 1 : 0, sortOrder)
    .first<CategoryRow>();
  return toAdminCategory(row as CategoryRow);
}

export async function updateCategory(env: AdminEnv, categoryId: number, input: CategoryInput): Promise<AdminCategory> {
  const before = await categoryRow(env, categoryId);
  const c = await parseCategory(env, input, categoryId);
  // Moving to a new parent puts the category at the end of its new siblings.
  const sortOrder =
    c.parentId === before.parent_id
      ? before.sort_order
      : await nextSortOrder(env, `SELECT max(sort_order) AS max FROM categories WHERE parent_id IS ?`, c.parentId);
  const row = await env.DB.prepare(
    `UPDATE categories SET parent_id = ?, slug = ?, title = ?, summary = ?, image_key = ?, image_url = ?, image_alt = ?,
       tone = ?, show_on_home = ?, made_in_house = ?, sort_order = ?, updated_at = datetime('now')
     WHERE id = ? RETURNING *`,
  )
    .bind(c.parentId, c.slug, c.title, c.summary, c.image?.key ?? null, c.image?.url ?? null, c.image?.alt ?? "", c.tone, c.showOnHome ? 1 : 0, c.madeInHouse ? 1 : 0, sortOrder, categoryId)
    .first<CategoryRow>();
  if (before.image_key !== (c.image?.key ?? null)) await cleanupUploads(env, [before.image_key]);
  return toAdminCategory(row as CategoryRow);
}

export async function deleteCategory(env: AdminEnv, categoryId: number): Promise<void> {
  const before = await categoryRow(env, categoryId);
  const counts = await env.DB.prepare(
    `SELECT (SELECT count(*) FROM categories WHERE parent_id = ?1) AS children, (SELECT count(*) FROM products WHERE category_id = ?1) AS products`,
  )
    .bind(categoryId)
    .first<{ children: number; products: number }>();
  if (counts && (counts.children > 0 || counts.products > 0)) {
    throw new AdminInputError("Move or delete this category's sub-categories and products first", 409);
  }
  await env.DB.prepare(`DELETE FROM categories WHERE id = ?`).bind(categoryId).run();
  await cleanupUploads(env, [before.image_key]);
}

// ---------- products

type ProductRow = {
  id: number;
  category_id: number;
  brand_id: number | null;
  slug: string;
  title: string;
  summary: string;
  description: string;
  key_features: string;
  specifications: string;
  variants: string;
  is_sample: number;
  published: number;
  sort_order: number;
};

const parseJson = <T>(value: string): T[] => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export async function getProduct(env: AdminEnv, productId: number): Promise<AdminProduct> {
  const row = await env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(productId).first<ProductRow>();
  if (!row) throw new AdminInputError("Product not found", 404);
  const images = await env.DB.prepare(`SELECT image_key, image_url, alt FROM product_images WHERE product_id = ? ORDER BY sort_order, id`)
    .bind(productId)
    .all<{ image_key: string | null; image_url: string | null; alt: string }>();
  return {
    id: row.id,
    categoryId: row.category_id,
    brandId: row.brand_id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    keyFeatures: parseJson<string>(row.key_features),
    specifications: parseJson<Spec>(row.specifications),
    variants: parseJson<string>(row.variants),
    isSample: row.is_sample === 1,
    published: row.published === 1,
    sortOrder: row.sort_order,
    images: images.results.map((i) => toAdminImage(i.image_key, i.image_url, i.alt)).filter((i): i is AdminImage => i !== null),
  };
}

async function parseProduct(env: AdminEnv, input: ProductInput) {
  if (!input || typeof input !== "object") throw new AdminInputError("Invalid request");
  const title = text(input.title, "Title", LIMITS.title, true);
  const categoryId = id(input.categoryId, "Category");
  await categoryRow(env, categoryId);
  const brandId = input.brandId === null || input.brandId === undefined ? null : id(input.brandId, "Brand");
  if (brandId !== null && !(await env.DB.prepare(`SELECT 1 FROM brands WHERE id = ?`).bind(brandId).first())) {
    throw new AdminInputError("Brand not found", 400, "brandId");
  }
  const rawImages = input.images ?? [];
  if (!Array.isArray(rawImages) || rawImages.length > 20) throw new AdminInputError("Up to 20 images per product", 400, "images");
  const images = [];
  for (const [i, raw] of rawImages.entries()) {
    const parsed = await image(env, raw, `images.${i}`);
    if (parsed) images.push(parsed);
  }
  const description = text(input.description, "Description", LIMITS.description);
  return {
    categoryId,
    brandId,
    title,
    slug: slugFrom(input.slug, title),
    summary: text(input.summary, "Summary", LIMITS.summary),
    description: description ? await sanitizeDescription(description) : "",
    keyFeatures: stringList(input.keyFeatures, "Key features"),
    specifications: specList(input.specifications),
    variants: stringList(input.variants, "Sizes / variants"),
    isSample: bool(input.isSample, false),
    published: bool(input.published, true),
    images,
  };
}

function imageInserts(env: AdminEnv, productId: number, images: { key: string | null; url: string | null; alt: string }[]) {
  return images.map((img, i) =>
    env.DB.prepare(`INSERT INTO product_images (product_id, image_key, image_url, alt, sort_order) VALUES (?, ?, ?, ?, ?)`).bind(
      productId,
      img.key,
      img.url,
      img.alt,
      (i + 1) * 10,
    ),
  );
}

export async function createProduct(env: AdminEnv, input: ProductInput): Promise<AdminProduct> {
  const p = await parseProduct(env, input);
  const sortOrder = await nextSortOrder(env, `SELECT max(sort_order) AS max FROM products WHERE category_id = ?`, p.categoryId);
  const row = await env.DB.prepare(
    `INSERT INTO products (category_id, brand_id, slug, title, summary, description, key_features, specifications, variants, is_sample, published, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
  )
    .bind(p.categoryId, p.brandId, p.slug, p.title, p.summary, p.description, JSON.stringify(p.keyFeatures), JSON.stringify(p.specifications), JSON.stringify(p.variants), p.isSample ? 1 : 0, p.published ? 1 : 0, sortOrder)
    .first<{ id: number }>();
  const productId = (row as { id: number }).id;
  if (p.images.length) await env.DB.batch(imageInserts(env, productId, p.images));
  return getProduct(env, productId);
}

export async function updateProduct(env: AdminEnv, productId: number, input: ProductInput): Promise<AdminProduct> {
  const before = await getProduct(env, productId);
  const p = await parseProduct(env, input);
  const sortOrder =
    p.categoryId === before.categoryId
      ? before.sortOrder
      : await nextSortOrder(env, `SELECT max(sort_order) AS max FROM products WHERE category_id = ?`, p.categoryId);
  // One transaction: the product row and its full image list are replaced together.
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE products SET category_id = ?, brand_id = ?, slug = ?, title = ?, summary = ?, description = ?, key_features = ?,
         specifications = ?, variants = ?, is_sample = ?, published = ?, sort_order = ?, updated_at = datetime('now')
       WHERE id = ?`,
    ).bind(p.categoryId, p.brandId, p.slug, p.title, p.summary, p.description, JSON.stringify(p.keyFeatures), JSON.stringify(p.specifications), JSON.stringify(p.variants), p.isSample ? 1 : 0, p.published ? 1 : 0, sortOrder, productId),
    env.DB.prepare(`DELETE FROM product_images WHERE product_id = ?`).bind(productId),
    ...imageInserts(env, productId, p.images),
  ]);
  const kept = new Set(p.images.map((i) => i.key));
  await cleanupUploads(env, before.images.map((i) => i.key).filter((key) => !kept.has(key)));
  return getProduct(env, productId);
}

export async function deleteProduct(env: AdminEnv, productId: number): Promise<void> {
  const before = await getProduct(env, productId);
  await env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(productId).run();
  await cleanupUploads(env, before.images.map((i) => i.key));
}

// ---------- brands

type BrandRow = { id: number; slug: string; name: string; in_house: number; logo_key: string | null; logo_url: string | null; logo_alt: string; sort_order: number };

const toAdminBrand = (r: BrandRow): AdminBrand => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  inHouse: r.in_house === 1,
  logo: toAdminImage(r.logo_key, r.logo_url, r.logo_alt),
  sortOrder: r.sort_order,
});

export async function listBrands(env: AdminEnv): Promise<AdminBrand[]> {
  const { results } = await env.DB.prepare(`SELECT * FROM brands ORDER BY sort_order, name`).all<BrandRow>();
  return results.map(toAdminBrand);
}

async function brandRow(env: AdminEnv, brandId: number): Promise<BrandRow> {
  const row = await env.DB.prepare(`SELECT * FROM brands WHERE id = ?`).bind(brandId).first<BrandRow>();
  if (!row) throw new AdminInputError("Brand not found", 404);
  return row;
}

async function parseBrand(env: AdminEnv, input: BrandInput) {
  if (!input || typeof input !== "object") throw new AdminInputError("Invalid request");
  const name = text(input.name, "Name", LIMITS.title, true);
  return { name, slug: slugFrom(input.slug, name), inHouse: bool(input.inHouse, false), logo: await image(env, input.logo, "logo") };
}

export async function createBrand(env: AdminEnv, input: BrandInput): Promise<AdminBrand> {
  const b = await parseBrand(env, input);
  const sortOrder = await nextSortOrder(env, `SELECT max(sort_order) AS max FROM brands WHERE ? IS NULL`, null);
  const row = await env.DB.prepare(
    `INSERT INTO brands (slug, name, in_house, logo_key, logo_url, logo_alt, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
  )
    .bind(b.slug, b.name, b.inHouse ? 1 : 0, b.logo?.key ?? null, b.logo?.url ?? null, b.logo?.alt ?? "", sortOrder)
    .first<BrandRow>();
  return toAdminBrand(row as BrandRow);
}

export async function updateBrand(env: AdminEnv, brandId: number, input: BrandInput): Promise<AdminBrand> {
  const before = await brandRow(env, brandId);
  const b = await parseBrand(env, input);
  const row = await env.DB.prepare(
    `UPDATE brands SET slug = ?, name = ?, in_house = ?, logo_key = ?, logo_url = ?, logo_alt = ?, updated_at = datetime('now')
     WHERE id = ? RETURNING *`,
  )
    .bind(b.slug, b.name, b.inHouse ? 1 : 0, b.logo?.key ?? null, b.logo?.url ?? null, b.logo?.alt ?? "", brandId)
    .first<BrandRow>();
  if (before.logo_key !== (b.logo?.key ?? null)) await cleanupUploads(env, [before.logo_key]);
  return toAdminBrand(row as BrandRow);
}

/** Products keep existing; their brand is cleared (ON DELETE SET NULL). */
export async function deleteBrand(env: AdminEnv, brandId: number): Promise<void> {
  const before = await brandRow(env, brandId);
  await env.DB.prepare(`DELETE FROM brands WHERE id = ?`).bind(brandId).run();
  await cleanupUploads(env, [before.logo_key]);
}

// ---------- reordering: `ids` is the complete sibling list in its new order

async function reorder(env: AdminEnv, table: "categories" | "products" | "brands", input: ReorderInput, scope: string) {
  if (!input || !Array.isArray(input.ids) || input.ids.length === 0) throw new AdminInputError("Nothing to reorder");
  const ids = input.ids.map((v) => id(v, "Item"));
  if (new Set(ids).size !== ids.length) throw new AdminInputError("Each item may appear only once");
  const parent = input.parentId === null || input.parentId === undefined ? null : id(input.parentId, "Parent");
  const { results } = await env.DB.prepare(`SELECT id FROM ${table} WHERE ${scope}`).bind(...(table === "brands" ? [] : [parent])).all<{ id: number }>();
  const siblings = new Set(results.map((r) => r.id));
  if (siblings.size !== ids.length || ids.some((v) => !siblings.has(v))) {
    throw new AdminInputError("The list is out of date; reload and try again", 409);
  }
  await env.DB.batch(ids.map((itemId, i) => env.DB.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`).bind((i + 1) * 10, itemId)));
}

export const reorderCategories = (env: AdminEnv, input: ReorderInput) => reorder(env, "categories", input, "parent_id IS ?");
export const reorderProducts = (env: AdminEnv, input: ReorderInput) => reorder(env, "products", input, "category_id IS ?");
export const reorderBrands = (env: AdminEnv, input: ReorderInput) => reorder(env, "brands", input, "1 = 1");
