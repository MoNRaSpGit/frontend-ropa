// Categorias y subcategorias de la tienda (16/11/2026, lista de la clienta).
// En el producto se guarda "categoria:subcategoria" (ej. "accesorios:pulseras-perlas").
// Para agregar/cambiar una: tocar SOLO esta lista (las keys ya usadas en
// productos no se renombran, solo el label).
export type RopaGenreKey = "accesorios" | "bebes" | "escolar" | "fiestas" | "regalos" | "verano";

export type RopaSubcategory = { key: string; label: string };

export const ROPA_GENRES: Array<{ key: RopaGenreKey; label: string; subcategories: RopaSubcategory[] }> = [
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

const GENRES_BY_KEY = new Map(ROPA_GENRES.map((genre) => [genre.key as string, genre]));

function splitCategory(category: string | null): [string, string | null] | null {
  if (!category) return null;
  const [genre, sub] = category.trim().toLowerCase().split(":");
  return [genre, sub ?? null];
}

export function getGenreForCategory(category: string | null): RopaGenreKey | null {
  const parts = splitCategory(category);
  return parts && GENRES_BY_KEY.has(parts[0]) ? (parts[0] as RopaGenreKey) : null;
}

export function getSubcategoryForCategory(category: string | null): string | null {
  const parts = splitCategory(category);
  if (!parts || !parts[1]) return null;
  return GENRES_BY_KEY.get(parts[0])?.subcategories.some((sub) => sub.key === parts[1]) ? parts[1] : null;
}

// Texto para mostrar: "Accesorios · Pulseras de perlas".
export function getCategoryLabel(category: string | null): string | null {
  const parts = splitCategory(category);
  if (!parts) return null;
  const genre = GENRES_BY_KEY.get(parts[0]);
  if (!genre) return category;
  const sub = genre.subcategories.find((item) => item.key === parts[1]);
  return sub ? `${genre.label} · ${sub.label}` : genre.label;
}
