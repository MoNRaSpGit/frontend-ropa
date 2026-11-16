import type { RopaGenre, RopaGenreKey } from "./ropa.genres";

// Opciones del selector del admin, agrupadas por categoria. value =
// "categoria:subcategoria", o solo "categoria" para una categoria sin
// subcategorias (o para dejar el producto en la categoria general).
export type RopaCategoryGroup = {
  genre: RopaGenreKey;
  label: string;
  options: Array<{ value: string; label: string }>;
};

export function buildCategoryGroups(genres: RopaGenre[]): RopaCategoryGroup[] {
  return genres.map((genre) => ({
    genre: genre.key,
    label: genre.label,
    options: [
      ...(genre.subcategories.length === 0 ? [{ value: genre.key, label: genre.label }] : [{ value: genre.key, label: `${genre.label} (general)` }]),
      ...genre.subcategories.map((sub) => ({ value: `${genre.key}:${sub.key}`, label: sub.label }))
    ]
  }));
}
