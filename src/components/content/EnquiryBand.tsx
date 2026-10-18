import { Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emailHref, whatsappHref } from "@/lib/enquiry";

type EnquiryBandProps = { title: string; body: string; subject: string; message: string };

function EnquiryBand({ title, body, subject, message }: EnquiryBandProps) {
  return (
    <section className="bg-ink text-surface">
      <div className="page flex flex-col gap-8 py-14 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="type-heading">{title}</h2>
          <p className="type-body measure mt-3 text-ink-muted">{body}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <a href={whatsappHref(message)} target="_blank" rel="noreferrer">
              <MessageCircle aria-hidden />
              Chat on WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline-on-ink">
            <a href={emailHref(subject, message)}>
              <Mail aria-hidden />
              Email us
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default EnquiryBand;
