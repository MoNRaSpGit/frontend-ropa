import { API_BASE_URL } from "../../shared/config/api";
import { getUnitPrice } from "./ropa.pricing";
import type { RopaCarouselImage, RopaClient, RopaDiscountConfig, RopaProduct, RopaProductStatus, RopaUser } from "./ropa.types";

function buildUrl(path: string) {
  return `${API_BASE_URL}/api/v1${path}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as Partial<T> & { message?: string | string[] };

  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message[0] : data.message;
    throw new Error(message || `HTTP ${response.status}`);
  }

  return data as T;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

// Si el admin subio una foto, se sirve desde el backend (binario, no
// base64 en el JSON del producto); si no, se usa la URL externa vieja
// (compatibilidad) o null si no tiene ninguna.
export function getProductImageSrc(product: Pick<RopaProduct, "id" | "hasImage" | "imageUrl">): string | null {
  if (product.hasImage) {
    return buildUrl(`/ropa/products/${product.id}/image`);
  }
  return product.imageUrl;
}

export async function listProducts(search?: string) {
  const query = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const response = await fetch(buildUrl(`/ropa/products${query}`));
  const data = await readJson<{ items: RopaProduct[] }>(response);
  return data.items;
}

export async function createProduct(
  token: string,
  payload: {
    name: string;
    description?: string;
    price: number;
    sizes?: string[];
    currency?: string;
    imageUrl?: string;
    category?: string;
    status?: RopaProductStatus;
  }
) {
  const response = await fetch(buildUrl("/ropa/products"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ item: RopaProduct }>(response);
  return data.item;
}

export async function updateProduct(
  token: string,
  productId: number,
  payload: Partial<{
    name: string;
    description: string;
    price: number;
    sizes: string[];
    currency: string;
    imageUrl: string;
    category: string;
    status: RopaProductStatus;
  }>
) {
  const response = await fetch(buildUrl(`/ropa/products/${productId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ item: RopaProduct }>(response);
  return data.item;
}

export async function deleteProduct(token: string, productId: number) {
  const response = await fetch(buildUrl(`/ropa/products/${productId}`), {
    method: "DELETE",
    headers: authHeaders(token)
  });
  await readJson<{ ok: boolean }>(response);
}

// Orden manual del catalogo (16/09/2026) -- mover a un puesto swapea con
// el producto que ya estaba ahi (se resuelve en el backend).
export async function reorderProduct(token: string, productId: number, position: number) {
  const response = await fetch(buildUrl(`/ropa/products/${productId}/position`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ position })
  });
  const data = await readJson<{ item: RopaProduct }>(response);
  return data.item;
}

export async function uploadProductImage(token: string, productId: number, dataUri: string) {
  const response = await fetch(buildUrl(`/ropa/products/${productId}/image`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ dataUri })
  });
  const data = await readJson<{ item: RopaProduct }>(response);
  return data.item;
}

// Avisa al backend que alguien toco "Comprar por WhatsApp" con este carrito
// (19/09/2026, pedido explicito: contabilizar las ventas). Es una intencion
// de compra, no una venta confirmada -- el pedido se cierra por WhatsApp,
// afuera del sistema. Dispara y olvida: NUNCA puede demorar ni romper el
// salto a WhatsApp, por eso traga cualquier error, y usa keepalive para que
// el pedido termine de salir aunque el navegador cambie de pestaña.
export function reportWhatsAppCheckout(items: Array<{ product: RopaProduct; size: string; quantity: number }>): void {
  try {
    const payloadItems = items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      size: item.size,
      quantity: item.quantity,
      unitPrice: getUnitPrice(item.product)
    }));
    const total = Math.round(payloadItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * 100) / 100;

    void fetch(buildUrl("/ropa/events/whatsapp-checkout"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payloadItems, total }),
      keepalive: true
    }).catch(() => {});
  } catch {
    // Nunca frena al cliente.
  }
}

