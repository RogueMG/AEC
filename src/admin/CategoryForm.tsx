import { useEffect, useState } from "react";
import { adminApi } from "@/admin/api";
import { Field, SectionTitle, Toggle } from "@/admin/components/fields";
import { inputClass } from "@/admin/components/styles";
import FormShell from "@/admin/components/FormShell";
import { SingleImage } from "@/admin/components/ImageInputs";
import { slugify, type Indexed } from "@/admin/tree";
import { useFormState } from "@/admin/useFormState";
import { TONES, type AdminCategory, type AdminImage, type CategoryInput, type Tone } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type Values = {
  parentId: number | null;
  title: string;
  slug: string;
  slugTouched: boolean;
  summary: string;
  image: AdminImage | null;
  tone: Tone;
  showOnHome: boolean;
  madeInHouse: boolean;
};

const toneLabel: Record<Tone, string> = { auto: "Automatic", coral: "Coral", yellow: "Yellow", teal: "Teal", navy: "Navy" };
const toneSwatch: Record<Tone, string> = { auto: "bg-[conic-gradient(var(--color-coral),var(--color-signal),var(--color-teal),var(--color-ink))]", coral: "bg-coral", yellow: "bg-signal", teal: "bg-teal", navy: "bg-ink" };

const fromCategory = (c: AdminCategory): Values => ({ ...c, slugTouched: true });

type Props =
  | { mode: "edit"; id: number; index: Indexed; onSaved: (c: AdminCategory) => void; onDeleted: () => void; onDirtyChange: (d: boolean) => void; flash?: string | null }
  | { mode: "new"; parentId: number | null; index: Indexed; onSaved: (c: AdminCategory) => void; onDeleted?: never; onDirtyChange: (d: boolean) => void; flash?: never };

export default function CategoryForm(props: Props) {
  const { index, onSaved, onDirtyChange } = props;
  const blank: Values | null =
    props.mode === "new"
      ? { parentId: props.parentId, title: "", slug: "", slugTouched: false, summary: "", image: null, tone: "auto", showOnHome: true, madeInHouse: false }
      : null;
  const form = useFormState<Values>(blank, onDirtyChange);
  const [loadError, setLoadError] = useState<string | null>(null);
  const editId = props.mode === "edit" ? props.id : null;
  const { load } = form;

  useEffect(() => {
    if (editId === null) return;
    let alive = true;
    adminApi
      .getCategory(editId)
      .then((c) => alive && load(fromCategory(c)))
      .catch((e: Error) => alive && setLoadError(e.message));
    return () => {
      alive = false;
    };
  }, [editId, load]);

  if (loadError) return <p className="type-body mt-8 text-coral">{loadError}</p>;
  const v = form.values;
  if (!v) return <p className="type-body mt-8 text-steel">Loading…</p>;

  // A category can't move inside itself or its own sub-categories.
  const excluded = editId !== null ? index.descendants(editId) : new Set<number>();
  const parentOptions = index.flat().filter(({ category }) => !excluded.has(category.id));

  const input = (): CategoryInput => ({
    parentId: v.parentId,
    title: v.title,
    slug: v.slug || slugify(v.title),
    summary: v.summary,
    image: v.image ? { key: v.image.key, url: v.image.url, alt: v.image.alt } : null,
    tone: v.tone,
    showOnHome: v.showOnHome,
    madeInHouse: v.madeInHouse,
  });

  const save = () =>
    form.run(async () => {
      if (v.image && !v.image.alt.trim()) throw new Error("Add alt text to the image (what it shows) before saving.");
      const saved = editId === null ? await adminApi.createCategory(input()) : await adminApi.updateCategory(editId, input());
      form.load(fromCategory(saved));
      onSaved(saved);
      return editId === null ? `Created “${saved.title}”.` : "Saved.";
    });

  const path = editId !== null ? index.path(editId) : null;
  const hasContent = editId !== null && (index.children(editId).length > 0 || index.products(editId).length > 0);

  return (
    <FormShell
      flash={props.flash}
      title={editId === null ? "New category" : v.title || "Untitled category"}
      subtitle={path ? `/products/${path}` : v.parentId ? `Inside ${index.byId.get(v.parentId)?.title ?? ""}` : "Top level"}
      viewHref={path ? `/products/${path}` : null}
      saving={form.saving}
      dirty={editId === null || form.dirty}
      notice={form.notice}
      onSubmit={save}
      deleteLabel={editId !== null ? "Delete category" : undefined}
      deleteBody={
        hasContent
          ? "This category still has sub-categories or products. Move or delete them first; the delete will be refused until then."
          : "The category will be removed from the site. This can't be undone."
      }
      onDelete={
        props.mode === "edit"
          ? async () => {
              try {
                await adminApi.deleteCategory(props.id);
                form.setNotice(null);
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
              required
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
        <Field label="Inside" hint="Choose “Top level” for a main category." error={form.errors.parentId}>
          {(id, d) => (
            <select id={id} aria-describedby={d} className={inputClass} value={v.parentId ?? ""} onChange={(e) => form.set("parentId", e.target.value ? Number(e.target.value) : null)}>
              <option value="">Top level</option>
              {parentOptions.map(({ category, depth }) => (
                <option key={category.id} value={category.id}>
                  {" ".repeat(depth)}
                  {category.title}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Summary" hint="One or two sentences for the tile and the top of the page." error={form.errors.summary}>
          {(id, d) => <textarea id={id} aria-describedby={d} rows={3} className={inputClass} value={v.summary} onChange={(e) => form.set("summary", e.target.value)} />}
        </Field>
      </section>

      <section className="space-y-5">
        <SectionTitle>Look</SectionTitle>
        <SingleImage label="Image" value={v.image} onChange={(image) => form.set("image", image)} error={form.errors.image} />
        <fieldset>
          <legend className="type-label">Tile colour</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {TONES.map((tone) => (
              <label key={tone} className={cn("type-small flex cursor-pointer items-center gap-2 border px-3 py-2", v.tone === tone ? "border-ink bg-surface" : "border-line")}>
                <input type="radio" name="tone" className="sr-only" checked={v.tone === tone} onChange={() => form.set("tone", tone)} />
                <span aria-hidden className={cn("size-4 rounded-full", toneSwatch[tone])} />
                {toneLabel[tone]}
              </label>
            ))}
          </div>
        </fieldset>
        <Toggle label="Show on home page" hint="Top-level categories only appear on the home page when this is on." checked={v.showOnHome} onChange={(x) => form.set("showOnHome", x)} />
        <Toggle label="Made in-house" hint="Shows the “Made in-house” badge." checked={v.madeInHouse} onChange={(x) => form.set("madeInHouse", x)} />
      </section>
    </FormShell>
  );
}
