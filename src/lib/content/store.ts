import { useSyncExternalStore } from "react";

// A tiny request cache: each key is fetched once per page load and shared by every component.

export type Resource<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; error: Error };

const entries = new Map<string, Resource<unknown>>();
const listeners = new Set<() => void>();
const LOADING: Resource<never> = { status: "loading" };

// The server puts the data the first page needs into the HTML (functions/_middleware.ts), keyed
// like this cache, so the page can draw without waiting for another request.
function primeFromPage() {
  if (typeof document === "undefined") return;
  const element = document.getElementById("aec-initial-data");
  if (!element) return;
  try {
    const data = JSON.parse(element.textContent ?? "{}") as Record<string, unknown>;
    for (const [key, value] of Object.entries(data)) entries.set(key, { status: "ready", data: value });
  } catch {
    // Ignore: the app just fetches as usual.
  }
  element.remove();
}
primeFromPage();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function settle(key: string, entry: Resource<unknown>) {
  entries.set(key, entry);
  listeners.forEach((listener) => listener());
}

function ensure<T>(key: string, load: () => T | Promise<T>) {
  if (entries.has(key)) return;
  const result = load();
  if (!(result instanceof Promise)) {
    // Local data resolves synchronously, so it renders on the first pass with no loading state.
    entries.set(key, { status: "ready", data: result });
    return;
  }
  entries.set(key, LOADING);
  result.then(
    (data) => settle(key, { status: "ready", data }),
    (error: unknown) =>
      settle(key, { status: "error", error: error instanceof Error ? error : new Error(String(error)) }),
  );
}

// `key` must identify the request completely: the loader is only called the first time a key is seen.
export function useResource<T>(key: string, load: () => T | Promise<T>): Resource<T> {
  ensure(key, load);
  return useSyncExternalStore(subscribe, () => (entries.get(key) ?? LOADING) as Resource<T>);
}

/** Forget every cached response, e.g. after an admin edit, so pages refetch fresh content. */
export function clearResources(): void {
  entries.clear();
  listeners.forEach((listener) => listener());
}
