import { useEffect, useState } from "react";
import { Archive, ArchiveRestore, ArrowLeft, ExternalLink, Mail, MessageCircle, Phone, Trash2 } from "lucide-react";
import { adminApi } from "@/admin/api";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import type { Enquiry, EnquiryCounts, EnquiryStatus } from "@/lib/enquiries/types";
import { cn } from "@/lib/utils";

const TABS: { status: EnquiryStatus; label: string }[] = [
  { status: "new", label: "New" },
  { status: "read", label: "Read" },
  { status: "archived", label: "Archived" },
];

const relative = new Intl.RelativeTimeFormat("en-IN", { numeric: "auto" });
function timeAgo(iso: string): string {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (minutes > -60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours > -24) return relative.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (days > -30) return relative.format(days, "day");
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
const fullDate = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

// WhatsApp wants digits with the country code; Indian numbers are often typed without it.
function whatsappNumber(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits.length >= 11 ? digits : null;
}

function Detail({ enquiry, busy, onStatus, onDelete, onBack }: { enquiry: Enquiry; busy: boolean; onStatus: (s: EnquiryStatus) => void; onDelete: () => void; onBack: () => void }) {
  const firstName = enquiry.name.trim().split(/\s+/)[0];
  const replySubject = `Re: your enquiry${enquiry.interest ? ` about ${enquiry.interest}` : ""}`;
  const wa = enquiry.phone ? whatsappNumber(enquiry.phone) : null;
  const reply = (
    `Hello ${firstName},\n\nThank you for your enquiry to Asiatic Engineering Co.\n\n` +
    `> ${enquiry.message.replace(/\n/g, "\n> ")}\n\n`
  );

  return (
    <article className="py-6">
      <button type="button" onClick={onBack} className="type-label mb-5 inline-flex items-center gap-1.5 text-steel hover:text-ink lg:hidden">
        <ArrowLeft className="size-4" aria-hidden /> Back to list
      </button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="type-heading break-words">{enquiry.name}</h2>
          {enquiry.company && <p className="type-body mt-1 text-steel">{enquiry.company}</p>}
        </div>
        <span
          className={cn("type-label px-2 py-1 text-[0.6875rem] font-semibold", enquiry.notified ? "bg-teal/25" : "bg-line")}
          title={enquiry.notified ? "A notification email was sent when it arrived" : "No notification email was sent (email isn't set up yet, or sending failed)"}
        >
          {enquiry.notified ? "Email sent" : "Not emailed"}
        </span>
      </div>

      <dl className="type-small mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold text-steel">Received</dt>
        <dd>{fullDate(enquiry.createdAt)}</dd>
        {enquiry.email && (
          <>
            <dt className="font-semibold text-steel">Email</dt>
            <dd className="break-all">{enquiry.email}</dd>
          </>
        )}
        {enquiry.phone && (
          <>
            <dt className="font-semibold text-steel">Phone</dt>
            <dd className="tabular-nums">{enquiry.phone}</dd>
          </>
        )}
        {enquiry.interest && (
          <>
            <dt className="font-semibold text-steel">Looking for</dt>
            <dd>{enquiry.interest}</dd>
          </>
        )}
        {enquiry.page && (
          <>
            <dt className="font-semibold text-steel">Sent from</dt>
            <dd className="min-w-0">
              <a href={enquiry.page} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 break-all underline underline-offset-2">
                {enquiry.page} <ExternalLink className="size-3.5 shrink-0" aria-hidden />
              </a>
            </dd>
          </>
        )}
      </dl>

      <div className="mt-6 border-l-[3px] border-signal bg-surface p-5">
        <p className="type-body whitespace-pre-wrap break-words">{enquiry.message}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {enquiry.email && (
          <Button asChild variant="ink" size="sm">
            <a href={`mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(reply)}`}>
              <Mail aria-hidden /> Reply by email
            </a>
          </Button>
        )}
        {wa && (
          <Button asChild variant="outline-on-light" size="sm">
            <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hello ${firstName}, thank you for your enquiry to Asiatic Engineering Co.`)}`} target="_blank" rel="noreferrer">
              <MessageCircle aria-hidden /> WhatsApp
            </a>
          </Button>
        )}
        {enquiry.phone && (
          <Button asChild variant="outline-on-light" size="sm">
            <a href={`tel:${enquiry.phone.replace(/[^\d+]/g, "")}`}>
              <Phone aria-hidden /> Call
            </a>
          </Button>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
        {enquiry.status === "archived" ? (
          <Button variant="outline-on-light" size="sm" disabled={busy} onClick={() => onStatus("read")}>
            <ArchiveRestore aria-hidden /> Move back to inbox
          </Button>
        ) : (
          <>
            <Button variant="outline-on-light" size="sm" disabled={busy} onClick={() => onStatus("archived")}>
              <Archive aria-hidden /> Archive
            </Button>
            {enquiry.status === "read" && (
              <Button variant="outline-on-light" size="sm" disabled={busy} onClick={() => onStatus("new")}>
                Mark as new
              </Button>
            )}
          </>
        )}
        <Button variant="outline-on-light" size="sm" disabled={busy} onClick={onDelete} className="border-coral text-coral hover:bg-coral hover:text-ink">
          <Trash2 aria-hidden /> Delete
        </Button>
      </div>
    </article>
  );
}

export default function EnquiriesScreen({ onCounts }: { onCounts: (counts: EnquiryCounts) => void }) {
  const [status, setStatus] = useState<EnquiryStatus>("new");
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [counts, setCounts] = useState<EnquiryCounts | null>(null);
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Bumping `version` refetches the list.
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);
  useEffect(() => {
    let alive = true;
    adminApi
      .enquiries(status)
      .then((list) => {
        if (!alive) return;
        setEnquiries(list.enquiries);
        setCounts(list.counts);
        onCounts(list.counts);
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [status, version, onCounts]);

  const act = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Opening a new enquiry marks it read.
  const open = (enquiry: Enquiry) => {
    setSelected(enquiry);
    if (enquiry.status === "new")
      void act(async () => {
        setSelected(await adminApi.setEnquiryStatus(enquiry.id, "read"));
      });
  };
  const changeStatus = (next: EnquiryStatus) =>
    selected &&
    void act(async () => {
      const updated = await adminApi.setEnquiryStatus(selected.id, next);
      // Archiving or unarchiving moves it out of the current tab, so close it.
      setSelected(next === "archived" || selected.status === "archived" ? null : updated);
    });
  const remove = () =>
    selected &&
    void act(async () => {
      await adminApi.deleteEnquiry(selected.id);
      setConfirmDelete(false);
      setSelected(null);
    });

  return (
    <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(20rem,26rem)_1fr]">
      <aside className={cn("border-b border-line bg-paper lg:block lg:border-r lg:border-b-0", selected && "hidden")}>
        <div role="tablist" aria-label="Enquiry status" className="flex border-b border-line px-2">
          {TABS.map((tab) => (
            <button
              key={tab.status}
              type="button"
              role="tab"
              aria-selected={status === tab.status}
              onClick={() => {
                setStatus(tab.status);
                setSelected(null);
              }}
              className={cn(
                "type-label relative px-3 py-3",
                status === tab.status ? "text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-signal" : "text-steel hover:text-ink",
              )}
            >
              {tab.label}
              {counts && <span className="ml-1.5 tabular-nums text-steel">{counts[tab.status]}</span>}
            </button>
          ))}
        </div>
        {error && <p className="type-small px-4 pt-3 text-coral">{error}</p>}
        {!enquiries ? (
          <p className="type-body p-4 text-steel">Loading enquiries…</p>
        ) : enquiries.length === 0 ? (
          <p className="type-body p-4 text-steel">
            {status === "new" ? "No new enquiries." : status === "read" ? "Nothing here yet." : "Nothing archived."}
          </p>
        ) : (
          <ul className="py-2">
            {enquiries.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => open(e)}
                  className={cn("block w-full px-4 py-3 text-left", selected?.id === e.id ? "bg-signal/40" : "hover:bg-surface")}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className={cn("min-w-0 truncate text-[0.9375rem]", e.status === "new" ? "font-bold" : "font-semibold")}>
                      {e.status === "new" && <span className="mr-2 inline-block size-2 rounded-full bg-coral align-middle" aria-label="New" />}
                      {e.name}
                      {e.company && <span className="font-normal text-steel"> · {e.company}</span>}
                    </span>
                    <span className="type-small shrink-0 text-steel">{timeAgo(e.createdAt)}</span>
                  </span>
                  <span className="type-small mt-0.5 block truncate text-steel">{e.interest || e.message}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
      <section className={cn("min-w-0 px-5 sm:px-8", !selected && "hidden lg:block")}>
        {error && selected && (
          <p role="alert" className="type-small mt-4 text-coral">
            {error}
          </p>
        )}
        {selected ? (
          <Detail
            key={selected.id}
            enquiry={selected}
            busy={busy}
            onStatus={changeStatus}
            onDelete={() => setConfirmDelete(true)}
            onBack={() => setSelected(null)}
          />
        ) : (
          <div className="py-16 text-center">
            <p className="type-subhead">Choose an enquiry to read it</p>
            <p className="type-body mt-2 text-steel">New enquiries from the website's form appear here.</p>
          </div>
        )}
      </section>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this enquiry?"
        body="Use this for spam. The enquiry is removed for good and can't be brought back. To keep it but clear it from the inbox, archive it instead."
        confirmLabel="Delete enquiry"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
