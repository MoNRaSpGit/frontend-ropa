import { useSyncExternalStore } from "react";

// Categorias y subcategorias de la tienda (16/11/2026, lista de la clienta).
// En el producto se guarda "categoria:subcategoria" (ej. "accesorios:pulseras-perlas").
// Para agregar/cambiar una: tocar SOLO esta lista (las keys ya usadas en
// productos no se renombran, solo el label).
export type RopaGenreKey = string;

export type RopaSubcategory = { id?: number; key: string; label: string };
export type RopaGenre = { id?: number; key: RopaGenreKey; label: string; subcategories: RopaSubcategory[] };

// Lista que se usa mientras el servidor no responde (y de punto de partida):
// desde el 16/11/2026 la lista REAL la edita el administrador y se carga del
// servidor (setRopaGenres). Las keys ya usadas en productos no se renombran.
export const DEFAULT_ROPA_GENRES: RopaGenre[] = [
  {
    key: "accesorios",
    label: "Accesorios",
    subcategories: [
      { key: "pulseras-infantiles", label: "Pulseras infantiles" },
      { key: "pulseras-perlas", label: "Pulseras de perlas" },
      { key: "pulseras-tejidas", label: "Pulseras tejidas" },
      { key: "pulseras-compartir", label: "Pulseras para compartir" },
      { key: "pulseras-buzios", label: "Pulseras de búzios" },
      { key: "chokers-buzios", label: "Chokers de búzios" },
      { key: "chokers-perlas", label: "Chokers de perlas" },
      { key: "chokers-hombres", label: "Chokers para hombres" }
    ]
  },
  {
    key: "bebes",
    label: "Bebés y bautismos",
    subcategories: [
      { key: "chupeteros", label: "Chupeteros" },
      { key: "recuerdo-bautismo", label: "Recuerdo de bautismo" },
      { key: "souvenir", label: "Souvenirs" }
    ]
  },
  {
    key: "escolar",
    label: "Escolar",
    subcategories: [
      { key: "etiquetas-cuadernos", label: "Etiquetas para cuadernos" },
      { key: "etiquetas-lapices", label: "Etiquetas para lápices" },
      { key: "tablas-multiplicar", label: "Tablas de multiplicar" },
      { key: "calculadoras", label: "Calculadoras" },
      { key: "suma-resta", label: "Suma y resta" }
    ]
  },
  {
    key: "fiestas",
    label: "Fiestas y celebraciones",
    subcategories: [{ key: "decoracion-tortas", label: "Decoración para tortas" }]
  },
  {
    key: "regalos",
    label: "Regalos y fechas especiales",
    subcategories: [
      { key: "dia-madre", label: "Día de la madre" },
      { key: "dia-padre", label: "Día del padre" },
      { key: "dia-nino", label: "Día del niño" },
      { key: "dia-maestro", label: "Día del maestro" },
      { key: "san-valentin", label: "San Valentín" }
    ]
  },
  {
    key: "verano",
    label: "Verano",
    subcategories: [
      { key: "pulseras-tejidas", label: "Pulseras tejidas" },
      { key: "chokers", label: "Chokers" },
      { key: "correa-lentes", label: "Correa de lentes" }
    ]
  }
];

// Almacen simple (sin librerias): el catalogo y el admin se suscriben con
// useRopaGenres y se redibujan cuando el administrador cambia las categorias.
let currentGenres: RopaGenre[] = DEFAULT_ROPA_GENRES;
const listeners = new Set<() => void>();

export function getRopaGenres(): RopaGenre[] {
  return currentGenres;
}

export function setRopaGenres(genres: RopaGenre[]) {
  currentGenres = genres;
  listeners.forEach((listener) => listener());
}

export function useRopaGenres(): RopaGenre[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getRopaGenres
  );
}

function genresByKey() {
  return new Map(currentGenres.map((genre) => [genre.key as string, genre]));
}

function splitCategory(category: string | null): [string, string | null] | null {
  if (!category) return null;
  const [genre, sub] = category.trim().toLowerCase().split(":");
  return [genre, sub ?? null];
}

export function getGenreForCategory(category: string | null): RopaGenreKey | null {
  const parts = splitCategory(category);
  return parts && genresByKey().has(parts[0]) ? parts[0] : null;
}

export function getSubcategoryForCategory(category: string | null): string | null {
  const parts = splitCategory(category);
  if (!parts || !parts[1]) return null;
  return genresByKey().get(parts[0])?.subcategories.some((sub) => sub.key === parts[1]) ? parts[1] : null;
}

// Texto para mostrar: "Accesorios · Pulseras de perlas".
export function getCategoryLabel(category: string | null): string | null {
  const parts = splitCategory(category);
  if (!parts) return null;
  const genre = genresByKey().get(parts[0]);
  if (!genre) return category;
  const sub = genre.subcategories.find((item) => item.key === parts[1]);
  return sub ? `${genre.label} · ${sub.label}` : genre.label;
}
