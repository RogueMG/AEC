// The site's own photos in public/images come in smaller copies ("<name>-640w.webp", "-800w",
// and "-1200w" when the original is wider), so phones don't download desktop-sized images.
// No imports: shared by the app (src/lib/images.ts) and the server (preload hints in server/seo.ts).

const ORIGINAL_WIDTH: Record<string, number> = {
  "about-floor": 1200,
  "cat-consumables": 1100,
  "cat-hardware-tools": 1100,
  "cat-mro": 1100,
  "cat-safety-ppe": 1100,
  "catalogue-workshop": 1200,
  "hero-sparks": 1800,
};
const COPIES = [640, 800, 1200];
const LOCAL = /^\/?images\/([a-z0-9-]+)\.webp$/;

/** A srcset for one of the site's own photos, or undefined for anything else (e.g. admin uploads). */
export function variantSrcSet(src: string, base = "/"): string | undefined {
  const name = LOCAL.exec(src)?.[1];
  const width = name ? ORIGINAL_WIDTH[name] : undefined;
  if (!name || !width) return undefined;
  const smaller = COPIES.filter((w) => w < width).map((w) => `${base}images/${name}-${w}w.webp ${w}w`);
  return [...smaller, `${base}images/${name}.webp ${width}w`].join(", ");
}

/** The smallest copy, for thumbnails; the original for anything without copies. */
export function smallestVariant(src: string, base = "/"): string {
  const name = LOCAL.exec(src)?.[1];
  return name && ORIGINAL_WIDTH[name] ? `${base}images/${name}-640w.webp` : src;
}

// How wide images show at each breakpoint, for the browser to pick a copy.
export const imageSizes = {
  full: "100vw",
  half: "(min-width: 1024px) 50vw, 100vw",
  tile: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  categoryHeader: "(min-width: 1024px) 46vw, 100vw",
  aboutPhoto: "(min-width: 1024px) 30vw, 80vw",
} as const;
