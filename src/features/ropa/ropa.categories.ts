import { ROPA_GENRES, type RopaGenreKey } from "./ropa.genres";

// Opciones del selector del admin, agrupadas por categoria (16/11/2026).
// value = "categoria:subcategoria".
export type RopaCategoryGroup = {
  genre: RopaGenreKey;
  label: string;
  options: Array<{ value: string; label: string }>;
};

export const ROPA_CATEGORY_GROUPS: RopaCategoryGroup[] = ROPA_GENRES.map((genre) => ({
  genre: genre.key,
  label: genre.label,
  options: genre.subcategories.map((sub) => ({ value: `${genre.key}:${sub.key}`, label: sub.label }))
}));

export const ROPA_GENRE_LABELS: Record<RopaGenreKey, string> = Object.fromEntries(
  ROPA_GENRES.map((genre) => [genre.key, genre.label])
) as Record<RopaGenreKey, string>;
