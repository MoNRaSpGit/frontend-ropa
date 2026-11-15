import { useState } from "react";
import { getCartCount, getCartTotalsByCurrency, type RopaCartItem } from "../ropa.cart";
import { reportWhatsAppCheckout } from "../ropa.client";
import { trackEvent } from "../ropa.track";
import { applyDiscount, isValidDiscountCode } from "../ropa.discount";
import { getSizeLabel, getUnitPrice, type RopaSize } from "../ropa.pricing";
import { buildCartWhatsAppMessage, buildWhatsAppHref } from "../ropa.whatsapp";
import type { RopaDiscountConfig } from "../ropa.types";

type CartDrawerProps = {
  items: RopaCartItem[];
  onCerrar: () => void;
  onCambiarCantidad: (productId: number, size: RopaSize, quantity: number) => void;
  onQuitar: (productId: number, size: RopaSize) => void;
  onVaciar: () => void;
  // Se llama despues de tocar "Comprar por WhatsApp": el carrito ya se
  // mando, asi que la pantalla lo vacia y cierra el cajon (ver
  // RopaHomePage.tsx).
  onCompraEnviada: () => void;
  // Configurable por el admin (28/09/2026) -- si viene null (deshabilitado
  // o no se pudo consultar al backend), el input ni se muestra.
  discountConfig: RopaDiscountConfig | null;
};

// Retraso antes de vaciar el carrito tras tocar "Comprar por WhatsApp".
// Si se vaciara en el mismo instante del click, el <a> desapareceria del
// DOM (el cajon muestra "todavia no agregaste nada" con carrito vacio)
// antes de que el navegador termine de abrir WhatsApp -- en algunos
// navegadores (los internos de Instagram/Facebook, sobre todo) eso puede
// perder el salto. Con el retraso el enlace ya se abrio.
const CLEAR_AFTER_CHECKOUT_MS = 600;

export function CartDrawer({ items, onCerrar, onCambiarCantidad, onQuitar, onVaciar, onCompraEnviada, discountConfig }: CartDrawerProps) {
  const totals = getCartTotalsByCurrency(items);
  // Codigo de descuento (26/09/2026, pedido explicito; configurable por el
  // admin desde 28/09/2026). Se valida al tocar "Aplicar", no en cada
  // tecla, para no marcar error mientras la persona todavia esta
  // escribiendo.
  const [codigoInput, setCodigoInput] = useState("");
  const [codigoAplicado, setCodigoAplicado] = useState(false);
  const [codigoError, setCodigoError] = useState(false);

  function handleAplicarCodigo() {
    if (discountConfig && isValidDiscountCode(codigoInput, discountConfig.code)) {
      setCodigoAplicado(true);
      setCodigoError(false);
    } else {
      setCodigoAplicado(false);
      setCodigoError(true);
    }
  }

  function handleWhatsAppClick() {
    reportWhatsAppCheckout(items);
    trackEvent("whatsapp_click", { label: "carrito" });
    window.setTimeout(onCompraEnviada, CLEAR_AFTER_CHECKOUT_MS);
  }

  return (
    <div className="ropa-modal-overlay" onClick={onCerrar}>
      <div className="ropa-cart-box" onClick={(event) => event.stopPropagation()}>
        <div className="ropa-cart-header">
          <h2>Tu carrito ({getCartCount(items)})</h2>
          <button type="button" className="ropa-detail-close" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <p className="ropa-hint">Todavía no agregaste nada.</p>
        ) : (
          <>
            <div className="ropa-cart-list">
              {items.map((item) => (
                <div className="ropa-cart-row" key={`${item.product.id}-${item.size}`}>
                  <div className="ropa-cart-row-info">
                    <span className="ropa-cart-row-name">
                      {item.product.name} {item.size ? <span className="ropa-cart-row-variant">({getSizeLabel(item.size)})</span> : null}
                    </span>
                    <span className="ropa-cart-row-price">${getUnitPrice(item.product).toFixed(0)} c/u</span>
                  </div>
                  <div className="ropa-qty-stepper">
                    <button
                      type="button"
                      onClick={() => onCambiarCantidad(item.product.id, item.size, item.quantity - 1)}
                      aria-label="Restar"
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onCambiarCantidad(item.product.id, item.size, item.quantity + 1)}
                      aria-label="Sumar"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ropa-cart-row-remove"
                    onClick={() => onQuitar(item.product.id, item.size)}
                    aria-label="Quitar"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>

            {discountConfig ? (
              <div className="ropa-cart-discount">
                <label htmlFor="ropa-cart-discount-input">¿Tenés un código de descuento?</label>
                <div className="ropa-cart-discount-row">
                  <input
                    id="ropa-cart-discount-input"
                    type="text"
                    value={codigoInput}
                    onChange={(event) => {
                      setCodigoInput(event.target.value);
                      setCodigoError(false);
                    }}
                    placeholder="Ingresá el código"
                    disabled={codigoAplicado}
                  />
                  <button type="button" className="ropa-button ropa-button--ghost" onClick={handleAplicarCodigo} disabled={codigoAplicado || !codigoInput.trim()}>
                    {codigoAplicado ? "Aplicado" : "Aplicar"}
                  </button>
                </div>
                {codigoAplicado ? <p className="ropa-cart-discount-ok">Código aplicado: {discountConfig.percentage}% de descuento.</p> : null}
                {codigoError ? <p className="ropa-cart-discount-error">Ese código no es válido.</p> : null}
              </div>
            ) : null}

            <div className="ropa-cart-totals">
              {totals.map((total) => (
                <div key={total.currency} className="ropa-cart-total-line">
                  <span>Total</span>
                  {codigoAplicado && discountConfig ? (
                    <span className="ropa-cart-total-with-discount">
                      <span className="ropa-cart-total-original">${total.total.toFixed(0)}</span>
                      <strong>${applyDiscount(total.total, discountConfig.percentage).toFixed(0)}</strong>
                    </span>
                  ) : (
                    <strong>${total.total.toFixed(0)}</strong>
                  )}
                </div>
              ))}
            </div>

            {/* El link ya trae escrito, listo para mandar, el detalle de
                lo que hay en el carrito -- pedido explicito (15/09/2026):
                que el cliente no tenga que volver a escribirlo. Si aplico
                el codigo, el mensaje ya lleva el total con el descuento. */}
            <a
              href={buildWhatsAppHref(
                buildCartWhatsAppMessage(
                  items,
                  codigoAplicado && discountConfig ? { code: discountConfig.code, percentage: discountConfig.percentage } : undefined
                )
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="ropa-button ropa-button--whatsapp ropa-cart-whatsapp"
              onClick={handleWhatsAppClick}
            >
              Comprar por WhatsApp
            </a>

            <div className="ropa-modal-actions">
              <button type="button" className="ropa-button ropa-button--ghost" onClick={onVaciar}>
                Vaciar carrito
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
