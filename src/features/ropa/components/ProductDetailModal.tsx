import { useState } from "react";
import { toast } from "react-toastify";
import { getProductImageSrc } from "../ropa.client";
import { getProductSizes, getUnitPrice, type RopaSize } from "../ropa.pricing";
import { getProductTheme } from "../ropa.theme";
import type { RopaProduct } from "../ropa.types";

type ProductDetailModalProps = {
  product: RopaProduct;
  isAdmin: boolean;
  onCerrar: () => void;
  onAgregarAlCarrito: (product: RopaProduct, size: RopaSize, quantity: number) => void;
  onEditar: (product: RopaProduct) => void;
  onEliminar: (product: RopaProduct) => void;
};

// Se abre al clickear una tarjeta -- ahi (y solo ahi) se ve el precio y
// la descripcion. Pedido explicito (15/09/2026): precio siempre en pesos
// y siempre mensual, y si el logueado es administrador, tambien puede
// editar/eliminar el producto desde aca mismo.
//
// Si el producto tiene los DOS precios cargados, el cliente tiene que
// elegir perfil o cuenta ANTES de poder agregarlo al carrito -- pedido
// explicito (16/09/2026): "que no pueda agregar al carrito si no
// selecciona el que quiere". Si solo tiene uno cargado, se usa ese
// directo, sin pedir que elija nada.
export function ProductDetailModal({ product, isAdmin, onCerrar, onAgregarAlCarrito, onEditar, onEliminar }: ProductDetailModalProps) {
  const sizes = getProductSizes(product);
  const [quantity, setQuantity] = useState(1);
  // Si el producto tiene talles hay que elegir uno; si no, se agrega directo.
  const [selectedSize, setSelectedSize] = useState<RopaSize | null>(sizes.length === 0 ? "" : sizes.length === 1 ? sizes[0] : null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const theme = getProductTheme(product);
  const imageSrc = getProductImageSrc(product);
  const needsSizeChoice = sizes.length > 1;

  return (
    <div className="ropa-modal-overlay" onClick={onCerrar}>
      <div className="ropa-detail-box" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="ropa-detail-close" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <div className="ropa-detail-media" style={imageSrc ? undefined : { background: theme.gradient }}>
          {imageSrc ? (
            <img src={imageSrc} alt={product.name} />
          ) : (
            <span className="ropa-detail-media-wordmark" style={{ color: theme.textColor }}>
              {product.name}
            </span>
          )}
        </div>

        <div className="ropa-detail-body">
          <h2>{product.name}</h2>
          {product.category ? <span className="ropa-card-category">{product.category}</span> : null}
          {product.description ? <p className="ropa-detail-description">{product.description}</p> : null}

          <div className="ropa-detail-prices">
            <div className="ropa-detail-price">
              <span className="ropa-detail-price-label">Precio</span>
              <span>${getUnitPrice(product).toFixed(0)}</span>
            </div>
          </div>

          {needsSizeChoice ? (
            <>
              {selectedSize === null ? <p className="ropa-hint ropa-detail-variant-hint">Elegí tu talle para poder agregarlo.</p> : null}
              <div className="ropa-detail-variant-picker" role="radiogroup" aria-label="Elegí tu talle">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    role="radio"
                    aria-checked={selectedSize === size}
                    className={selectedSize === size ? "ropa-detail-variant-option is-selected" : "ropa-detail-variant-option"}
                    onClick={() => setSelectedSize(size)}
                  >
                    <span className="ropa-detail-variant-amount">{size}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {confirmandoEliminar ? (
            <div className="ropa-confirm-delete">
              <p>¿Eliminar "{product.name}"? No se puede deshacer.</p>
              <div className="ropa-modal-actions">
                <button type="button" className="ropa-button ropa-button--ghost" onClick={() => setConfirmandoEliminar(false)}>
                  Cancelar
                </button>
                <button type="button" className="ropa-button ropa-button--danger" onClick={() => onEliminar(product)}>
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="ropa-detail-actions">
                <div className="ropa-qty-stepper">
                  <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Restar">
                    −
                  </button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => setQuantity((current) => current + 1)} aria-label="Sumar">
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className={selectedSize !== null ? "ropa-button ropa-button--primary ropa-detail-add" : "ropa-button ropa-button--primary ropa-detail-add is-blocked"}
                  onClick={() => {
                    if (selectedSize === null) {
                      toast.error("Elegí tu talle antes de agregarlo.");
                      return;
                    }
                    onAgregarAlCarrito(product, selectedSize, quantity);
                  }}
                >
                  Agregar al carrito
                </button>
              </div>

              {isAdmin ? (
                <div className="ropa-detail-admin-actions">
                  <button type="button" className="ropa-button ropa-button--ghost" onClick={() => onEditar(product)}>
                    Editar
                  </button>
                  <button type="button" className="ropa-button ropa-button--danger" onClick={() => setConfirmandoEliminar(true)}>
                    Eliminar
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
