import { getBrands, json, type Env } from "../../server/catalogue";

// GET /api/brands: all brands in display order, including the in-house range.
export const onRequestGet: PagesFunction<Env> = async ({ env }) => json(await getBrands(env.DB));
