import type { ContentImage } from "./types";

const SANITY_CDN = "https://cdn.sanity.io/";

// Sanity CDN images are resized on request; linked images are used as given.
export function imageUrl(image: ContentImage, width: number): string {
  if (!image.src.startsWith(SANITY_CDN)) return image.src;
  const url = new URL(image.src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("fit", "max");
  url.searchParams.set("auto", "format");
  return url.toString();
}

export function imageSrcSet(image: ContentImage, widths: number[]): string | undefined {
  if (!image.src.startsWith(SANITY_CDN)) return undefined;
  return widths.map((w) => `${imageUrl(image, w)} ${w}w`).join(", ");
}
