import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";

function NotFound({ what = "page" }: { what?: "page" | "product" | "category" }) {
  usePageMeta("Page not found");

  return (
    <section className="bg-surface pt-(--spacing-header)">
      <div className="page section-y">
        <h1 className="type-display">This {what} isn’t here</h1>
        <p className="type-lead measure mt-6 text-steel">
          The link may be old, or the {what} may have moved. Browse the product range, or go back to
          the home page.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild variant="ink">
            <Link to="/products">Browse products</Link>
          </Button>
          <Button asChild variant="outline-on-light">
            <Link to="/">Go to the home page</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default NotFound;
