import Breadcrumbs from "@/components/content/Breadcrumbs";
import CategoryTiles from "@/components/content/CategoryTiles";
import { Loading, LoadError } from "@/components/content/ContentState";
import EnquiryBand from "@/components/content/EnquiryBand";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useCategories } from "@/lib/content/hooks";

function ProductsIndex() {
  const categories = useCategories();
  usePageMeta(
    "Products",
    "Industrial gloves and PPE from our own factory, plus tools, consumables and MRO supplies from Asiatic Engineering Co., Chennai.",
  );

  return (
    <>
      <section className="bg-surface pt-(--spacing-header)">
        <div className="page py-14 lg:py-20">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Products" }]} className="text-steel" />
          <h1 className="type-display mt-6">Products</h1>
          <p className="type-lead measure mt-6 text-steel">
            Gloves and PPE from our own factory, and tools, consumables and MRO supplies as an
            authorized dealer. Pick a category to see what we stock.
          </p>
        </div>
      </section>

      {categories.status === "loading" && <Loading className="h-[38rem]" label="Loading products" />}
      {categories.status === "error" && <LoadError />}
      {categories.status === "ready" && (
        <CategoryTiles categories={categories.data} headingLevel="h2" />
      )}

      <EnquiryBand
        title="Not listed here? Ask us."
        body="Send a part number, a drawing or a product list and we will tell you what we can supply."
        subject="Product enquiry"
        message="Hello, I'm looking for the following products:"
      />
    </>
  );
}

export default ProductsIndex;
