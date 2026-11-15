export type RopaUserRole = "administrador" | "usuario";

export type RopaUser = {
  id: number;
  email: string;
  fullName: string | null;
  role: RopaUserRole;
};

export type RopaProductStatus = "published" | "draft";

export type RopaCarouselImage = {
  id: number;
  createdAt: string;
  // Hash corto del binario -- va en la URL (?v=) para saltear la cache de un
  // anio del navegador cuando se reemplaza el contenido de la imagen.
  version: string;
};

// Cuenta corriente (15/09/2026): SOLO el admin ve esto (email/telefono
// de clientes reales, no es publico como productos/carrusel).
export type RopaClient = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  dueDate: string;
  createdAt: string;
};

// Codigo de descuento (28/09/2026, pedido explicito): un solo codigo
// activo a la vez, configurable por el admin desde su propia pestaña. Si
// "enabled" es false, el carrito no muestra el input de codigo.
export type RopaDiscountConfig = {
  code: string;
  percentage: number;
  enabled: boolean;
};

// Producto de ropa: un solo precio (pesos) y talles opcionales.
export type RopaProduct = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  // Talles disponibles (ej: ["S","M","L"]); vacio = talle unico / sin talle.
  sizes: string[];
  currency: string;
  imageUrl: string | null;
  hasImage: boolean;
  category: string | null;
  status: RopaProductStatus;
  // Orden manual en el catalogo.
  position: number;
  createdAt: string;
};
