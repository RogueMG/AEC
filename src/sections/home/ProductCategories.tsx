import CategoryTiles from "@/components/content/CategoryTiles";
import { Loading, LoadError } from "@/components/content/ContentState";
import { useCategories } from "@/lib/content/hooks";

function ProductCategories() {
  const categories = useCategories();

  return (
    <section id="products" aria-labelledby="products-title">
      <h2 id="products-title" className="sr-only">
        Product categories
      </h2>
      {categories.status === "loading" && <Loading className="h-[38rem]" label="Loading products" />}
      {categories.status === "error" && <LoadError />}
      {categories.status === "ready" && (
        <CategoryTiles categories={categories.data.filter((c) => c.showOnHome)} />
      )}
    </section>
  );
}

export default ProductCategories;