// Carrusel de fondos (15/09/2026): el admin carga fotos desde su propia
// pestaña y el sitio va rotando entre ellas + la foto original fija de
// public/ como fondo de toda la pagina (ver RopaHomePage.tsx).
export function getCarouselImageSrc(image: Pick<RopaCarouselImage, "id" | "version">): string {
  return buildUrl(`/ropa/carousel/${image.id}/image?v=${image.version}`);
}

// Version PC (16/11/2026); null si el slide no tiene.
export function getCarouselDesktopImageSrc(image: Pick<RopaCarouselImage, "id" | "desktopVersion">): string | null {
  if (!image.desktopVersion) return null;
  return buildUrl(`/ropa/carousel/${image.id}/image?variant=desktop&v=${image.desktopVersion}`);
}

export async function setCarouselDesktopImage(token: string, imageId: number, dataUri: string) {
  const response = await fetch(buildUrl(`/ropa/carousel/${imageId}/desktop`), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ dataUri })
  });
  const data = await readJson<{ item: RopaCarouselImage }>(response);
  return data.item;
}

export async function listCarouselImages() {
  const response = await fetch(buildUrl("/ropa/carousel"));
  const data = await readJson<{ items: RopaCarouselImage[] }>(response);
  return data.items;
}

export async function addCarouselImage(token: string, dataUri: string) {
  const response = await fetch(buildUrl("/ropa/carousel"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ dataUri })
  });
  const data = await readJson<{ item: RopaCarouselImage }>(response);
  return data.item;
}

export async function deleteCarouselImage(token: string, imageId: number) {
  const response = await fetch(buildUrl(`/ropa/carousel/${imageId}`), {
    method: "DELETE",
    headers: authHeaders(token)
  });
  await readJson<{ ok: boolean }>(response);
}

// Cuenta corriente (15/09/2026) -- SOLO el admin ve/toca esto, requiere
// token en las 4 operaciones (ni siquiera listar es publico, a
// diferencia de productos/carrusel).
export async function listClients(token: string) {
  const response = await fetch(buildUrl("/ropa/clients"), { headers: authHeaders(token) });
  const data = await readJson<{ items: RopaClient[] }>(response);
  return data.items;
}

export async function createClient(
  token: string,
  payload: { name: string; dueDate: string; email?: string; phone?: string }
) {
  const response = await fetch(buildUrl("/ropa/clients"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ item: RopaClient }>(response);
  return data.item;
}

export async function updateClient(
  token: string,
  clientId: number,
  payload: Partial<{ name: string; dueDate: string; email: string; phone: string }>
) {
  const response = await fetch(buildUrl(`/ropa/clients/${clientId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ item: RopaClient }>(response);
  return data.item;
}

export async function deleteClient(token: string, clientId: number) {
  const response = await fetch(buildUrl(`/ropa/clients/${clientId}`), {
    method: "DELETE",
    headers: authHeaders(token)
  });
  await readJson<{ ok: boolean }>(response);
}

// Codigo de descuento (28/09/2026, pedido explicito): ver es publico (el
// carrito lo necesita para saber si mostrar el input), cambiarlo exige
// admin.
export async function getDiscountConfig() {
  const response = await fetch(buildUrl("/ropa/discount-config"));
  const data = await readJson<{ item: RopaDiscountConfig }>(response);
  return data.item;
}

export async function updateDiscountConfig(token: string, payload: { code: string; percentage: number; enabled: boolean }) {
  const response = await fetch(buildUrl("/ropa/discount-config"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ item: RopaDiscountConfig }>(response);
  return data.item;
}

export async function registerUser(payload: { email: string; password: string; fullName?: string }) {
  const response = await fetch(buildUrl("/ropa/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return readJson<{ user: RopaUser; token: string }>(response);
}

export async function loginUser(payload: { email: string; password: string }) {
  const response = await fetch(buildUrl("/ropa/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return readJson<{ user: RopaUser; token: string }>(response);
}

export async function logoutUser(token: string) {
  await fetch(buildUrl("/ropa/auth/logout"), { method: "POST", headers: authHeaders(token) }).catch(() => {});
}
