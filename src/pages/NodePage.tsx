import { useParams } from "react-router";
import { Loading, LoadError } from "@/components/content/ContentState";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useNode } from "@/lib/content/hooks";
import CategoryView from "@/pages/CategoryView";
import NotFound from "@/pages/NotFound";
import ProductView from "@/pages/ProductView";

// /products/* at any depth: the API says whether the path is a category or a product.
function NodePage() {
  const path = (useParams()["*"] ?? "").replace(/^\/+|\/+$/g, "");
  const result = useNode(path);
  const node = result.status === "ready" ? result.data : null;
  usePageMeta(node ? node.title : null, node?.summary);

  if (result.status === "loading") {
    return (
      <div className="pt-(--spacing-header)">
        <Loading className="h-[30rem]" label="Loading" />
      </div>
    );
  }
  if (result.status === "error") return <LoadError className="pt-[calc(var(--spacing-header)+4rem)]" />;
  if (!node) return <NotFound />;

  // Keyed by path so per-page state (e.g. the gallery's selected image) resets on navigation.
  return node.kind === "category" ? (
    <CategoryView key={node.path} category={node} />
  ) : (
    <ProductView key={node.path} product={node} />
  );
}

export default NodePage;
