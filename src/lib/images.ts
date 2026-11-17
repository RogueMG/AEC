import { imageSizes, smallestVariant, variantSrcSet } from "@/lib/imageVariants";

// App-side helpers for the photo copies described in src/lib/imageVariants.ts, using the
// build's base path.
export const srcSetFor = (src: string) => variantSrcSet(src, import.meta.env.BASE_URL);
export const thumbnailFor = (src: string) => smallestVariant(src, import.meta.env.BASE_URL);
export const sizes = imageSizes;
