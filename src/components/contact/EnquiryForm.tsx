import { useId, useMemo, useState, type FormEvent } from "react";
import { useLocation, useSearchParams } from "react-router";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import Turnstile from "@/components/contact/Turnstile";
import { Button } from "@/components/ui/button";
import { contact } from "@/data/site";
import { useTree } from "@/lib/content/hooks";
import type { TreeCategory } from "@/lib/content/types";
import type { EnquiryInput } from "@/lib/enquiries/types";
import { turnstileEnabled } from "@/lib/turnstile";
import { cn } from "@/lib/utils";

// path: the category's /products path (matched against ?interest= links);
// value: what's sent with the enquiry ("Safety › Gloves"); label: indented by depth.
type Option = { path: string; value: string; label: string };
const OTHER = "Something else";

// Every category (indented by depth) as "what are you looking for" options.
function categoryOptions(tree: TreeCategory[]): Option[] {
  const out: Option[] = [];
  const walk = (nodes: TreeCategory[], depth: number, trail: string[]) =>
    nodes.forEach((node) => {
      const titles = [...trail, node.title];
      out.push({ path: node.path, value: titles.join(" › "), label: `${" ".repeat(depth)}${node.title}` });
      walk(node.children, depth + 1, titles);
    });
  walk(tree, 0, []);
  return out;
}

// The title of the product at a /products path, for "Send an enquiry" links from product pages.
function findProduct(tree: TreeCategory[], path: string): string | undefined {
  for (const node of tree) {
    const product = node.products.find((p) => p.path === path);
    if (product) return product.title;
    const found = findProduct(node.children, path);
    if (found) return found;
  }
  return undefined;
}

const inputClass =
  "w-full border border-ink-line bg-ink-raised px-3.5 py-3 text-surface placeholder:text-ink-muted/70 focus-visible:border-teal";

type Errors = Partial<Record<"name" | "email" | "phone" | "message" | "form", string>>;

