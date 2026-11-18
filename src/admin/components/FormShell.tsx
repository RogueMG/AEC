import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ConfirmDialog from "./ConfirmDialog";

export type Notice = { tone: "success" | "error"; text: string } | null;

type Props = {
  /** Shown until the form's own first notice, e.g. "Created …" after switching to the new item. */
  flash?: string | null;
  title: string;
  subtitle?: string;
  viewHref?: string | null;
  saving: boolean;
  dirty: boolean;
  notice: Notice;
  onSubmit: () => void;
  deleteLabel?: string;
  deleteBody?: string;
  onDelete?: () => Promise<void>;
  children: ReactNode;
};

// The frame around every edit form: heading, save bar, status message and delete.
export default function FormShell({ flash, title, subtitle, viewHref, saving, dirty, notice, onSubmit, deleteLabel, deleteBody, onDelete, children }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={submit} noValidate className="pb-10">
      <div className="sticky top-14 z-10 -mx-5 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="min-w-0">
          <h2 className="type-heading truncate">{title}</h2>
          {subtitle && <p className="type-small truncate text-steel">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {viewHref && (
            <a href={viewHref} target="_blank" rel="noreferrer" className="type-label inline-flex items-center gap-1.5 text-ink hover:underline">
              View on site <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
          <Button type="submit" variant="ink" size="sm" disabled={saving}>
            {saving && <Loader2 className="animate-spin" aria-hidden />}
            {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </Button>
        </div>
      </div>

      <div role="status" aria-live="polite" className="min-h-0">
        {(notice ?? (flash ? { tone: "success" as const, text: flash } : null)) && (
          <p
            className={cn(
              "type-small mt-4 border-l-[3px] px-3 py-2 font-medium",
              (notice?.tone ?? "success") === "success" ? "border-teal bg-teal/10" : "border-coral bg-coral/10",
            )}
          >
            {notice?.text ?? flash}
          </p>
        )}
      </div>

      <div className="mt-6 space-y-8">{children}</div>

      {onDelete && deleteLabel && (
        <div className="mt-12 border-t border-line pt-6">
          <Button type="button" variant="outline-on-light" size="sm" className="border-coral text-coral hover:bg-coral hover:text-ink" onClick={() => setConfirming(true)}>
            {deleteLabel}
          </Button>
          <ConfirmDialog
            open={confirming}
            title={`${deleteLabel}?`}
            body={deleteBody ?? "This can't be undone."}
            confirmLabel="Delete"
            busy={deleting}
            onCancel={() => setConfirming(false)}
            onConfirm={async () => {
              setDeleting(true);
              try {
                await onDelete();
              } finally {
                setDeleting(false);
                setConfirming(false);
              }
            }}
          />
        </div>
      )}
    </form>
  );
}
