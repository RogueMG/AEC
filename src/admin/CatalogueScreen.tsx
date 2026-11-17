import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { FolderPlus } from "lucide-react";
import { adminApi } from "@/admin/api";
import CategoryForm from "@/admin/CategoryForm";
import CatalogueTree from "@/admin/CatalogueTree";
import ProductForm from "@/admin/ProductForm";
import { formatSelection, indexTree, parseSelection, type Selection } from "@/admin/tree";
import type { AdminBrand, AdminTree } from "@/lib/admin/types";

export default function CatalogueScreen() {
  const [params, setParams] = useSearchParams();
  const selection = parseSelection(params.get("edit"));
  const [tree, setTree] = useState<AdminTree | null>(null);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  // Confirmation carried over when a new item opens in its edit form.
  const [flash, setFlash] = useState<string | null>(null);
  const dirty = useRef(false);
  const onDirtyChange = useCallback((d: boolean) => {
    dirty.current = d;
  }, []);

  // Bumping `version` refetches the tree and brands.
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let alive = true;
    Promise.all([adminApi.tree(), adminApi.brands()])
      .then(([t, b]) => {
        if (!alive) return;
        setTree(t);
        setBrands(b);
        setError(null);
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [version]);

  const index = useMemo(() => (tree ? indexTree(tree) : null), [tree]);

  const select = (next: Selection | null) => {
    if (dirty.current && !window.confirm("You have unsaved changes. Leave without saving?")) return;
    dirty.current = false;
    setFlash(null);
    setParams(next ? { edit: formatSelection(next) } : {});
  };

  const move = async (kind: "category" | "product", parentId: number | null, ids: number[]) => {
    setMoving(true);
    try {
      if (kind === "category") await adminApi.reorderCategories({ parentId, ids });
      else await adminApi.reorderProducts({ parentId, ids });
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setMoving(false);
    }
  };

  if (error && !tree) return <p className="type-body p-8 text-coral">{error}</p>;
  if (!index) return <p className="type-body p-8 text-steel">Loading the catalogue…</p>;

  const panel = (() => {
    if (!selection) {
      return (
        <div className="py-16 text-center">
          <p className="type-subhead">Choose something to edit</p>
          <p className="type-body mt-2 text-steel">Pick a category or product on the left, or start a new top-level category.</p>
        </div>
      );
    }
    const common = { index, onDirtyChange };
    switch (selection.kind) {
      case "category":
        return <CategoryForm key={`c${selection.id}`} mode="edit" id={selection.id} flash={flash} {...common} onSaved={reload} onDeleted={() => (reload(), select(null))} />;
      case "new-category":
        return (
          <CategoryForm
            key={`nc${selection.parentId}`}
            mode="new"
            parentId={selection.parentId}
            {...common}
            onSaved={(c) => {
              dirty.current = false;
              reload();
              setFlash(`Created “${c.title}”.`);
              setParams({ edit: formatSelection({ kind: "category", id: c.id }) });
            }}
          />
        );
      case "product":
        return <ProductForm key={`p${selection.id}`} mode="edit" id={selection.id} flash={flash} brands={brands} {...common} onSaved={reload} onDeleted={() => (reload(), select(null))} />;
      case "new-product":
        return (
          <ProductForm
            key={`np${selection.categoryId}`}
            mode="new"
            categoryId={selection.categoryId}
            brands={brands}
            {...common}
            onSaved={(p) => {
              dirty.current = false;
              reload();
              setFlash(`Created “${p.title}”.`);
              setParams({ edit: formatSelection({ kind: "product", id: p.id }) });
            }}
          />
        );
    }
  })();

  return (
    <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(20rem,26rem)_1fr]">
      <aside className="border-b border-line bg-paper lg:sticky lg:top-14 lg:max-h-[calc(100svh-3.5rem)] lg:overflow-y-auto lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="type-label">Catalogue</h2>
          <button type="button" onClick={() => select({ kind: "new-category", parentId: null })} className="type-label inline-flex items-center gap-1.5 hover:underline">
            <FolderPlus className="size-4" aria-hidden /> New category
          </button>
        </div>
        {error && <p className="type-small px-4 pt-3 text-coral">{error}</p>}
        <div className="max-h-[50svh] overflow-y-auto lg:max-h-none">
          <CatalogueTree index={index} selection={selection} onSelect={select} onMove={move} busy={moving} />
        </div>
      </aside>
      <section className="min-w-0 px-5 sm:px-8">{panel}</section>
    </div>
  );
}
