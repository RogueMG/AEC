import type { Brand, CatalogueNode, TreeCategory } from "./types";

// Reads from the Cloudflare Functions in functions/api. Paths are root-relative because the
// site is served from the root on Cloudflare; in local dev, Vite forwards them (vite.config.ts).

async function getJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Request to ${url} failed with status ${response.status}`);
  return (await response.json()) as T;
}

export async function fetchTree(): Promise<TreeCategory[]> {
  return (await getJson<TreeCategory[]>("/api/tree")) ?? [];
}

export function fetchNode(path: string): Promise<CatalogueNode | null> {
  return getJson<CatalogueNode>(`/api/node?path=${encodeURIComponent(path)}`);
}

export async function fetchBrands(): Promise<Brand[]> {
  return (await getJson<Brand[]>("/api/brands")) ?? [];
}
