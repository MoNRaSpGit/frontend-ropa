// Categorias cerradas de la tienda. La categoria que elige el admin (ver
// ropa.categories.ts) es directamente el "genero" del filtro del catalogo.
// PROVISORIAS: se ajustan con la clienta.
export type RopaGenreKey = "remeras" | "pantalones" | "vestidos" | "camperas" | "calzado" | "accesorios";

export const ROPA_GENRES: Array<{ key: RopaGenreKey; label: string }> = [
  { key: "remeras", label: "Remeras" },
  { key: "pantalones", label: "Pantalones" },
  { key: "vestidos", label: "Vestidos" },
  { key: "camperas", label: "Camperas" },
  { key: "calzado", label: "Calzado" },
  { key: "accesorios", label: "Accesorios" }
];

const VALID_GENRES = new Set<string>(ROPA_GENRES.map((genre) => genre.key));

export function getGenreForCategory(category: string | null): RopaGenreKey | null {
  if (!category) return null;
  const normalized = category.trim().toLowerCase();
  return VALID_GENRES.has(normalized) ? (normalized as RopaGenreKey) : null;
}
