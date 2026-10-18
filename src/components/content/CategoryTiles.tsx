import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import SlantedPhoto from "@/components/content/SlantedPhoto";
import { tones } from "@/components/content/tones";
import type { Category } from "@/lib/content/types";
import { duration, ease } from "@/lib/motion";
import { cutFor } from "@/lib/cut";
import { cn } from "@/lib/utils";

// 14rem tall photo; the cut narrows on hover so the edge slides out.
const PHOTO_HEIGHT = 224;
const CUT = cutFor(PHOTO_HEIGHT);
const CUT_LIFTED = 28;
// Delay per column, so a row reveals left to right while stacked tiles on mobile don't wait.
const COLUMN_STAGGER = 0.14;
// Tiles list at most this many products before "and N more".
const LISTED = 4;

function CategoryTile({ category, headingLevel }: { category: Category; headingLevel: "h2" | "h3" }) {
  const tone = tones[category.tone];
  const [lifted, setLifted] = useState(false);
  const Heading = headingLevel;
  const href = `/products/${category.slug}`;
  const listed = category.products.slice(0, LISTED);
  const more = category.products.length - listed.length;

  return (
    <motion.article
      onHoverStart={() => setLifted(true)}
      onHoverEnd={() => setLifted(false)}
      onFocus={() => setLifted(true)}
      onBlur={() => setLifted(false)}
      className={cn("flex flex-col", tone.surface)}
    >
      <Link to={href} tabIndex={-1} aria-hidden>
        <SlantedPhoto
          image={category.image}
          edge="right"
          cut={CUT}
          liftedCut={CUT_LIFTED}
          lifted={lifted}
          columnStagger={COLUMN_STAGGER}
          sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="h-56"
        />
      </Link>

      <div className="flex flex-1 flex-col px-gutter pt-8 pb-10 xl:px-9">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Heading className="type-heading">
            <Link to={href} className="hover:underline hover:decoration-2 hover:underline-offset-4">
              {category.title}
            </Link>
          </Heading>
          {category.madeInHouse && (
            <span className={cn("type-label px-2 py-1", tone.chip)}>Made in-house</span>
          )}
        </div>
        <p className="type-body mt-3">{category.summary}</p>

        {listed.length > 0 && (
          <ul className={cn("type-small mt-6 border-t font-medium", tone.rule)}>
            {listed.map((product) => (
              <li key={product.slug} className={cn("border-b", tone.rule)}>
                <Link
                  to={`${href}/${product.slug}`}
                  className="block py-2.5 hover:underline hover:underline-offset-4"
                >
                  {product.title}
                </Link>
              </li>
            ))}
            {more > 0 && <li className={cn("border-b py-2.5", tone.rule)}>and {more} more</li>}
          </ul>
        )}

        <Link to={href} className="type-label mt-auto inline-flex items-center gap-2 self-start pt-8">
          <span className="link-rule">View {category.title}</span>
          <motion.span
            aria-hidden
            animate={{ x: lifted ? 6 : 0 }}
            transition={{ duration: duration.quick, ease: ease.out }}
          >
            <ArrowRight className="size-4" />
          </motion.span>
        </Link>
      </div>
    </motion.article>
  );
}

type CategoryTilesProps = { categories: Category[]; headingLevel?: "h2" | "h3" };

// Four to a row on wide screens; more categories wrap onto new rows.
function CategoryTiles({ categories, headingLevel = "h3" }: CategoryTilesProps) {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4">
      {categories.map((category) => (
        <CategoryTile key={category.id} category={category} headingLevel={headingLevel} />
      ))}
    </div>
  );
}

export default CategoryTiles;
