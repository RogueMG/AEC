import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { adminApi } from "@/admin/api";
import { Field, Toggle } from "@/admin/components/fields";
import { iconButton, inputClass } from "@/admin/components/styles";
import FormShell from "@/admin/components/FormShell";
import { SingleImage } from "@/admin/components/ImageInputs";
import { slugify } from "@/admin/tree";
import { useFormState } from "@/admin/useFormState";
import type { AdminBrand, AdminImage } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type Values = { name: string; slug: string; slugTouched: boolean; inHouse: boolean; logo: AdminImage | null };
const fromBrand = (b: AdminBrand): Values => ({ name: b.name, slug: b.slug, slugTouched: true, inHouse: b.inHouse, logo: b.logo });
const blank: Values = { name: "", slug: "", slugTouched: false, inHouse: false, logo: null };

function BrandForm({ brand, flash, onSaved, onDeleted, onDirtyChange }: { brand: AdminBrand | null; flash: string | null; onSaved: (b: AdminBrand) => void; onDeleted: () => void; onDirtyChange: (d: boolean) => void }) {
  const form = useFormState<Values>(brand ? fromBrand(brand) : blank, onDirtyChange);
  const v = form.values as Values;

  const save = () =>
    form.run(async () => {
      if (v.logo && !v.logo.alt.trim()) throw new Error("Add alt text to the logo before saving.");
      const input = { name: v.name, slug: v.slug || slugify(v.name), inHouse: v.inHouse, logo: v.logo ? { key: v.logo.key, url: v.logo.url, alt: v.logo.alt } : null };
      const saved = brand ? await adminApi.updateBrand(brand.id, input) : await adminApi.createBrand(input);
      form.load(fromBrand(saved));
      onSaved(saved);
      return brand ? "Saved." : `Created “${saved.name}”.`;
    });

  return (
    <FormShell
      flash={flash}
      title={brand ? v.name || "Untitled brand" : "New brand"}
      saving={form.saving}
      dirty={!brand || form.dirty}
      notice={form.notice}
      onSubmit={save}
      deleteLabel={brand ? "Delete brand" : undefined}
      deleteBody="Products that use this brand keep their place; they just won't show a brand. This can't be undone."
      onDelete={
        brand
          ? async () => {
              try {
                await adminApi.deleteBrand(brand.id);
                onDeleted();
              } catch (e) {
                form.setNotice({ tone: "error", text: (e as Error).message });
              }
            }
          : undefined
      }
    >
      <section className="space-y-5">
        <Field label="Name" error={form.errors.name}>
          {(id, d) => (
            <input
              id={id}
              aria-describedby={d}
              className={inputClass}
              value={v.name}
              onChange={(e) => {
                form.set("name", e.target.value);
                if (!v.slugTouched) form.set("slug", slugify(e.target.value));
              }}
            />
          )}
        </Field>
        <Field label="Slug" error={form.errors.slug}>
          {(id, d) => (
            <input id={id} aria-describedby={d} className={cn(inputClass, "font-mono text-sm")} value={v.slug} onChange={(e) => (form.set("slug", e.target.value), form.set("slugTouched", true))} />
          )}
        </Field>
        <Toggle label="Our own products (in-house)" hint="In-house isn't listed among the dealer brands on the home page." checked={v.inHouse} onChange={(x) => form.set("inHouse", x)} />
        <SingleImage label="Logo (optional)" value={v.logo} onChange={(logo) => form.set("logo", logo)} error={form.errors.logo} />
      </section>
    </FormShell>
  );
}

export default function BrandsScreen() {
  const [brands, setBrands] = useState<AdminBrand[] | null>(null);
  const [selected, setSelected] = useState<number | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const onDirtyChange = useCallback((d: boolean) => setDirty(d), []);

  // Bumping `version` refetches the list.
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    let alive = true;
    adminApi
      .brands()
      .then((list) => alive && setBrands(list))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [version]);

  const choose = (next: number | "new" | null) => {
    if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) return;
    setDirty(false);
    setFlash(null);
    setSelected(next);
  };

  const move = async (i: number, delta: -1 | 1) => {
    if (!brands) return;
    const ids = brands.map((b) => b.id);
    [ids[i], ids[i + delta]] = [ids[i + delta], ids[i]];
    setBusy(true);
    try {
      await adminApi.reorderBrands(ids);
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!brands) return <p className={cn("type-body p-8", error ? "text-coral" : "text-steel")}>{error ?? "Loading brands…"}</p>;
  const current = typeof selected === "number" ? (brands.find((b) => b.id === selected) ?? null) : null;

  return (
    <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(20rem,26rem)_1fr]">
      <aside className="border-b border-line bg-paper lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="type-label">Brands</h2>
          <button type="button" onClick={() => choose("new")} className="type-label inline-flex items-center gap-1.5 hover:underline">
            <Plus className="size-4" aria-hidden /> New brand
          </button>
        </div>
        <p className="type-small px-4 pt-3 text-steel">The home page names the first three dealer brands.</p>
        {error && <p className="type-small px-4 pt-2 text-coral">{error}</p>}
        <ul className="py-2">
          {brands.map((b, i) => (
            <li key={b.id} className={cn("group flex items-center gap-2 px-4 py-1", selected === b.id ? "bg-signal/40" : "hover:bg-surface")}>
              <button type="button" onClick={() => choose(b.id)} className="min-w-0 flex-1 truncate py-1.5 text-left text-[0.9375rem] font-semibold">
                {b.name}
                {b.inHouse && <span className="type-label ml-2 bg-line px-1.5 text-[0.6875rem] font-semibold">In-house</span>}
              </button>
              <button type="button" className={cn(iconButton, "size-7")} disabled={busy || i === 0} onClick={() => void move(i, -1)} aria-label={`Move ${b.name} up`}>
                <ArrowUp aria-hidden />
              </button>
              <button type="button" className={cn(iconButton, "size-7")} disabled={busy || i === brands.length - 1} onClick={() => void move(i, 1)} aria-label={`Move ${b.name} down`}>
                <ArrowDown aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="min-w-0 px-5 sm:px-8">
        {selected === null ? (
          <div className="py-16 text-center">
            <p className="type-subhead">Choose a brand to edit</p>
            <p className="type-body mt-2 text-steel">Or add a new one.</p>
          </div>
        ) : (
          <BrandForm
            key={String(selected)}
            brand={current}
            flash={flash}
            onDirtyChange={onDirtyChange}
            onSaved={(b) => {
              setDirty(false);
              reload();
              if (selected === "new") setFlash(`Created “${b.name}”.`);
              setSelected(b.id);
            }}
            onDeleted={() => {
              setDirty(false);
              setSelected(null);
              reload();
            }}
          />
        )}
      </section>
    </div>
  );
}
