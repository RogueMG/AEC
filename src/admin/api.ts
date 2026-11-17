import type {
  AdminBrand,
  AdminCategory,
  AdminError,
  AdminProduct,
  AdminTree,
  BrandInput,
  CategoryInput,
  ProductInput,
  ReorderInput,
  UploadResult,
} from "@/lib/admin/types";
import { clearResources } from "@/lib/content/store";

export class AdminApiError extends Error {
  readonly status: number;
  readonly field?: string;
  constructor(message: string, status: number, field?: string) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

// Every change sends X-AEC-Admin, which the server requires (see functions/api/admin/_middleware.ts).
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method, headers: { "X-AEC-Admin": "1", Accept: "application/json" }, credentials: "same-origin" };
  if (body instanceof FormData) init.body = body;
  else if (body !== undefined) {
    init.body = JSON.stringify(body);
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
  }
  let response: Response;
  try {
    response = await fetch(`/api/admin/${path}`, init);
  } catch {
    throw new AdminApiError("Couldn't reach the server. Check your connection and try again.", 0);
  }
  if (method !== "GET" && response.ok) clearResources();
  if (response.status === 204) return undefined as T;
  const data = (await response.json().catch(() => null)) as (T & AdminError) | null;
  if (!response.ok) {
    const message =
      response.status === 401 || response.status === 403
        ? "Your sign-in has expired. Reload the page to sign in again."
        : (data?.error ?? `Request failed (${response.status})`);
    throw new AdminApiError(message, response.status, data?.field);
  }
  return data as T;
}

export const adminApi = {
  me: () => request<{ email: string }>("GET", "me"),
  tree: () => request<AdminTree>("GET", "tree"),

  getCategory: (id: number) => request<AdminCategory>("GET", `categories/${id}`),
  createCategory: (input: CategoryInput) => request<AdminCategory>("POST", "categories", input),
  updateCategory: (id: number, input: CategoryInput) => request<AdminCategory>("PUT", `categories/${id}`, input),
  deleteCategory: (id: number) => request<void>("DELETE", `categories/${id}`),
  reorderCategories: (input: ReorderInput) => request<{ ok: true }>("POST", "categories/reorder", input),

  getProduct: (id: number) => request<AdminProduct>("GET", `products/${id}`),
  createProduct: (input: ProductInput) => request<AdminProduct>("POST", "products", input),
  updateProduct: (id: number, input: ProductInput) => request<AdminProduct>("PUT", `products/${id}`, input),
  deleteProduct: (id: number) => request<void>("DELETE", `products/${id}`),
  reorderProducts: (input: ReorderInput) => request<{ ok: true }>("POST", "products/reorder", input),

  brands: () => request<AdminBrand[]>("GET", "brands"),
  createBrand: (input: BrandInput) => request<AdminBrand>("POST", "brands", input),
  updateBrand: (id: number, input: BrandInput) => request<AdminBrand>("PUT", `brands/${id}`, input),
  deleteBrand: (id: number) => request<void>("DELETE", `brands/${id}`),
  reorderBrands: (ids: number[]) => request<{ ok: true }>("POST", "brands/reorder", { parentId: null, ids }),

  upload: (file: Blob, name: string) => {
    const form = new FormData();
    form.append("file", file, name);
    return request<UploadResult>("POST", "upload", form);
  },
};
