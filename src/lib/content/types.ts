// The shapes the public API returns (functions/api/*) and the pages render.
// Paths are slug chains under /products, e.g. "safety-ppe/gloves/cotton-knitted-gloves".

export type Tone = "coral" | "yellow" | "teal" | "navy";

export type ContentImage = { src: string; alt: string };

export type PathLink = { path: string; title: string };

export type BrandSummary = { name: string; inHouse: boolean };

export type Brand = BrandSummary & {
  id: number;
  slug: string;
  logo?: ContentImage;
};

// A category as a tile: enough to draw it and list what's inside.
export type CategorySummary = {
  id: number;
  slug: string;
  path: string;
  title: string;
  summary: string;
  image: ContentImage | null;
  tone: Tone;
  showOnHome: boolean;
  madeInHouse: boolean;
  subcategories: PathLink[];
  products: PathLink[];
};

// GET /api/tree: top-level categories, each with its sub-categories nested to any depth.
export type TreeCategory = CategorySummary & { children: TreeCategory[] };

export type ProductCard = {
  id: number;
  slug: string;
  path: string;
  title: string;
  summary: string;
  image: ContentImage | null;
  brand: BrandSummary | null;
};

export type Spec = { label: string; value: string };

// GET /api/node?path=…: a category page or a product page. `breadcrumb` lists the
// categories above it, starting at the top level.
export type CategoryNode = CategorySummary & {
  kind: "category";
  breadcrumb: PathLink[];
  children: CategorySummary[];
  productCards: ProductCard[];
};

export type ProductNode = ProductCard & {
  kind: "product";
  breadcrumb: PathLink[];
  category: { path: string; title: string; tone: Tone };
  images: ContentImage[];
  keyFeatures: string[];
  /** Sanitised HTML: paragraphs, h3 headings, bullet lists, bold and italic. */
  description: string;
  specifications: Spec[];
  variants: string[];
  isSample: boolean;
  related: ProductCard[];
};

export type CatalogueNode = CategoryNode | ProductNode;
