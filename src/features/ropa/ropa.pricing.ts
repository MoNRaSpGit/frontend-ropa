import type { RopaProduct } from "./ropa.types";

// Ropa: UN solo precio por producto (en pesos). Lo que cambia entre lineas del
// carrito es el TALLE: "" = sin talle (producto de talle unico / accesorio).
export type RopaSize = string;

export const ROPA_NO_SIZE: RopaSize = "";

// Talles que el admin cargo para el producto (puede no tener ninguno).
export function getProductSizes(product: Pick<RopaProduct, "sizes">): RopaSize[] {
  return Array.isArray(product.sizes) ? product.sizes : [];
}

export function getUnitPrice(product: Pick<RopaProduct, "price">): number {
  return product.price ?? 0;
}

export function getSizeLabel(size: RopaSize): string {
  return size ? `Talle ${size}` : "";
}
