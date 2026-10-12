import { Button } from "@/components/ui/button";
import { company, locations } from "@/data/site";
import { brands } from "@/data/brands";
import { publicAsset } from "@/lib/publicAsset";

const reasons = [
  {
    title: "We make what we sell",
    body: "Our knitted gloves and PPE come off our own floor in Sriperumbudur, so quality and lead times are ours to control.",
  },
  {
    title: `Authorized dealer for ${brands.length} brands`,
    body: "Stanley, Bosch, Karam and seven more, supplied by us as an authorized dealer alongside our own lines.",
  },
  {
    title: `On the job since ${company.established}`,
    body: "More than 25 years of supplying nine sectors, from automobile lines to pharmaceutical plants.",
  },
];

// The company's registration facts, set out like an equipment rating plate.
const plateRows = [
  { label: "Established", value: String(company.established) },
  { label: "Business", value: "Manufacturing and industrial supply" },
  { label: "MSME Udyam no.", value: company.msmeUdyam },
  ...locations.map((location) => ({ label: location.name, value: location.place })),
  { label: "Serving", value: company.region },
];

function RatingPlate() {
  return (
    <div className="relative bg-signal p-2 text-ink">
      <div className="border-2 border-ink px-6 pt-6 pb-2 sm:px-8">
        <div className="flex items-center gap-3 border-b-2 border-ink pb-5">
          <img src={publicAsset("images/logo-mark.png")} alt="" className="size-10" />
          <p className="type-subhead">{company.name}</p>
        </div>
        <dl>
          {plateRows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[8.5rem_1fr] items-baseline gap-4 border-b border-ink/30 py-3 last:border-b-0"
            >
              <dt className="type-label">{row.label}</dt>
              <dd className="font-semibold tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function About() {
  return (
    <section id="about" className="section-y bg-paper">
      <div className="page grid gap-x-16 gap-y-block lg:grid-cols-[1.15fr_1fr]">
        <div>
          <h2 className="type-title">Serving India’s manufacturing industry since 1999</h2>
          <p className="type-lead measure mt-6 text-steel">
            Asiatic Engineering Co. is a Chennai manufacturer and industrial supplier. Procurement,
            quality and engineering teams come to us for safety gear, finishing tools and the
            everyday consumables that keep a plant running.
          </p>

          <ul className="mt-block grid gap-8 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {reasons.map((reason) => (
              <li key={reason.title} className="border-t-[3px] border-ink pt-4">
                <h3 className="type-subhead">{reason.title}</h3>
                <p className="type-small mt-2 text-steel">{reason.body}</p>
              </li>
            ))}
          </ul>

          <Button asChild variant="outline-on-light" className="mt-block">
            <a href="#contact">Talk to us</a>
          </Button>
        </div>

        <div className="relative lg:pt-2">
          <div className="cut mr-20 ml-10 h-56 origin-bottom-left overflow-hidden sm:h-64">
            <img
              src={publicAsset("images/about-floor.jpg")}
              alt="Workers at an assembly line on a factory floor"
              loading="lazy"
              className="cut-inverse absolute inset-y-0 -left-20 h-full w-[calc(100%+10rem)] max-w-none object-cover"
            />
          </div>
          <div className="relative -mt-12 sm:mr-12">
            <RatingPlate />
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
