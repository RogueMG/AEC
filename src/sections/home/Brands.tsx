import { Loading } from "@/components/content/ContentState";
import { countWord, dealerBrands } from "@/lib/content/brands";
import { useBrands } from "@/lib/content/hooks";
import { imageUrl } from "@/lib/content/image";

function Brands() {
  const brands = useBrands();
  const dealers = brands.status === "ready" ? dealerBrands(brands.data) : [];

  return (
    <section id="brands" className="section-y bg-surface">
      <div className="page">
        <div className="flex flex-wrap items-end justify-between gap-x-16 gap-y-4">
          <h2 className="type-title">Brands we deal in</h2>
          {dealers.length > 0 && (
            <p className="type-body measure text-steel">
              We are an authorized dealer for all {countWord(dealers.length)}, alongside the gloves and
              PPE we make ourselves.
            </p>
          )}
        </div>

        {brands.status === "loading" && <Loading className="mt-block h-64" label="Loading brands" />}
        {dealers.length > 0 && (
          <ul className="mt-block grid grid-cols-2 border-t border-l border-line lg:grid-cols-5">
            {dealers.map((brand) => (
              <li
                key={brand.id}
                className="grid h-24 place-items-center border-r border-b border-line px-4 lg:h-32"
              >
                {brand.logo ? (
                  <img
                    src={imageUrl(brand.logo, 320)}
                    alt={brand.name}
                    className="max-h-10 w-auto"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-center text-xl leading-none font-extrabold tracking-[-0.01em] [font-stretch:118%] lg:text-2xl">
                    {brand.name}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default Brands;
