import { contact } from "@/data/site";

// Pre-filled WhatsApp and email links, so an enquiry arrives already naming the product.

export function whatsappHref(message: string): string {
  return `${contact.whatsapp.href}?text=${encodeURIComponent(message)}`;
}

export function emailHref(subject: string, body?: string): string {
  const params = new URLSearchParams({ subject });
  if (body) params.set("body", body);
  // URLSearchParams encodes spaces as "+", which mail apps show literally.
  return `${contact.email.href}?${params.toString().replace(/\+/g, "%20")}`;
}
