import type { AdminCategory, AdminProductItem, AdminTree } from "@/lib/admin/types";

// Helpers over the flat lists from /api/admin/tree.

export type Indexed = {
  tree: AdminTree;
  byId: Map<number, AdminCategory>;
  children: (parentId: number | null) => AdminCategory[];
  products: (categoryId: number) => AdminProductItem[];
  path: (categoryId: number) => string;
  /** The category and everything below it. */
  descendants: (categoryId: number) => Set<number>;
  /** All categories depth-first, for dropdowns. */
  flat: () => { category: AdminCategory; depth: number }[];
};

export function indexTree(tree: AdminTree): Indexed {
  const byId = new Map(tree.categories.map((c) => [c.id, c]));
  const kids = new Map<number | null, AdminCategory[]>();
  for (const c of tree.categories) kids.set(c.parentId, [...(kids.get(c.parentId) ?? []), c]);
  const prods = new Map<number, AdminProductItem[]>();
  for (const p of tree.products) prods.set(p.categoryId, [...(prods.get(p.categoryId) ?? []), p]);

  const children = (parentId: number | null) => kids.get(parentId) ?? [];
  const path = (id: number): string => {
    const c = byId.get(id);
    if (!c) return "";
    return c.parentId === null ? c.slug : `${path(c.parentId)}/${c.slug}`;
  };
  const descendants = (id: number) => {
    const out = new Set<number>([id]);
    const walk = (parent: number) => children(parent).forEach((c) => (out.add(c.id), walk(c.id)));
    walk(id);
    return out;
  };
  const flat = () => {
    const out: { category: AdminCategory; depth: number }[] = [];
    const walk = (parent: number | null, depth: number) =>
      children(parent).forEach((c) => {
        out.push({ category: c, depth });
        walk(c.id, depth + 1);
      });
    walk(null, 0);
    return out;
  };

  return { tree, byId, children, products: (id) => prods.get(id) ?? [], path, descendants, flat };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

export type Selection =
  | { kind: "category"; id: number }
  | { kind: "product"; id: number }
  | { kind: "new-category"; parentId: number | null }
  | { kind: "new-product"; categoryId: number };

export function parseSelection(value: string | null): Selection | null {
  const [kind, raw] = (value ?? "").split(":");
  const id = Number(raw);
  if (kind === "category" && id > 0) return { kind, id };
  if (kind === "product" && id > 0) return { kind, id };
  if (kind === "new-category") return { kind, parentId: raw === "root" || !(id > 0) ? null : id };
  if (kind === "new-product" && id > 0) return { kind, categoryId: id };
  return null;
}

export function formatSelection(s: Selection): string {
  switch (s.kind) {
    case "category":
    case "product":
      return `${s.kind}:${s.id}`;
    case "new-category":
      return `new-category:${s.parentId ?? "root"}`;
    case "new-product":
      return `new-product:${s.categoryId}`;
  }
}
