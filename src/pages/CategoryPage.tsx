import { useParams } from "react-router";
import Breadcrumbs from "@/components/content/Breadcrumbs";
import { Loading, LoadError } from "@/components/content/ContentState";
import EnquiryBand from "@/components/content/EnquiryBand";
import ProductCard from "@/components/content/ProductCard";
import SlantedPhoto from "@/components/content/SlantedPhoto";
import { tones } from "@/components/content/tones";
import { usePageMeta } from "@/hooks/usePageMeta";
import { countWord } from "@/lib/content/brands";
import { useCategory } from "@/lib/content/hooks";
import { cutFor } from "@/lib/cut";
import { cn } from "@/lib/utils";
import NotFound from "@/pages/NotFound";

// The photo fills the band below the header on wide screens; it is about this tall.
const BAND_PHOTO_HEIGHT = 480;

function CategoryPage() {
  const { categorySlug = "" } = useParams();
  const result = useCategory(categorySlug);
  const category = result.status === "ready" ? result.data : null;
  usePageMeta(category ? category.title : null, category?.summary);

  if (result.status === "loading") {
    return (
      <div className="pt-(--spacing-header)">
        <Loading className="h-[30rem]" label="Loading category" />
      </div>
    );
  }
  if (result.status === "error") return <LoadError className="pt-[calc(var(--spacing-header)+4rem)]" />;
  if (!category) return <NotFound what="category" />;

  const tone = tones[category.tone];
  const count = category.productCards.length;

  return (
    <>
      <section className={cn("relative overflow-hidden pt-(--spacing-header)", tone.surface)}>
        <SlantedPhoto
          image={category.image}
          edge="left"
          cut={cutFor(BAND_PHOTO_HEIGHT)}
          revealOn="mount"
          loading="eager"
          sizes="(min-width: 1024px) 46vw, 100vw"
          className="absolute top-(--spacing-header) right-0 bottom-0 hidden w-[46%] lg:block"
        />
        <div className="page relative py-14 lg:min-h-[30rem] lg:py-20">
          <div className="lg:max-w-[48%]">
            <Breadcrumbs
              items={[
                { label: "Home", to: "/" },
                { label: "Products", to: "/products" },
                { label: category.title },
              ]}
            />
            <h1 className="type-display mt-6">{category.title}</h1>
            <p className="type-lead measure mt-6">{category.summary}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className={cn("type-label px-2.5 py-1", tone.chip)}>
                {count === 1 ? "One product" : `${countWord(count).replace(/^./, (c) => c.toUpperCase())} products`}
              </span>
              {category.madeInHouse && (
                <span className={cn("type-label px-2.5 py-1", tone.chip)}>Made in-house</span>
              )}
            </div>
          </div>
        </div>
        <SlantedPhoto
          image={category.image}
          edge="left"
          cut={cutFor(224)}
          revealOn="mount"
          loading="eager"
          className="h-56 lg:hidden"
        />
      </section>

      <section className="section-y bg-paper">
        <div className="page">
          <h2 className="type-title">In this category</h2>
          {count > 0 ? (
            <div className="mt-block grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {category.productCards.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="type-lead measure mt-6 text-steel">
              No products are listed here yet. Ask us what we stock in {category.title}.
            </p>
          )}
        </div>
      </section>

      <EnquiryBand
        title={`Need something in ${category.title}?`}
        body="Tell us the product, the quantity and where it needs to go. We will reply with availability and a quote."
        subject={`Enquiry: ${category.title}`}
        message={`Hello, I'd like to enquire about ${category.title}.`}
      />
    </>
  );
}

export default CategoryPage;
