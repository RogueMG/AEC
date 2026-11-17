import { lazy, Suspense, useEffect, useState } from "react";
import { adminApi } from "@/admin/api";
import { Field, ListEditor, SectionTitle, SpecEditor, Toggle } from "@/admin/components/fields";
import { inputClass } from "@/admin/components/styles";
import FormShell from "@/admin/components/FormShell";
import { ImageGallery } from "@/admin/components/ImageInputs";
import { slugify, type Indexed } from "@/admin/tree";
import { useFormState } from "@/admin/useFormState";
import type { AdminBrand, AdminImage, AdminProduct, ProductInput } from "@/lib/admin/types";
import type { Spec } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const RichTextEditor = lazy(() => import("@/admin/components/RichTextEditor"));

type Values = {
  categoryId: number;
  brandId: number | null;
  title: string;
  slug: string;
  slugTouched: boolean;
  summary: string;
  description: string;
  images: AdminImage[];
  keyFeatures: string[];
  specifications: Spec[];
  variants: string[];
  isSample: boolean;
  published: boolean;
};

const fromProduct = (p: AdminProduct): Values => ({
  categoryId: p.categoryId,
  brandId: p.brandId,
  title: p.title,
  slug: p.slug,
  slugTouched: true,
  summary: p.summary,
  description: p.description,
  images: p.images,
  keyFeatures: p.keyFeatures,
  specifications: p.specifications,
  variants: p.variants,
  isSample: p.isSample,
  published: p.published,
});

type Props =
  | { mode: "edit"; id: number; index: Indexed; brands: AdminBrand[]; onSaved: (p: AdminProduct) => void; onDeleted: () => void; onDirtyChange: (d: boolean) => void; flash?: string | null }
  | { mode: "new"; categoryId: number; index: Indexed; brands: AdminBrand[]; onSaved: (p: AdminProduct) => void; onDeleted?: never; onDirtyChange: (d: boolean) => void; flash?: never };

