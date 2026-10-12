import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { productCategories, type CategoryTone } from "@/data/products";
import { duration, ease } from "@/lib/motion";
import { publicAsset } from "@/lib/publicAsset";
import { cn } from "@/lib/utils";

const tones: Record<CategoryTone, { tile: string; rule: string; chip: string }> = {
  coral: { tile: "bg-coral text-ink", rule: "border-ink/25", chip: "bg-ink text-coral" },
  yellow: { tile: "bg-signal text-ink", rule: "border-ink/25", chip: "bg-ink text-signal" },
  teal: { tile: "bg-teal text-ink", rule: "border-ink/25", chip: "bg-ink text-teal" },
  navy: {
    tile: "bg-ink-raised text-surface",
    rule: "border-surface/25",
    chip: "bg-surface text-ink",
  },
};

function ProductCategories() {
  return (
    <section id="products" aria-labelledby="products-title">
      <h2 id="products-title" className="sr-only">
        Product categories
      </h2>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4">
        {productCategories.map((category) => {
          const tone = tones[category.tone];
          return (
            <motion.article
              key={category.id}
              initial="rest"
              whileHover="hover"
              whileFocus="hover"
              className={cn("flex flex-col px-gutter py-10 xl:px-9", tone.tile)}
            >
              {/* Photo leans on the same cut as the hero bands. */}
              <div className="cut relative mr-12 h-40 origin-bottom-left overflow-hidden">
                <motion.img
                  src={publicAsset(category.image)}
                  alt={category.imageAlt}
                  loading="lazy"
                  className="cut-inverse absolute inset-y-0 -left-12 h-full w-[calc(100%+6rem)] max-w-none object-cover"
                  variants={{ rest: { scale: 1 }, hover: { scale: 1.08 } }}
                  transition={{ duration: duration.slow, ease: ease.out }}
                />
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
                <h3 className="type-heading">{category.name}</h3>
                {category.madeInHouse && (
                  <span className={cn("type-label px-2 py-1", tone.chip)}>Made in-house</span>
                )}
              </div>
              <p className="type-body mt-3">{category.summary}</p>

              <ul className={cn("type-small mt-6 border-t font-medium", tone.rule)}>
                {category.items.map((item) => (
                  <li key={item} className={cn("border-b py-2.5", tone.rule)}>
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className="type-label mt-auto inline-flex items-center gap-2 self-start pt-8"
              >
                <span className="link-rule">Enquire about {category.name}</span>
                <motion.span
                  aria-hidden
                  variants={{ rest: { x: 0 }, hover: { x: 6 } }}
                  transition={{ duration: duration.quick, ease: ease.out }}
                >
                  <ArrowRight className="size-4" />
                </motion.span>
              </a>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

export default ProductCategories;
