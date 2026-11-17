import type { MouseEvent } from "react";
import { motion } from "motion/react";
import { MessageCircle } from "lucide-react";
import { company, contact } from "@/data/site";
import { whatsappHref } from "@/lib/enquiry";

// Tab titles that don't name something a visitor would ask about.
const GENERIC_TITLES = new Set<string>([company.name, "Page not found"]);

// The page the visitor is on, from the tab title ("Cotton gloves | Asiatic Engineering Co.").
function pageName(): string | null {
  const name = document.title.split(" | ")[0]?.trim();
  return name && !GENERIC_TITLES.has(name) ? name : null;
}

// Built at click time so the message names whatever page is open right now.
function updateHref(e: MouseEvent<HTMLAnchorElement>) {
  const page = pageName();
  e.currentTarget.href = whatsappHref(page ? `Hello, I'm interested in ${page}.` : "Hello, I have an enquiry.");
}

// Floating WhatsApp shortcut on public pages. Sits under the header and mobile menu (z-40/50).
export default function WhatsAppButton() {
  return (
    <motion.a
      href={contact.whatsapp.href}
      target="_blank"
      rel="noreferrer"
      onClick={updateHref}
      onAuxClick={updateHref}
      aria-label="Chat with us on WhatsApp (opens in a new tab)"
      title="Chat on WhatsApp"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, duration: 0.3, ease: "easeOut" }}
      className="fixed right-4 bottom-4 z-30 grid size-14 place-items-center rounded-full bg-teal text-ink shadow-lg shadow-ink/30 transition-colors hover:bg-signal sm:right-6 sm:bottom-6"
    >
      <MessageCircle className="size-7" aria-hidden />
    </motion.a>
  );
}
