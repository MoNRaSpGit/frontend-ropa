// Tarjetas sin foto: degrade rosado propio segun la categoria (texto oscuro).
type CategoryTheme = {
  gradient: string;
  textColor: string;
};

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  accesorios: { gradient: "linear-gradient(160deg, #ffd1e1, #f7a8c4)", textColor: "#5a2a40" },
  bebes: { gradient: "linear-gradient(160deg, #d5e8ff, #a9c9f0)", textColor: "#24405e" },
  escolar: { gradient: "linear-gradient(160deg, #d8f5e3, #a9e0c0)", textColor: "#24503a" },
  fiestas: { gradient: "linear-gradient(160deg, #e9d5ff, #cfa9f0)", textColor: "#42245e" },
  regalos: { gradient: "linear-gradient(160deg, #ffe0d1, #f8b9a0)", textColor: "#5a3020" },
  verano: { gradient: "linear-gradient(160deg, #fff0c9, #f5d98a)", textColor: "#5a4620" }
};

const FALLBACK_GRADIENTS = [
  "linear-gradient(160deg, #ffd9e6, #f4b6cc)",
  "linear-gradient(160deg, #f6d6f5, #e0a8de)",
  "linear-gradient(160deg, #ffe3d6, #f5bfa8)"
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getProductTheme(product: { name: string; category: string | null }): CategoryTheme {
  // Color por categoria principal ("accesorios:pulseras-perlas" -> accesorios).
  const key = (product.category ?? product.name).trim().toLowerCase().split(":")[0];
  if (CATEGORY_THEMES[key]) {
    return CATEGORY_THEMES[key];
  }
  return { gradient: FALLBACK_GRADIENTS[hashString(key) % FALLBACK_GRADIENTS.length], textColor: "#5a2a40" };
}
