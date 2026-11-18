import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getProductImageSrc } from "../ropa.client";
import { getProductSizes, getUnitPrice, type RopaSize } from "../ropa.pricing";
import { getCategoryLabel } from "../ropa.genres";
import { getProductTheme } from "../ropa.theme";
import type { RopaProduct } from "../ropa.types";
import { AdaptiveImage } from "./AdaptiveImage";

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
  // Foto principal + fotos extra (otros angulos), pasables con flechas, puntitos,
  // teclado o deslizando el dedo (17/11/2026).
  const slides = [imageSrc, ...(product.gallery ?? []).map((photo) => photo.url)].filter((src): src is string => Boolean(src));
  const [slideIndex, setSlideIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const goToSlide = (index: number) => setSlideIndex((index + slides.length) % slides.length);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") setSlideIndex((current) => (current - 1 + slides.length) % slides.length);
      if (event.key === "ArrowRight") setSlideIndex((current) => (current + 1) % slides.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);
  const needsSizeChoice = sizes.length > 1;

  return (
    <div className="ropa-modal-overlay" onClick={onCerrar}>
      <div className="ropa-detail-box" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="ropa-detail-close" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <div
          className="ropa-detail-media"
          style={slides.length > 0 ? undefined : { background: theme.gradient }}
          onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)}
          onTouchEnd={(event) => {
            if (touchStartX === null || slides.length < 2) return;
            const delta = event.changedTouches[0].clientX - touchStartX;
            if (Math.abs(delta) > 40) goToSlide(slideIndex + (delta < 0 ? 1 : -1));
            setTouchStartX(null);
          }}
        >
          {slides.length > 0 ? (
            <AdaptiveImage key={slides[slideIndex]} src={slides[slideIndex]} alt={`${product.name} (foto ${slideIndex + 1} de ${slides.length})`} />
          ) : (
            <span className="ropa-detail-media-wordmark" style={{ color: theme.textColor }}>
              {product.name}
            </span>
          )}

          {slides.length > 1 ? (
            <>
              <button type="button" className="ropa-detail-arrow ropa-detail-arrow--prev" onClick={() => goToSlide(slideIndex - 1)} aria-label="Foto anterior">
                ‹
              </button>
              <button type="button" className="ropa-detail-arrow ropa-detail-arrow--next" onClick={() => goToSlide(slideIndex + 1)} aria-label="Foto siguiente">
                ›
              </button>
              <div className="ropa-detail-dots">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={index === slideIndex ? "ropa-detail-dot is-active" : "ropa-detail-dot"}
                    onClick={() => setSlideIndex(index)}
                    aria-label={`Ir a la foto ${index + 1}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="ropa-detail-body">
          <h2>{product.name}</h2>
          {product.category ? <span className="ropa-card-category">{getCategoryLabel(product.category)}</span> : null}
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
