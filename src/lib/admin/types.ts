// Shapes exchanged between the admin screens and /api/admin/* (server/admin.ts).

import type { Spec } from "../content/types";

export type Tone = "auto" | "coral" | "yellow" | "teal" | "navy";
export const TONES: Tone[] = ["auto", "coral", "yellow", "teal", "navy"];

/** An image is an uploaded file in R2 (key) or a link (url); `src` is ready to display. */
export type AdminImage = { key: string | null; url: string | null; alt: string; src: string };
export type ImageInput = { key?: string | null; url?: string | null; alt: string };

export type AdminCategory = {
  id: number;
  parentId: number | null;
  slug: string;
  title: string;
  summary: string;
  image: AdminImage | null;
  tone: Tone;
  showOnHome: boolean;
  madeInHouse: boolean;
  sortOrder: number;
};

export type AdminProductItem = {
  id: number;
  categoryId: number;
  slug: string;
  title: string;
  published: boolean;
  isSample: boolean;
  sortOrder: number;
  thumb: string | null;
};

/** GET /api/admin/tree: flat lists, including drafts; the screens build the tree. */
export type AdminTree = { categories: AdminCategory[]; products: AdminProductItem[] };

export type AdminProduct = {
  id: number;
  categoryId: number;
  brandId: number | null;
  slug: string;
  title: string;
  summary: string;
  description: string;
  keyFeatures: string[];
  specifications: Spec[];
  variants: string[];
  isSample: boolean;
  published: boolean;
  sortOrder: number;
  images: AdminImage[];
};

export type AdminBrand = {
  id: number;
  slug: string;
  name: string;
  inHouse: boolean;
  logo: AdminImage | null;
  sortOrder: number;
};

export type CategoryInput = {
  parentId: number | null;
  slug?: string;
  title: string;
  summary?: string;
  image?: ImageInput | null;
  tone?: Tone;
  showOnHome?: boolean;
  madeInHouse?: boolean;
};

export type ProductInput = {
  categoryId: number;
  brandId?: number | null;
  slug?: string;
  title: string;
  summary?: string;
  description?: string;
  keyFeatures?: string[];
  specifications?: Spec[];
  variants?: string[];
  isSample?: boolean;
  published?: boolean;
  images?: ImageInput[];
};

export type BrandInput = {
  slug?: string;
  name: string;
  inHouse?: boolean;
  logo?: ImageInput | null;
};

export type ReorderInput = { parentId: number | null; ids: number[] };

export type UploadResult = { key: string; src: string };

/** Every admin error response has this shape. */
export type AdminError = { error: string; field?: string };
