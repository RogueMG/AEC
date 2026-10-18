import { cmsEnabled } from "./config";
import { localBrands, localCategories, localCategory, localProduct } from "./local";
import { fetchBrands, fetchCategories, fetchCategory, fetchProduct } from "./sanity";
import { useResource } from "./store";

export function useCategories() {
  return useResource("categories", cmsEnabled ? fetchCategories : localCategories);
}

export function useCategory(slug: string) {
  return useResource(`category:${slug}`, () =>
    cmsEnabled ? fetchCategory(slug) : localCategory(slug),
  );
}

export function useProduct(categorySlug: string, slug: string) {
  return useResource(`product:${categorySlug}/${slug}`, () =>
    cmsEnabled ? fetchProduct(categorySlug, slug) : localProduct(categorySlug, slug),
  );
}

export function useBrands() {
  return useResource("brands", cmsEnabled ? fetchBrands : localBrands);
}
