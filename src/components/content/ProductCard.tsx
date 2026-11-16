import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import type { ProductCard as ProductCardData } from "@/lib/content/types";

function ProductCard({ product }: { product: ProductCardData }) {
  const href = `/products/${product.path}`;

  return (
    <article className="group relative flex flex-col border border-line bg-surface transition-colors duration-200 hover:border-ink">
      <div className="aspect-[4/3] overflow-hidden bg-paper">
        {product.image && (
          <img
            src={product.image.src}
            alt={product.image.alt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        {product.brand && (
          <p className="type-label text-steel">
            {product.brand.inHouse ? "Made in-house" : product.brand.name}
          </p>
        )}
        <h3 className="type-subhead mt-1.5">
          {/* The link covers the whole card. */}
          <Link to={href} className="after:absolute after:inset-0">
            {product.title}
          </Link>
        </h3>
        <p className="type-small mt-2 text-steel">{product.summary}</p>
        <span aria-hidden className="type-label mt-auto inline-flex items-center gap-2 pt-6">
          View product
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </div>
    </article>
  );
}

export default ProductCard;
