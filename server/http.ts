// Request/response helpers for /api/admin/*.
import { AdminInputError } from "./admin";

export const ADMIN_HEADER = "X-AEC-Admin";

export function noStoreJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new AdminInputError("The request body must be JSON");
  }
}

export function paramId(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!raw || !Number.isInteger(n) || n < 1) throw new AdminInputError("Not found", 404);
  return n;
}
