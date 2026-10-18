import { contact } from "@/data/site";
import { cn } from "@/lib/utils";

// Placeholder blocks while content loads. Sized like the real layout so nothing jumps.
export function Loading({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("animate-pulse bg-line/50", className)}>
      <span className="sr-only">{label}…</span>
    </div>
  );
}

export function LoadError({ className }: { className?: string }) {
  return (
    <div role="alert" className={cn("page py-16", className)}>
      <p className="type-subhead">Products could not be loaded.</p>
      <p className="type-body mt-2 text-steel">
        Refresh the page to try again, or call us on{" "}
        <a href={contact.mobile.href} className="link-rule text-ink">
          {contact.mobile.label}
        </a>
        .
      </p>
    </div>
  );
}
