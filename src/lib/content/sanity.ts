import { sanityConfig } from "./config";
import { queries } from "./queries";
import { resolveTone } from "./tone";
import type { Brand, Category, CategoryWithProducts, Product } from "./types";

// Read-only requests to Sanity's public CDN API.

const endpoint = `https://${sanityConfig.projectId}.apicdn.sanity.io/v${sanityConfig.apiVersion}/data/query/${sanityConfig.dataset}`;

async function query<T>(groq: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(endpoint);
  url.searchParams.set("query", groq);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(`$${key}`, JSON.stringify(value));
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Content request failed with status ${response.status}`);
  const body = (await response.json()) as { result: T };
  return body.result;
}

type Positioned<T> = Omit<T, "tone"> & { tone: string | null; position: number };

const withTone = <T extends { tone: string | null; position: number }>({ position, ...rest }: T) => ({
  ...rest,
  tone: resolveTone(rest.tone, position),
});

export async function fetchCategories(): Promise<Category[]> {
  const rows = await query<Positioned<Category>[]>(queries.categories);
  return rows.map(withTone);
}

export async function fetchCategory(slug: string): Promise<CategoryWithProducts | null> {
  const row = await query<Positioned<CategoryWithProducts> | null>(queries.category, { slug });
  return row ? withTone(row) : null;
}

type RawProduct = Omit<Product, "category"> & {
  category: Positioned<Product["category"]>;
};

export async function fetchProduct(category: string, slug: string): Promise<Product | null> {
  const row = await query<RawProduct | null>(queries.product, { category, slug });
  return row ? { ...row, category: withTone(row.category) } : null;
}

export async function fetchBrands(): Promise<Brand[]> {
  const rows = await query<(Brand & { logo: Brand["logo"] | null })[]>(queries.brands);
  // A brand without a logo comes back with an empty image object; drop it so the name shows.
  return rows.map((b) => ({ ...b, logo: b.logo?.src ? b.logo : undefined }));
}
