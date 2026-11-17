import { useId, useRef, useState } from "react";
import { ImagePlus, Link2, Loader2 } from "lucide-react";
import { adminApi } from "@/admin/api";
import { resizeToWebp } from "@/admin/resizeImage";
import type { AdminImage } from "@/lib/admin/types";
import { thumbnailFor } from "@/lib/images";
import { cn } from "@/lib/utils";
import { RowControls } from "./fields";
import { iconButton, inputClass, moveItem } from "./styles";

const describe = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

// Upload (resized in the browser first) or paste an https link; both produce AdminImages.
// A batch of uploads is reported once, so several files dropped together all land.
function useImageAdder(onAdd: (images: AdminImage[]) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addFiles(files: FileList | File[]) {
    setError(null);
    setBusy(true);
    const added: AdminImage[] = [];
    try {
      for (const file of Array.from(files)) {
        const blob = await resizeToWebp(file);
        const ext = blob.type === "image/webp" ? "webp" : "jpg";
        const result = await adminApi.upload(blob, `${file.name.replace(/\.[^.]+$/, "")}.${ext}`);
        added.push({ key: result.key, url: null, alt: "", src: result.src });
      }
    } catch (e) {
      setError(describe(e));
    } finally {
      setBusy(false);
      if (added.length) onAdd(added);
    }
  }

  function addLink(url: string) {
    const link = url.trim();
    if (!/^https:\/\/\S+$/i.test(link)) {
      setError("Image links must start with https://");
      return false;
    }
    setError(null);
    onAdd([{ key: null, url: link, alt: "", src: link }]);
    return true;
  }

  return { busy, error, addFiles, addLink };
}

function Adder({ onAdd, multiple, label }: { onAdd: (images: AdminImage[]) => void; multiple: boolean; label: string }) {
  const fileId = useId();
  const linkId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState("");
  const [dragging, setDragging] = useState(false);
  const { busy, error, addFiles, addLink } = useImageAdder(onAdd);

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
        }}
        className={cn("flex flex-wrap items-center gap-3 border border-dashed p-4", dragging ? "border-teal bg-teal/10" : "border-line bg-paper")}
      >
        <input
          id={fileId}
          ref={input}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="type-label inline-flex h-10 items-center gap-2 bg-ink px-4 text-surface hover:bg-ink-raised disabled:opacity-60">
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
          {busy ? "Uploading…" : label}
        </button>
        <span className="type-small text-steel">or drop {multiple ? "images" : "an image"} here. Resized to WebP before upload.</span>
      </div>
      <div className="mt-2 flex gap-2">
        <label htmlFor={linkId} className="sr-only">
          Image link
        </label>
        <input
          id={linkId}
          className={inputClass}
          placeholder="Or paste an image link (https://…)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (addLink(link)) setLink("");
            }
          }}
        />
        <button type="button" className={cn(iconButton, "h-auto w-11")} aria-label="Add image link" onClick={() => addLink(link) && setLink("")}>
          <Link2 aria-hidden />
        </button>
      </div>
      {error && (
        <p role="alert" className="type-small mt-1.5 font-medium text-coral">
          {error}
        </p>
      )}
    </div>
  );
}

function AltInput({ image, onChange, label }: { image: AdminImage; onChange: (alt: string) => void; label: string }) {
  const id = useId();
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="type-label block">
        Alt text <span className="font-normal text-steel">(what the image shows)</span>
      </label>
      <input id={id} className={cn(inputClass, "mt-1.5", !image.alt.trim() && "border-signal")} value={image.alt} onChange={(e) => onChange(e.target.value)} aria-label={`Alt text for ${label}`} />
      <p className="type-small mt-1 truncate text-steel">{image.key ? "Uploaded" : image.url}</p>
    </div>
  );
}

type SingleImageProps = { label: string; value: AdminImage | null; onChange: (value: AdminImage | null) => void; error?: string };

export function SingleImage({ label, value, onChange, error }: SingleImageProps) {
  return (
    <fieldset>
      <legend className="type-label text-ink">{label}</legend>
      <div className="mt-2">
        {value ? (
          <div className="flex flex-col gap-3 border border-line bg-surface p-3 sm:flex-row">
            <img src={thumbnailFor(value.src)} alt="" decoding="async" className="size-24 shrink-0 bg-paper object-cover" />
            <AltInput image={value} label={label} onChange={(alt) => onChange({ ...value, alt })} />
            <button type="button" className="type-label self-start text-coral hover:underline" onClick={() => onChange(null)}>
              Remove
            </button>
          </div>
        ) : (
          <Adder multiple={false} label="Upload image" onAdd={(images) => onChange(images[0] ?? null)} />
        )}
      </div>
      {error && (
        <p role="alert" className="type-small mt-1.5 font-medium text-coral">
          {error}
        </p>
      )}
    </fieldset>
  );
}

type GalleryProps = { values: AdminImage[]; onChange: (values: AdminImage[]) => void; error?: string };

export function ImageGallery({ values, onChange, error }: GalleryProps) {
  return (
    <fieldset>
      <legend className="type-label text-ink">Images</legend>
      <p className="type-small mt-1 text-steel">The first image is the main one.</p>
      <ul className="mt-2 space-y-2">
        {values.map((image, i) => (
          <li key={`${image.src}-${i}`} className="flex flex-col gap-3 border border-line bg-surface p-3 sm:flex-row">
            <div className="relative shrink-0">
              <img src={thumbnailFor(image.src)} alt="" decoding="async" className="size-24 bg-paper object-cover" />
              {i === 0 && <span className="type-label absolute top-1 left-1 bg-ink px-1.5 py-0.5 text-[0.6875rem] text-surface">Main</span>}
            </div>
            <AltInput image={image} label={`image ${i + 1}`} onChange={(alt) => onChange(values.map((v, j) => (j === i ? { ...v, alt } : v)))} />
            <RowControls
              index={i}
              count={values.length}
              label={`image ${i + 1}`}
              onMove={(d) => onChange(moveItem(values, i, d))}
              onRemove={() => onChange(values.filter((_, j) => j !== i))}
            />
          </li>
        ))}
      </ul>
      <div className="mt-2">
        <Adder multiple label="Upload images" onAdd={(images) => onChange([...values, ...images])} />
      </div>
      {error && (
        <p role="alert" className="type-small mt-1.5 font-medium text-coral">
          {error}
        </p>
      )}
    </fieldset>
  );
}
