import { contact } from "@/data/site";

// Pre-filled WhatsApp and email links, so an enquiry arrives already naming the product.

export function whatsappHref(message: string): string {
  return `${contact.whatsapp.href}?text=${encodeURIComponent(message)}`;
}

// The home-page enquiry form with a product or category (its /products path) already chosen.
export function enquiryFormHref(interestPath: string): string {
  return `/?${new URLSearchParams({ interest: interestPath })}#contact`;
}

export function emailHref(subject: string, body?: string): string {
  const params = new URLSearchParams({ subject });
  if (body) params.set("body", body);
  // URLSearchParams encodes spaces as "+", which mail apps show literally.
  return `${contact.email.href}?${params.toString().replace(/\+/g, "%20")}`;
}
