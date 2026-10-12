import {
  Anvil,
  Building2,
  Car,
  Cpu,
  Factory,
  Package,
  Pill,
  Plane,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";
import { industries } from "@/data/industries";

const icons: Record<string, LucideIcon> = {
  automobile: Car,
  electronics: Cpu,
  "general-manufacturing": Factory,
  "forging-steel": Anvil,
  fmcg: ShoppingBasket,
  "defense-aerospace": Plane,
  pharmaceutical: Pill,
  "consumer-goods": Package,
  "construction-infrastructure": Building2,
};

function Industries() {
  return (
    <section id="industries" className="section-y bg-ink text-surface">
      <div className="page grid gap-x-16 gap-y-block lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 className="type-title">Industries we serve</h2>
          <p className="type-lead mt-6 text-ink-muted">
            Nine sectors buy from us, each with its own standards for safety, finish and uptime.
          </p>
        </div>

        <ul className="grid border-t border-l border-ink-line sm:grid-cols-2 md:grid-cols-3">
          {industries.map((industry) => {
            const Icon = icons[industry.id];
            return (
              <li
                key={industry.id}
                className="group flex items-center gap-4 border-r border-b border-ink-line p-5 transition-colors duration-150 hover:bg-ink-raised md:min-h-36 md:flex-col md:items-start md:justify-between md:p-6"
              >
                <Icon
                  aria-hidden
                  strokeWidth={1.5}
                  className="size-7 shrink-0 text-teal transition-colors duration-150 group-hover:text-signal md:size-8"
                />
                <span className="type-subhead">{industry.name}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default Industries;
