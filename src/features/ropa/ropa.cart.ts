import { getUnitPrice, type RopaSize } from "./ropa.pricing";
import type { RopaProduct } from "./ropa.types";

// Carrito guardado en localStorage, por navegador. Cada linea es un producto
// + el talle elegido (si tiene): la misma prenda en dos talles son dos lineas.
const STORAGE_KEY = "ropa.cart.v1";

export type RopaCartItem = {
  product: RopaProduct;
  size: RopaSize;
  quantity: number;
};

function isSameLine(item: RopaCartItem, productId: number, size: RopaSize): boolean {
  return item.product.id === productId && item.size === size;
}

export function loadCart(): RopaCartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RopaCartItem[];
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.product && typeof item.size === "string") : [];
  } catch {
    return [];
  }
}

export function saveCart(items: RopaCartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Sin localStorage el carrito no persiste entre recargas, pero la app sigue.
  }
}

export function addToCart(items: RopaCartItem[], product: RopaProduct, size: RopaSize, quantity = 1): RopaCartItem[] {
  const existing = items.find((item) => isSameLine(item, product.id, size));
  const next = existing
    ? items.map((item) => (isSameLine(item, product.id, size) ? { ...item, quantity: item.quantity + quantity } : item))
    : [...items, { product, size, quantity }];
  saveCart(next);
  return next;
}

export function updateCartQuantity(items: RopaCartItem[], productId: number, size: RopaSize, quantity: number): RopaCartItem[] {
  const next =
    quantity <= 0
      ? items.filter((item) => !isSameLine(item, productId, size))
      : items.map((item) => (isSameLine(item, productId, size) ? { ...item, quantity } : item));
  saveCart(next);
  return next;
}

export function removeFromCart(items: RopaCartItem[], productId: number, size: RopaSize): RopaCartItem[] {
  const next = items.filter((item) => !isSameLine(item, productId, size));
  saveCart(next);
  return next;
}

export function clearCart(): RopaCartItem[] {
  saveCart([]);
  return [];
}

// Agrupa el total por moneda (hoy todo es UYU, pero ya banca otra moneda).
export function getCartTotalsByCurrency(items: RopaCartItem[]): Array<{ currency: string; total: number }> {
  const totals = new Map<string, number>();
  for (const item of items) {
    const current = totals.get(item.product.currency) ?? 0;
    totals.set(item.product.currency, current + getUnitPrice(item.product) * item.quantity);
  }
  return Array.from(totals.entries()).map(([currency, total]) => ({ currency, total }));
}

export function getCartCount(items: RopaCartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
