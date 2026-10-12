import { brands } from "@/data/brands";
import { publicAsset } from "@/lib/publicAsset";

function Brands() {
  return (
    <section id="brands" className="section-y bg-surface">
      <div className="page">
        <div className="flex flex-wrap items-end justify-between gap-x-16 gap-y-4">
          <h2 className="type-title">Brands we deal in</h2>
          <p className="type-body measure text-steel">
            We are an authorized dealer for all {brands.length}, alongside the gloves and PPE we
            make ourselves.
          </p>
        </div>

        <ul className="mt-block grid grid-cols-2 border-t border-l border-line lg:grid-cols-5">
          {brands.map((brand) => (
            <li
              key={brand.id}
              className="grid h-24 place-items-center border-r border-b border-line px-4 lg:h-32"
            >
              {brand.logo ? (
                <img
                  src={publicAsset(brand.logo)}
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
      </div>
    </section>
  );
}

export default Brands;
