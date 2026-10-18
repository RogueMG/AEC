import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { ArrowRight } from "lucide-react";
import { productCategories, type CategoryTone, type ProductCategory } from "@/data/products";
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

// Photo height is fixed so the slanted right edge sits on the site's cut angle:
// offset = height × tan(16°). 14rem tall → 64px across.
const PHOTO_HEIGHT = "h-56";
const CUT = 64;
const CUT_HOVER = 28;
// Delay per column, so a row reveals left to right while stacked tiles on mobile don't wait.
const COLUMN_STAGGER = 0.14;

type TileProps = { category: ProductCategory };

function CategoryTile({ category }: TileProps) {
  const tone = tones[category.tone];
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const revealed = useInView(ref, { once: true, amount: 0.4 });

  // progress: 0 = photo hidden behind the tile colour, 1 = fully revealed.
  const progress = useMotionValue(reduced ? 1 : 0);
  const cut = useMotionValue(CUT);
  const reach = useTransform(progress, (p) => `${(p * 100).toFixed(2)}%`);
  const clipPath = useMotionTemplate`polygon(0 0, ${reach} 0, calc(${reach} - ${cut}px) 100%, 0 100%)`;

  useEffect(() => {
    const el = ref.current;
    if (!revealed || reduced || !el) return;
    const column = Math.round(el.offsetLeft / el.offsetWidth);
    const controls = animate(progress, 1, {
      duration: 1.1,
      ease: ease.inOut,
      delay: column * COLUMN_STAGGER,
    });
    return () => controls.stop();
  }, [revealed, reduced, progress]);

  const setHover = (on: boolean) => {
    animate(cut, on ? CUT_HOVER : CUT, { duration: duration.base, ease: ease.out });
  };

  return (
    <motion.article
      ref={ref}
      initial="rest"
      animate="rest"
      whileHover="hover"
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className={cn("flex flex-col", tone.tile)}
    >
      {/* Full-bleed photo; its right edge leans on the same cut as the hero bands. */}
      <motion.div className={cn("relative overflow-hidden", PHOTO_HEIGHT)} style={{ clipPath }}>
        <motion.img
          src={publicAsset(category.image)}
          alt={category.imageAlt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          variants={{ rest: { scale: 1 }, hover: { scale: 1.05 } }}
          transition={{ duration: duration.slow, ease: ease.out }}
        />
      </motion.div>

      <div className="flex flex-1 flex-col px-gutter pt-8 pb-10 xl:px-9">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
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
      </div>
    </motion.article>
  );
}

function ProductCategories() {
  return (
    <section id="products" aria-labelledby="products-title">
      <h2 id="products-title" className="sr-only">
        Product categories
      </h2>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4">
        {productCategories.map((category) => (
          <CategoryTile key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}

export default ProductCategories;
