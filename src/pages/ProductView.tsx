import { Link } from "react-router";
import { Mail, MessageCircle } from "lucide-react";
import Breadcrumbs from "@/components/content/Breadcrumbs";
import Gallery from "@/components/content/Gallery";
import ProductCard from "@/components/content/ProductCard";
import RichText from "@/components/content/RichText";
import { tones } from "@/components/content/tones";
import { Button } from "@/components/ui/button";
import type { ProductNode } from "@/lib/content/types";
import { emailHref, whatsappHref } from "@/lib/enquiry";
import { cn } from "@/lib/utils";

function ProductView({ product }: { product: ProductNode }) {
  const tone = tones[product.category.tone];
  const categoryHref = `/products/${product.category.path}`;
  const message = `Hello, I'd like a quote for ${product.title} (${product.category.title}).`;
  const hasDetails = product.description.length > 0 || product.specifications.length > 0;

  return (
    <>
      <section className="bg-surface pt-(--spacing-header)">
        <div className="page py-10 lg:py-14">
          <Breadcrumbs
            className="text-steel"
            items={[
              { label: "Products", to: "/products" },
              ...product.breadcrumb.map((crumb) => ({ label: crumb.title, to: `/products/${crumb.path}` })),
              { label: product.title },
            ]}
          />

          <div className="mt-8 grid gap-x-16 gap-y-10 lg:grid-cols-[1.15fr_1fr]">
            <Gallery images={product.images} accent={tone.dot} />

            <div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link to={categoryHref} className={cn("type-label px-2.5 py-1", tone.surface)}>
                  {product.category.title}
                </Link>
                {product.brand && (
                  <span className="type-label text-steel">
                    {product.brand.inHouse ? "Made in-house" : `Brand: ${product.brand.name}`}
                  </span>
                )}
              </div>

              <h1 className="type-title mt-5">{product.title}</h1>
              {product.isSample && (
                <p className="type-small mt-4 border-l-[3px] border-signal pl-3 text-steel">
                  Sample listing. Details are still to be confirmed by Asiatic Engineering.
                </p>
              )}
              <p className="type-lead mt-5 text-steel">{product.summary}</p>

              {product.variants.length > 0 && (
                <div className="mt-8">
                  <h2 className="type-label">Sizes and variants</h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {product.variants.map((variant) => (
                      <li key={variant} className="type-small border border-line px-3 py-1.5 font-medium">
                        {variant}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="ink">
                  <a href={whatsappHref(message)} target="_blank" rel="noreferrer">
                    <MessageCircle aria-hidden />
                    Ask for a quote on WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline-on-light">
                  <a href={emailHref(`Quote request: ${product.title}`, message)}>
                    <Mail aria-hidden />
                    Email us
                  </a>
                </Button>
              </div>

              {product.keyFeatures.length > 0 && (
                <div className="mt-10 border-t border-line pt-8">
                  <h2 className="type-subhead">Key features</h2>
                  <ul className="mt-4 space-y-3">
                    {product.keyFeatures.map((feature) => (
                      <li key={feature} className="type-body flex gap-3">
                        <span aria-hidden className={cn("mt-2.5 size-2 shrink-0", tone.dot)} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {hasDetails && (
        <section className="section-y bg-paper">
          <div className="page grid gap-x-16 gap-y-block lg:grid-cols-[1.15fr_1fr]">
            {product.description.length > 0 && (
              <div>
                <h2 className="type-heading">About this product</h2>
                <div className="measure mt-6">
                  <RichText html={product.description} />
                </div>
              </div>
            )}
            {product.specifications.length > 0 && (
              <div>
                <h2 className="type-heading">Specifications</h2>
                <dl className="mt-6 border-t-2 border-ink">
                  {product.specifications.map((spec) => (
                    <div
                      key={spec.label}
                      className="grid grid-cols-[minmax(7rem,40%)_1fr] items-baseline gap-4 border-b border-line py-3"
                    >
                      <dt className="type-label text-steel">{spec.label}</dt>
                      <dd className="font-medium">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </section>
      )}

      {product.related.length > 0 && (
        <section className="section-y bg-surface">
          <div className="page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="type-title">More in {product.category.title}</h2>
              <Link to={categoryHref} className="type-label link-rule">
                View all {product.category.title}
              </Link>
            </div>
            <div className="mt-block grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {product.related.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default ProductView;
