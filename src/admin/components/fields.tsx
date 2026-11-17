import { useId, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import type { Spec } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { iconButton, inputClass, moveItem } from "./styles";


type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
  className?: string;
};

export function Field({ label, hint, error, children, className }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="type-label block text-ink">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="type-small mt-1 text-steel">
          {hint}
        </p>
      )}
      <div className="mt-2">{children(id, describedBy)}</div>
      {error && (
        <p id={errorId} role="alert" className="type-small mt-1.5 font-medium text-coral">
          {error}
        </p>
      )}
    </div>
  );
}

type ToggleProps = { label: string; hint?: string; checked: boolean; onChange: (value: boolean) => void };

export function Toggle({ label, hint, checked, onChange }: ToggleProps) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4 shrink-0 accent-ink"
      />
      <label htmlFor={id} className="cursor-pointer">
        <span className="type-label block text-ink">{label}</span>
        {hint && <span className="type-small block text-steel">{hint}</span>}
      </label>
    </div>
  );
}


type RowControlsProps = { index: number; count: number; label: string; onMove: (delta: -1 | 1) => void; onRemove: () => void };

export function RowControls({ index, count, label, onMove, onRemove }: RowControlsProps) {
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className={iconButton} onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${label} up`}>
        <ArrowUp aria-hidden />
      </button>
      <button type="button" className={iconButton} onClick={() => onMove(1)} disabled={index === count - 1} aria-label={`Move ${label} down`}>
        <ArrowDown aria-hidden />
      </button>
      <button type="button" className={iconButton} onClick={onRemove} aria-label={`Remove ${label}`}>
        <X aria-hidden />
      </button>
    </div>
  );
}

type ListEditorProps = { label: string; hint?: string; addLabel: string; values: string[]; onChange: (values: string[]) => void; placeholder?: string };

// An editable list of short texts (key features, sizes).
export function ListEditor({ label, hint, addLabel, values, onChange, placeholder }: ListEditorProps) {
  return (
    <fieldset>
      <legend className="type-label text-ink">{label}</legend>
      {hint && <p className="type-small mt-1 text-steel">{hint}</p>}
      <ul className="mt-2 space-y-2">
        {values.map((value, i) => (
          <li key={i} className="flex gap-2">
            <input
              className={inputClass}
              value={value}
              placeholder={placeholder}
              aria-label={`${label} ${i + 1}`}
              onChange={(e) => onChange(values.map((v, j) => (j === i ? e.target.value : v)))}
            />
            <RowControls
              index={i}
              count={values.length}
              label={`${label.toLowerCase()} ${i + 1}`}
              onMove={(d) => onChange(moveItem(values, i, d))}
              onRemove={() => onChange(values.filter((_, j) => j !== i))}
            />
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => onChange([...values, ""])} className="type-label mt-3 inline-flex items-center gap-1.5 text-ink hover:underline">
        <Plus className="size-4" aria-hidden /> {addLabel}
      </button>
    </fieldset>
  );
}

type SpecEditorProps = { values: Spec[]; onChange: (values: Spec[]) => void; error?: string };

export function SpecEditor({ values, onChange, error }: SpecEditorProps) {
  const update = (i: number, patch: Partial<Spec>) => onChange(values.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  return (
    <fieldset>
      <legend className="type-label text-ink">Specifications</legend>
      <p className="type-small mt-1 text-steel">Label and value rows, e.g. Material: Cotton knit.</p>
      <ul className="mt-2 space-y-2">
        {values.map((row, i) => (
          <li key={i} className="flex gap-2">
            <input className={cn(inputClass, "w-2/5")} value={row.label} placeholder="Label" aria-label={`Specification ${i + 1} label`} onChange={(e) => update(i, { label: e.target.value })} />
            <input className={inputClass} value={row.value} placeholder="Value" aria-label={`Specification ${i + 1} value`} onChange={(e) => update(i, { value: e.target.value })} />
            <RowControls
              index={i}
              count={values.length}
              label={`specification ${i + 1}`}
              onMove={(d) => onChange(moveItem(values, i, d))}
              onRemove={() => onChange(values.filter((_, j) => j !== i))}
            />
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="type-small mt-1.5 font-medium text-coral">
          {error}
        </p>
      )}
      <button type="button" onClick={() => onChange([...values, { label: "", value: "" }])} className="type-label mt-3 inline-flex items-center gap-1.5 text-ink hover:underline">
        <Plus className="size-4" aria-hidden /> Add a specification
      </button>
    </fieldset>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="type-subhead border-b border-line pb-2">{children}</h3>;
}
