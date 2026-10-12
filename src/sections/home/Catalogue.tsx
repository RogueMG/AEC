import { Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { company, contact } from "@/data/site";
import { publicAsset } from "@/lib/publicAsset";

const requestHref = `${contact.email.href}?subject=${encodeURIComponent("Catalogue request")}`;

function Catalogue() {
  return (
    <section id="catalogue" className="relative overflow-hidden bg-signal text-ink">
      {/* Same bands as the hero, mirrored in order, so the page closes the way it opened. */}
      <div
        aria-hidden
        className="cut absolute inset-y-0 -right-[18%] left-[58%] hidden origin-bottom-left md:flex"
      >
        <span className="basis-[9%] bg-teal" />
        <span className="relative basis-[52%] overflow-hidden bg-ink">
          <img
            src={publicAsset("images/catalogue-workshop.jpg")}
            alt=""
            loading="lazy"
            className="cut-inverse absolute inset-y-0 -left-24 h-full w-[calc(100%+12rem)] max-w-none object-cover"
          />
        </span>
        <span className="basis-[9%] bg-coral" />
        <span className="flex-1 bg-ink" />
      </div>

      <div className="page section-y relative">
        <div className="md:max-w-[52%]">
          <h2 className="type-title">The full range in one PDF</h2>
          <p className="type-lead measure mt-6">
            Company profile, product lines and the brands we carry, in a file you can forward to
            your purchase team.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
            {company.catalogueUrl ? (
              <Button asChild variant="ink">
                <a href={company.catalogueUrl} download>
                  <Download aria-hidden />
                  Download catalogue
                </a>
              </Button>
            ) : (
              <>
                <Button asChild variant="ink">
                  <a href={requestHref}>
                    <Mail aria-hidden />
                    Request the catalogue
                  </a>
                </Button>
                <p className="type-small font-medium">Direct download coming soon.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Catalogue;
