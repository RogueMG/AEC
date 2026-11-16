import { localBrands, localCategories, localCategory, localProduct } from "./local";
import { useResource } from "./store";

// Content currently comes from the local starter catalogue. These hooks are the only place
// the pages get content from, so switching to the Cloudflare API only changes this file.

export function useCategories() {
  return useResource("categories", localCategories);
}

export function useCategory(slug: string) {
  return useResource(`category:${slug}`, () => localCategory(slug));
}

export function useProduct(categorySlug: string, slug: string) {
  return useResource(`product:${categorySlug}/${slug}`, () => localProduct(categorySlug, slug));
}

export function useBrands() {
  return useResource("brands", localBrands);
}
