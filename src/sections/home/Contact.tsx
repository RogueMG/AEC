import type { ComponentType, SVGProps } from "react";
import { Mail, MessageCircle, Phone, PhoneCall } from "lucide-react";
import EnquiryForm from "@/components/contact/EnquiryForm";
import MapCard from "@/components/contact/MapCard";
import { contact, locations } from "@/data/site";

type QuickContact = {
  label: string;
  value: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  external?: boolean;
};

const quickContacts: QuickContact[] = [
  { label: "Call", value: contact.mobile.label, href: contact.mobile.href, icon: Phone },
  { label: "WhatsApp", value: contact.mobile.label, href: contact.whatsapp.href, icon: MessageCircle, external: true },
  { label: "Email", value: contact.email.label, href: contact.email.href, icon: Mail },
  { label: "Landline", value: contact.landline.label, href: contact.landline.href, icon: PhoneCall },
];

function Contact() {
  return (
    <section id="contact" className="section-y bg-ink text-surface">
      <div className="page grid gap-x-16 gap-y-block lg:grid-cols-[1.25fr_1fr]">
        <div className="min-w-0">
          <h2 className="type-title">Tell us what you need</h2>
          <p className="type-lead measure mt-6 text-ink-muted">
            Send a product list, a drawing or a part number. We will come back with availability
            and a quote.
          </p>
          <div className="mt-9">
            <EnquiryForm />
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="type-heading">Or reach us directly</h3>
          <ul className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {quickContacts.map(({ label, value, href, icon: Icon, external }) => (
              <li key={label}>
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="group flex items-start gap-3"
                >
                  <Icon className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="type-label block text-ink-muted">{label}</span>
                    <span className="link-rule mt-1 block tabular-nums break-words group-hover:text-signal">
                      {value}
                    </span>
                    {external && <span className="sr-only"> (opens in a new tab)</span>}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <ul className="mt-block grid gap-px bg-ink-line">
            {locations.map((location) => (
              <li key={location.id}>
                <MapCard location={location} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default Contact;
