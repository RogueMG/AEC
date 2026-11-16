import { fetchBrands, fetchNode, fetchTree } from "./api";
import { useResource } from "./store";

// The only place pages get catalogue content from.

export function useTree() {
  return useResource("tree", fetchTree);
}

/** A category or product by its path under /products, e.g. "safety-ppe/gloves". */
export function useNode(path: string) {
  return useResource(`node:${path}`, () => fetchNode(path));
}

export function useBrands() {
  return useResource("brands", fetchBrands);
}
