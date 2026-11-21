import { getCartTotalsByCurrency, type RopaCartItem } from "./ropa.cart";
import { applyDiscount } from "./ropa.discount";
import { getSizeLabel, getUnitPrice } from "./ropa.pricing";

// Numero de WhatsApp de la tienda: PROVISORIO, cambiar por el real de la
// clienta (formato libre; se normaliza a internacional con prefijo 598).
const WHATSAPP_RAW_NUMBER = "092 107 966";

export function toWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const withoutLeadingZero = digits.replace(/^0+/, "");
  return withoutLeadingZero.startsWith("598") ? withoutLeadingZero : `598${withoutLeadingZero}`;
}

export const ROPA_WHATSAPP_NUMBER = toWhatsAppNumber(WHATSAPP_RAW_NUMBER);

export function buildWhatsAppHref(message: string): string {
  return `https://wa.me/${ROPA_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Mensaje ya armado con lo que hay en el carrito (con el descuento si aplico codigo).
export function buildCartWhatsAppMessage(items: RopaCartItem[], discount?: { code: string; percentage: number }): string {
  const lines = items.map((item) => {
    const subtitle = item.quantity > 1 ? ` x${item.quantity}` : "";
    const size = item.size ? ` (${getSizeLabel(item.size)})` : "";
    return `- ${item.product.name}${size}${subtitle} ($${getUnitPrice(item.product).toFixed(0)}) · N° ${item.product.id}`;
  });

  const totals = getCartTotalsByCurrency(items);
  const totalLines = totals.map(({ currency, total }) => {
    const moneda = currency === "USD" ? "U$S" : "$";
    if (!discount) {
      return `Total: ${moneda}${total.toFixed(0)}`;
    }
    const withDiscount = applyDiscount(total, discount.percentage);
    return `Subtotal: ${moneda}${total.toFixed(0)}\nDescuento (código ${discount.code.toUpperCase()}, ${discount.percentage}%)\nTotal con descuento: ${moneda}${withDiscount.toFixed(0)}`;
  });

  return ["Hola! Me gustaría comprar estos productos:", "", ...lines, "", ...totalLines].join("\n");
}