export default function ProductForm(props: Props) {
  const { index, brands, onSaved, onDirtyChange } = props;
  const blank: Values | null =
    props.mode === "new"
      ? { categoryId: props.categoryId, brandId: null, title: "", slug: "", slugTouched: false, summary: "", description: "", images: [], keyFeatures: [], specifications: [], variants: [], isSample: false, published: true }
      : null;
  const form = useFormState<Values>(blank, onDirtyChange);
  const [loadError, setLoadError] = useState<string | null>(null);
  const editId = props.mode === "edit" ? props.id : null;
  const { load } = form;

  useEffect(() => {
    if (editId === null) return;
    let alive = true;
    adminApi
      .getProduct(editId)
      .then((p) => alive && load(fromProduct(p)))
      .catch((e: Error) => alive && setLoadError(e.message));
    return () => {
      alive = false;
    };
  }, [editId, load]);

  if (loadError) return <p className="type-body mt-8 text-coral">{loadError}</p>;
  const v = form.values;
  if (!v) return <p className="type-body mt-8 text-steel">Loading…</p>;

  const input = (): ProductInput => ({
    categoryId: v.categoryId,
    brandId: v.brandId,
    title: v.title,
    slug: v.slug || slugify(v.title),
    summary: v.summary,
    description: v.description,
    images: v.images.map((i) => ({ key: i.key, url: i.url, alt: i.alt })),
    keyFeatures: v.keyFeatures,
    specifications: v.specifications,
    variants: v.variants,
    isSample: v.isSample,
    published: v.published,
  });

  const save = () =>
    form.run(async () => {
      if (v.images.some((i) => !i.alt.trim())) throw new Error("Add alt text to every image (what it shows) before saving.");
      const saved = editId === null ? await adminApi.createProduct(input()) : await adminApi.updateProduct(editId, input());
      form.load(fromProduct(saved));
      onSaved(saved);
      return editId === null ? `Created “${saved.title}”.` : "Saved.";
    });

  const savedPath = editId !== null ? index.tree.products.find((p) => p.id === editId) : undefined;
  const path = savedPath ? `${index.path(savedPath.categoryId)}/${savedPath.slug}` : null;

  return (
    <FormShell
      flash={props.flash}
      title={editId === null ? "New product" : v.title || "Untitled product"}
      subtitle={path ? `/products/${path}${savedPath?.published ? "" : " (draft)"}` : `In ${index.byId.get(v.categoryId)?.title ?? ""}`}
      viewHref={path && savedPath?.published ? `/products/${path}` : null}
      saving={form.saving}
      dirty={editId === null || form.dirty}
      notice={form.notice}
      onSubmit={save}
      deleteLabel={editId !== null ? "Delete product" : undefined}
      deleteBody="The product and its images will be removed from the site. This can't be undone."
      onDelete={
        props.mode === "edit"
          ? async () => {
              try {
                await adminApi.deleteProduct(props.id);
                props.onDeleted();
              } catch (e) {
                form.setNotice({ tone: "error", text: (e as Error).message });
              }
            }
          : undefined
      }
    >
      <section className="space-y-5">
        <SectionTitle>Basics</SectionTitle>
        <Field label="Title" error={form.errors.title}>
          {(id, d) => (
            <input
              id={id}
              aria-describedby={d}
              className={inputClass}
              value={v.title}
              onChange={(e) => {
                form.set("title", e.target.value);
                if (!v.slugTouched) form.set("slug", slugify(e.target.value));
              }}
            />
          )}
        </Field>
        <Field label="Slug" hint="Used in the page address. Lowercase letters, numbers and hyphens." error={form.errors.slug}>
          {(id, d) => (
            <input
              id={id}
              aria-describedby={d}
              className={cn(inputClass, "font-mono text-sm")}
              value={v.slug}
              onChange={(e) => {
                form.set("slug", e.target.value);
                form.set("slugTouched", true);
              }}
            />
          )}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" error={form.errors.categoryId}>
            {(id, d) => (
              <select id={id} aria-describedby={d} className={inputClass} value={v.categoryId} onChange={(e) => form.set("categoryId", Number(e.target.value))}>
                {index.flat().map(({ category, depth }) => (
                  <option key={category.id} value={category.id}>
                    {" ".repeat(depth)}
                    {category.title}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Brand" error={form.errors.brandId}>
            {(id, d) => (
              <select id={id} aria-describedby={d} className={inputClass} value={v.brandId ?? ""} onChange={(e) => form.set("brandId", e.target.value ? Number(e.target.value) : null)}>
                <option value="">No brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.inHouse ? " (in-house)" : ""}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <Field label="Summary" hint="One or two sentences for product cards and the top of the page." error={form.errors.summary}>
          {(id, d) => <textarea id={id} aria-describedby={d} rows={3} className={inputClass} value={v.summary} onChange={(e) => form.set("summary", e.target.value)} />}
        </Field>
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <Toggle label="Published" hint="Turn off to keep it as a draft, hidden from the site." checked={v.published} onChange={(x) => form.set("published", x)} />
          <Toggle label="Sample listing" hint="Shows a “details to be confirmed” note." checked={v.isSample} onChange={(x) => form.set("isSample", x)} />
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle>Images</SectionTitle>
        <ImageGallery values={v.images} onChange={(images) => form.set("images", images)} error={form.errors.images} />
      </section>

      <section className="space-y-6">
        <SectionTitle>Details</SectionTitle>
        <Field label="Description" error={form.errors.description}>
          {(id, d) => (
            <Suspense fallback={<div className="min-h-48 border border-line bg-surface" />}>
              <RichTextEditor id={id} describedBy={d} value={v.description} onChange={(html) => form.set("description", html)} />
            </Suspense>
          )}
        </Field>
        <ListEditor label="Key features" addLabel="Add a feature" values={v.keyFeatures} onChange={(x) => form.set("keyFeatures", x)} />
        <SpecEditor values={v.specifications} onChange={(x) => form.set("specifications", x)} error={form.errors.specifications} />
        <ListEditor label="Sizes / variants" hint="One per row, e.g. S, M, L or 4 inch." addLabel="Add a size or variant" values={v.variants} onChange={(x) => form.set("variants", x)} />
      </section>
    </FormShell>
  );
}
