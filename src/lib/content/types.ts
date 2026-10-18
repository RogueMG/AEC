import type { PortableTextBlock } from "@portabletext/react";

// The shapes the site renders. Both the Sanity queries and the local fallback return these.

export type Tone = "coral" | "yellow" | "teal" | "navy";

export type ContentImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export type BrandSummary = { name: string; inHouse: boolean };

export type Brand = BrandSummary & {
  id: string;
  slug: string;
  logo?: ContentImage;
};

export type ProductLink = { slug: string; title: string };

export type Category = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  image: ContentImage;
  tone: Tone;
  showOnHome: boolean;
  madeInHouse: boolean;
  products: ProductLink[];
};

export type ProductCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  image: ContentImage;
  brand?: BrandSummary;
  categorySlug: string;
};

export type Spec = { label: string; value: string };

export type Product = ProductCard & {
  category: { slug: string; title: string; tone: Tone };
  images: ContentImage[];
  keyFeatures: string[];
  description: PortableTextBlock[];
  specifications: Spec[];
  variants: string[];
  isSample: boolean;
  related: ProductCard[];
};

export type CategoryWithProducts = Category & { productCards: ProductCard[] };