export default function EnquiryForm() {
  const id = useId();
  const tree = useTree();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const requested = params.get("interest");

  const options = useMemo(() => (tree.status === "ready" ? categoryOptions(tree.data) : []), [tree]);
  const requestedCategory = requested ? options.find((o) => o.path === requested)?.value : undefined;
  const requestedProduct = useMemo(
    () => (requested && !requestedCategory && tree.status === "ready" ? findProduct(tree.data, requested) : undefined),
    [requested, requestedCategory, tree],
  );

  const [values, setValues] = useState({ name: "", company: "", email: "", phone: "", message: "", website: "" });
  // null until the visitor touches the dropdown, so "" (no choice) can be picked on purpose.
  const [pickedInterest, setPickedInterest] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [widgetKey, setWidgetKey] = useState(0);

  // A product or category passed in the link is selected until the visitor picks something else.
  const interest = pickedInterest ?? requestedProduct ?? requestedCategory ?? "";
  const set = (key: keyof typeof values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const local: Errors = {};
    if (!values.name.trim()) local.name = "Please enter your name";
    if (!values.email.trim() && !values.phone.trim()) local.email = "Please give an email address or a phone number so we can reply";
    if (!values.message.trim()) local.message = "Please tell us what you need";
    if (turnstileEnabled && !token) local.form = "Please wait a moment while we check you're not a robot, then send again.";
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    setState("sending");
    const body: EnquiryInput = { ...values, interest, page: pathname + (requested ? `?interest=${requested}` : ""), turnstileToken: token ?? undefined };
    try {
      const response = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await response.json().catch(() => ({}))) as { error?: string; field?: string };
      if (!response.ok) {
        const field = data.field && ["name", "email", "phone", "message"].includes(data.field) ? data.field : "form";
        setErrors({ [field]: data.error ?? "Something went wrong. Please try again." });
        setState("idle");
        // A Turnstile token can only be used once; get a fresh one for the retry.
        setToken(null);
        setWidgetKey((k) => k + 1);
        return;
      }
      setState("sent");
    } catch {
      setErrors({ form: `Couldn't send. Check your connection, or call us on ${contact.mobile.label}.` });
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="border-l-[3px] border-teal bg-ink-raised p-6 sm:p-8">
        <CheckCircle2 className="size-8 text-teal" aria-hidden />
        <p className="type-heading mt-4">Thank you, {values.name.trim().split(" ")[0]}.</p>
        <p className="type-body mt-2 text-ink-muted">We've received your enquiry and will reply within one working day. For anything urgent, call {contact.mobile.label}.</p>
        <button
          type="button"
          className="type-label link-rule mt-6 text-signal"
          onClick={() => {
            setValues({ name: "", company: "", email: "", phone: "", message: "", website: "" });
            setPickedInterest("");
            setToken(null);
            setWidgetKey((k) => k + 1);
            setState("idle");
          }}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  const label = (key: string, text: string, required = false) => (
    <label htmlFor={`${id}-${key}`} className="type-label block text-ink-muted">
      {text}
      {required && <span aria-hidden className="text-signal"> *</span>}
    </label>
  );
  const error = (key: keyof Errors) =>
    errors[key] && (
      <p id={`${id}-${key}-error`} role="alert" className="type-small mt-1.5 font-medium text-signal">
        {errors[key]}
      </p>
    );
  const described = (key: keyof Errors) => (errors[key] ? `${id}-${key}-error` : undefined);

  return (
    <form onSubmit={submit} noValidate aria-labelledby={`${id}-title`} className="grid gap-5 sm:grid-cols-2">
      <h3 id={`${id}-title`} className="sr-only">
        Enquiry form
      </h3>
      <div>
        {label("name", "Your name", true)}
        <input id={`${id}-name`} className={cn(inputClass, "mt-2")} autoComplete="name" value={values.name} onChange={set("name")} aria-invalid={!!errors.name} aria-describedby={described("name")} />
        {error("name")}
      </div>
      <div>
        {label("company", "Company")}
        <input id={`${id}-company`} className={cn(inputClass, "mt-2")} autoComplete="organization" value={values.company} onChange={set("company")} />
      </div>
      <div>
        {label("email", "Email")}
        <input id={`${id}-email`} type="email" className={cn(inputClass, "mt-2")} autoComplete="email" value={values.email} onChange={set("email")} aria-invalid={!!errors.email} aria-describedby={described("email")} />
        {error("email")}
      </div>
      <div>
        {label("phone", "Phone")}
        <input id={`${id}-phone`} type="tel" className={cn(inputClass, "mt-2")} autoComplete="tel" value={values.phone} onChange={set("phone")} aria-invalid={!!errors.phone} aria-describedby={described("phone")} />
        {error("phone")}
      </div>
      <div className="sm:col-span-2">
        {label("interest", "What are you looking for?")}
        <select id={`${id}-interest`} className={cn(inputClass, "mt-2")} value={interest} onChange={(e) => setPickedInterest(e.target.value)}>
          <option value="">Choose a product range (optional)</option>
          {requestedProduct && <option value={requestedProduct}>{requestedProduct}</option>}
          {options.map((o) => (
            <option key={o.path} value={o.value}>
              {o.label}
            </option>
          ))}
          <option value={OTHER}>{OTHER}</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        {label("message", "Message", true)}
        <textarea
          id={`${id}-message`}
          rows={5}
          className={cn(inputClass, "mt-2")}
          placeholder="Quantities, sizes, part numbers, delivery location…"
          value={values.message}
          onChange={set("message")}
          aria-invalid={!!errors.message}
          aria-describedby={described("message")}
        />
        {error("message")}
      </div>

      {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
      </div>

      <div className="sm:col-span-2">
        <Turnstile key={widgetKey} onToken={setToken} />
        {error("form")}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Button type="submit" disabled={state === "sending"}>
            {state === "sending" ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
            {state === "sending" ? "Sending…" : "Send enquiry"}
          </Button>
          <p className="type-small text-ink-muted">Give us an email or a phone number so we can reply.</p>
        </div>
      </div>
    </form>
  );
}
