import { ROPA_GENRES, type RopaGenreKey } from "./ropa.genres";

// Lista cerrada de categorias (salen del mismo listado que los generos).
export type RopaCategoryOption = {
  value: string;
  label: string;
  genre: RopaGenreKey;
};

export const ROPA_CATEGORY_OPTIONS: RopaCategoryOption[] = ROPA_GENRES.map((genre) => ({
  value: genre.key,
  label: genre.label,
  genre: genre.key
}));

export const ROPA_GENRE_LABELS: Record<RopaGenreKey, string> = Object.fromEntries(
  ROPA_GENRES.map((genre) => [genre.key, genre.label])
) as Record<RopaGenreKey, string>;
