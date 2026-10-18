// GROQ queries for the site, also documented for developers in docs/CONTENT_API.md.
// Kept free of imports so scripts can run them outside the app (see scripts/test-queries.ts).

const IMAGE = `{
  "src": coalesce(upload.asset->url, url),
  alt,
  "width": upload.asset->metadata.dimensions.width,
  "height": upload.asset->metadata.dimensions.height
}`;

const CARD_FIELDS = `
  "id": _id,
  "slug": slug.current,
  title,
  summary,
  "image": images[0]${IMAGE},
  "brand": brand->{ name, "inHouse": coalesce(inHouse, false) },
  "categorySlug": category->slug.current`;

const CARD = `{${CARD_FIELDS}
}`;

// Position of a category in display order, used to cycle tile colours set to "Automatic".
const POSITION = `count(*[_type == "category" && (order < ^.order || (order == ^.order && title < ^.title))])`;

const CATEGORY_FIELDS = `
  "id": _id,
  "slug": slug.current,
  title,
  summary,
  "image": image${IMAGE},
  tone,
  "position": ${POSITION},
  "showOnHome": coalesce(showOnHome, true),
  "madeInHouse": coalesce(madeInHouse, false),
  "products": *[_type == "product" && references(^._id)] | order(order asc, title asc) {
    "slug": slug.current, title
  }`;

export const queries = {
  categories: `*[_type == "category"] | order(order asc, title asc) {${CATEGORY_FIELDS}
  }`,

  category: `*[_type == "category" && slug.current == $slug][0] {${CATEGORY_FIELDS},
    "productCards": *[_type == "product" && references(^._id)] | order(order asc, title asc) ${CARD}
  }`,

  product: `*[_type == "product" && slug.current == $slug && category->slug.current == $category][0] {${CARD_FIELDS},
    "category": category->{ "slug": slug.current, title, tone, "position": ${POSITION} },
    "images": images[]${IMAGE},
    "keyFeatures": coalesce(keyFeatures, []),
    "description": coalesce(description, []),
    "specifications": coalesce(specifications[]{ label, value }, []),
    "variants": coalesce(variants, []),
    "isSample": coalesce(isSample, false),
    "related": *[_type == "product" && category._ref == ^.category._ref && _id != ^._id]
      | order(order asc, title asc) [0...3] ${CARD}
  }`,

  brands: `*[_type == "brand"] | order(order asc, name asc) {
    "id": _id,
    "slug": slug.current,
    name,
    "inHouse": coalesce(inHouse, false),
    "logo": logo${IMAGE}
  }`,
};
