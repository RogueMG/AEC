import type { PortableTextBlock } from "@portabletext/react";
import {
  seedBrands,
  seedCategories,
  seedProducts,
  type SeedImage,
  type SeedProduct,
} from "@/data/catalogue";
import { publicAsset } from "@/lib/publicAsset";
import { resolveTone } from "./tone";
import type {
  Brand,
  BrandSummary,
  Category,
  CategoryWithProducts,
  ContentImage,
  Product,
  ProductCard,
} from "./types";

// The local starter catalogue, shaped exactly like the Sanity query results.

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

const toImage = (image: SeedImage): ContentImage => ({ src: publicAsset(image.src), alt: image.alt });

function toBlocks(paragraphs: string[]): PortableTextBlock[] {
  return paragraphs.map((text, i) => ({
    _type: "block",
    _key: `p${i}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `s${i}`, text, marks: [] }],
  }));
}

function brandSummary(slug: string | undefined): BrandSummary | undefined {
  const brand = seedBrands.find((b) => b.slug === slug);
  return brand ? { name: brand.name, inHouse: brand.inHouse } : undefined;
}

function productsIn(categorySlug: string): SeedProduct[] {
  return seedProducts.filter((p) => p.category === categorySlug).sort(byOrder);
}

function toCard(product: SeedProduct): ProductCard {
  return {
    id: product.slug,
    slug: product.slug,
    title: product.title,
    summary: product.summary,
    image: toImage(product.images[0]),
    brand: brandSummary(product.brand),
    categorySlug: product.category,
  };
}

const orderedCategories = [...seedCategories].sort(byOrder);

export function localCategories(): Category[] {
  return orderedCategories.map((category, i) => ({
    id: category.slug,
    slug: category.slug,
    title: category.title,
    summary: category.summary,
    image: toImage(category.image),
    tone: resolveTone(category.tone, i),
    showOnHome: category.showOnHome,
    madeInHouse: category.madeInHouse,
    products: productsIn(category.slug).map((p) => ({ slug: p.slug, title: p.title })),
  }));
}

export function localCategory(slug: string): CategoryWithProducts | null {
  const category = localCategories().find((c) => c.slug === slug);
  if (!category) return null;
  return { ...category, productCards: productsIn(slug).map(toCard) };
}

export function localProduct(categorySlug: string, slug: string): Product | null {
  const product = seedProducts.find((p) => p.slug === slug && p.category === categorySlug);
  const category = localCategories().find((c) => c.slug === categorySlug);
  if (!product || !category) return null;
  return {
    ...toCard(product),
    category: { slug: category.slug, title: category.title, tone: category.tone },
    images: product.images.map(toImage),
    keyFeatures: product.keyFeatures,
    description: toBlocks(product.description),
    specifications: product.specifications,
    variants: product.variants,
    isSample: product.isSample,
    related: productsIn(categorySlug)
      .filter((p) => p.slug !== slug)
      .slice(0, 3)
      .map(toCard),
  };
}

export function localBrands(): Brand[] {
  return [...seedBrands].sort(byOrder).map((brand) => ({
    id: brand.slug,
    slug: brand.slug,
    name: brand.name,
    inHouse: brand.inHouse,
  }));
}
