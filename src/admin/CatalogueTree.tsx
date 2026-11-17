import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight, FolderPlus, Package, PackagePlus } from "lucide-react";
import { iconButton } from "@/admin/components/styles";
import type { Indexed, Selection } from "@/admin/tree";
import type { AdminCategory, AdminProductItem } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type Props = {
  index: Indexed;
  selection: Selection | null;
  onSelect: (selection: Selection) => void;
  onMove: (kind: "category" | "product", parentId: number | null, ids: number[]) => void;
  busy: boolean;
};

const swap = (ids: number[], i: number, delta: -1 | 1) => {
  const next = [...ids];
  [next[i], next[i + delta]] = [next[i + delta], next[i]];
  return next;
};

// The whole catalogue as an expandable tree: categories (any depth) with their products.
export default function CatalogueTree({ index, selection, onSelect, onMove, busy }: Props) {
  // Expanded by default down to the selected item; the user can collapse anything.
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const isSelected = (kind: "category" | "product", id: number) => selection?.kind === kind && selection.id === id;

  const toggle = (id: number) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const moveButtons = (label: string, i: number, count: number, move: (delta: -1 | 1) => void) => (
    <>
      <button type="button" className={cn(iconButton, "size-7")} disabled={busy || i === 0} onClick={() => move(-1)} aria-label={`Move ${label} up`}>
        <ArrowUp aria-hidden />
      </button>
      <button type="button" className={cn(iconButton, "size-7")} disabled={busy || i === count - 1} onClick={() => move(1)} aria-label={`Move ${label} down`}>
        <ArrowDown aria-hidden />
      </button>
    </>
  );

  const productRow = (p: AdminProductItem, i: number, siblings: AdminProductItem[], depth: number) => (
    <li key={`p${p.id}`} role="treeitem" aria-selected={isSelected("product", p.id)}>
      <div className={cn("group flex items-center gap-2 py-1 pr-2", isSelected("product", p.id) ? "bg-signal/40" : "hover:bg-surface")} style={{ paddingLeft: `${0.75 + depth * 1.1}rem` }}>
        <span className="size-5 shrink-0" />
        <button type="button" onClick={() => onSelect({ kind: "product", id: p.id })} className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left">
          {p.thumb ? <img src={p.thumb} alt="" className="size-6 shrink-0 bg-paper object-cover" /> : <Package className="size-4 shrink-0 text-steel" aria-hidden />}
          <span className="truncate text-[0.875rem]">{p.title}</span>
          {!p.published && <span className="type-label shrink-0 bg-line px-1.5 text-[0.6875rem]">Draft</span>}
        </button>
        <span className="flex shrink-0 gap-1 opacity-60 group-hover:opacity-100 focus-within:opacity-100">
          {moveButtons(p.title, i, siblings.length, (d) => onMove("product", p.categoryId, swap(siblings.map((s) => s.id), i, d)))}
        </span>
      </div>
    </li>
  );

  const categoryRow = (c: AdminCategory, i: number, siblings: AdminCategory[], depth: number) => {
    const children = index.children(c.id);
    const products = index.products(c.id);
    const open = !collapsed.has(c.id);
    const hasContent = children.length + products.length > 0;
    return (
      <li key={`c${c.id}`} role="treeitem" aria-expanded={hasContent ? open : undefined} aria-selected={isSelected("category", c.id)}>
        <div className={cn("group flex items-center gap-2 py-1 pr-2", isSelected("category", c.id) ? "bg-signal/40" : "hover:bg-surface")} style={{ paddingLeft: `${0.75 + depth * 1.1}rem` }}>
          <button
            type="button"
            onClick={() => toggle(c.id)}
            disabled={!hasContent}
            aria-label={open ? `Collapse ${c.title}` : `Expand ${c.title}`}
            className="grid size-5 shrink-0 place-items-center disabled:invisible"
          >
            <ChevronRight className={cn("size-4 transition-transform", open && "rotate-90")} aria-hidden />
          </button>
          <button type="button" onClick={() => onSelect({ kind: "category", id: c.id })} className="min-w-0 flex-1 truncate py-1 text-left text-[0.9375rem] font-semibold">
            {c.title}
          </button>
          <span className="flex shrink-0 gap-1 opacity-60 group-hover:opacity-100 focus-within:opacity-100">
            <button type="button" className={cn(iconButton, "size-7")} onClick={() => onSelect({ kind: "new-category", parentId: c.id })} aria-label={`Add a sub-category to ${c.title}`} title="Add sub-category">
              <FolderPlus aria-hidden />
            </button>
            <button type="button" className={cn(iconButton, "size-7")} onClick={() => onSelect({ kind: "new-product", categoryId: c.id })} aria-label={`Add a product to ${c.title}`} title="Add product">
              <PackagePlus aria-hidden />
            </button>
            {moveButtons(c.title, i, siblings.length, (d) => onMove("category", c.parentId, swap(siblings.map((s) => s.id), i, d)))}
          </span>
        </div>
        {open && hasContent && (
          <ul role="group">
            {children.map((child, j) => categoryRow(child, j, children, depth + 1))}
            {products.map((p, j) => productRow(p, j, products, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const top = index.children(null);
  return (
    <ul role="tree" aria-label="Catalogue" className="py-2">
      {top.map((c, i) => categoryRow(c, i, top, 0))}
    </ul>
  );
}
