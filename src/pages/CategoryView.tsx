import Breadcrumbs from "@/components/content/Breadcrumbs";
import CategoryTiles from "@/components/content/CategoryTiles";
import EnquiryBand from "@/components/content/EnquiryBand";
import ProductCard from "@/components/content/ProductCard";
import SlantedPhoto from "@/components/content/SlantedPhoto";
import { tones } from "@/components/content/tones";
import { countWord } from "@/lib/content/brands";
import type { CategoryNode } from "@/lib/content/types";
import { cutFor } from "@/lib/cut";
import { sizes } from "@/lib/images";
import { cn } from "@/lib/utils";

// The photo fills the band below the header on wide screens; it is about this tall.
const BAND_PHOTO_HEIGHT = 480;

const capitalise = (text: string) => text.replace(/^./, (c) => c.toUpperCase());

function countLabel(count: number, one: string, many: string) {
  return count === 1 ? `One ${one}` : `${capitalise(countWord(count))} ${many}`;
}

function CategoryView({ category }: { category: CategoryNode }) {
  const tone = tones[category.tone];
  const productCount = category.productCards.length;
  const childCount = category.children.length;

  return (
    <>
      <section className={cn("relative overflow-hidden pt-(--spacing-header)", tone.surface)}>
        {category.image && (
          <SlantedPhoto
            image={category.image}
            edge="left"
            cut={cutFor(BAND_PHOTO_HEIGHT)}
            revealOn="mount"
            loading="eager"
            sizes={sizes.categoryHeader}
            className="absolute top-(--spacing-header) right-0 bottom-0 hidden w-[46%] lg:block"
          />
        )}
        <div className={cn("page relative py-14 lg:py-20", category.image && "lg:min-h-[30rem]")}>
          <div className={cn(category.image && "lg:max-w-[48%]")}>
            <Breadcrumbs
              items={[
                { label: "Home", to: "/" },
                { label: "Products", to: "/products" },
                ...category.breadcrumb.map((crumb) => ({ label: crumb.title, to: `/products/${crumb.path}` })),
                { label: category.title },
              ]}
            />
            <h1 className="type-display mt-6">{category.title}</h1>
            {category.summary && <p className="type-lead measure mt-6">{category.summary}</p>}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {childCount > 0 && (
                <span className={cn("type-label px-2.5 py-1", tone.chip)}>
                  {countLabel(childCount, "range", "ranges")}
                </span>
              )}
              <span className={cn("type-label px-2.5 py-1", tone.chip)}>
                {countLabel(productCount, "product", "products")}
              </span>
              {category.madeInHouse && (
                <span className={cn("type-label px-2.5 py-1", tone.chip)}>Made in-house</span>
              )}
            </div>
          </div>
        </div>
        {category.image && (
          <SlantedPhoto
            image={category.image}
            edge="left"
            cut={cutFor(224)}
            revealOn="mount"
            loading="eager"
            sizes={sizes.categoryHeader}
            className="h-56 lg:hidden"
          />
        )}
      </section>

      {childCount > 0 && (
        <section aria-labelledby="ranges-title">
          <h2 id="ranges-title" className="sr-only">
            Ranges in {category.title}
          </h2>
          <CategoryTiles categories={category.children} />
        </section>
      )}

      {(productCount > 0 || childCount === 0) && (
        <section className="section-y bg-paper">
          <div className="page">
            <h2 className="type-title">{childCount > 0 ? `Also in ${category.title}` : "In this category"}</h2>
            {productCount > 0 ? (
              <div className="mt-block grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {category.productCards.map((product, i) => (
                  <ProductCard key={product.id} product={product} priority={i === 0} />
                ))}
              </div>
            ) : (
              <p className="type-lead measure mt-6 text-steel">
                No products are listed here yet. Ask us what we stock in {category.title}.
              </p>
            )}
          </div>
        </section>
      )}

      <EnquiryBand
        title={`Need something in ${category.title}?`}
        body="Tell us the product, the quantity and where it needs to go. We will reply with availability and a quote."
        subject={`Enquiry: ${category.title}`}
        message={`Hello, I'd like to enquire about ${category.title}.`}
        interestPath={category.path}
      />
    </>
  );
}

export default CategoryView;
