import { ArrowUpRight, Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contact, locations } from "@/data/site";

function Contact() {
  return (
    <section id="contact" className="section-y bg-ink text-surface">
      <div className="page grid gap-x-16 gap-y-block lg:grid-cols-[1.15fr_1fr]">
        <div>
          <h2 className="type-title">Tell us what you need</h2>
          <p className="type-lead measure mt-6 text-ink-muted">
            Send a product list, a drawing or a part number. We will come back with availability
            and a quote.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild>
              <a href={contact.mobile.href}>
                <Phone aria-hidden />
                Call {contact.mobile.label}
              </a>
            </Button>
            <Button asChild variant="outline-on-ink">
              <a href={contact.whatsapp.href} target="_blank" rel="noreferrer">
                <MessageCircle aria-hidden />
                Chat on WhatsApp
              </a>
            </Button>
          </div>

          <dl className="mt-block grid gap-x-12 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="type-label text-ink-muted">Email</dt>
              <dd className="mt-1.5">
                <a href={contact.email.href} className="link-rule inline-flex items-center gap-2">
                  <Mail className="size-4" aria-hidden />
                  {contact.email.label}
                </a>
              </dd>
            </div>
            <div>
              <dt className="type-label text-ink-muted">Landline</dt>
              <dd className="mt-1.5">
                <a href={contact.landline.href} className="link-rule tabular-nums">
                  {contact.landline.label}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <ul className="grid content-start gap-px bg-ink-line">
          {locations.map((location) => (
            <li key={location.id} className="bg-ink-raised p-6 sm:p-8">
              <h3 className="type-subhead">
                {location.name}, {location.place}
              </h3>
              <address className="type-small mt-3 max-w-[26rem] text-ink-muted not-italic">
                {location.address}
              </address>
              <a
                href={location.mapsHref}
                target="_blank"
                rel="noreferrer"
                className="type-label mt-5 inline-flex items-center gap-1.5 text-signal"
              >
                <span className="link-rule">Open in Google Maps</span>
                <ArrowUpRight className="size-4" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Contact;
