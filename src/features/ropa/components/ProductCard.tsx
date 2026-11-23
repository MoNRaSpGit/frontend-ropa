import { getProductImageSrc } from "../ropa.client";
import { getUnitPrice } from "../ropa.pricing";
import { getProductTheme } from "../ropa.theme";
import type { RopaProduct } from "../ropa.types";
import { AdaptiveImage } from "./AdaptiveImage";

type ProductCardProps = {
  product: RopaProduct;
  onClick?: (product: RopaProduct) => void;
};

// Tarjeta vertical 4:5 (formato Instagram). 23/11/2026: debajo de la imagen
// se ve el PRECIO y una descripcion corta (2 renglones) con "Ver más", porque
// la gente no se daba cuenta de que tenia que tocar para ver el precio. Pedido explicito (15/09/2026): el
// nombre del producto ya no se muestra en la tarjeta cuando hay una foto
// real subida -- el nombre ya viene "dibujado" en esa imagen (es un
// logo), asi que el campo "Nombre" pasa a servir solo para el buscador.
// Si todavia no tiene imagen, se sigue mostrando el nombre sobre el
// wordmark de color para que la tarjeta no quede en blanco.
export function ProductCard({ product, onClick }: ProductCardProps) {
  const theme = getProductTheme(product);
  const imageSrc = getProductImageSrc(product);

  return (
    <button type="button" className="ropa-card" onClick={() => onClick?.(product)}>
      <div className="ropa-card-media" style={imageSrc ? undefined : { background: theme.gradient }}>
        {imageSrc ? (
          <AdaptiveImage src={imageSrc} alt={product.name} loading="lazy" />
        ) : (
          <span className="ropa-card-name-overlay" style={{ color: theme.textColor }}>
            {product.name}
          </span>
        )}
        {product.featured ? <span className="ropa-featured-tag">⭐ Destacado</span> : null}
      </div>
      <div className="ropa-card-info">
        <span className="ropa-card-price">${getUnitPrice(product).toFixed(0)}</span>
        {product.description?.trim() ? <span className="ropa-card-desc">{product.description.trim()}</span> : null}
        <span className="ropa-card-more">Ver más ›</span>
      </div>
    </button>
  );
}
