import { getProductImageSrc } from "../ropa.client";
import { getProductTheme } from "../ropa.theme";
import type { RopaProduct } from "../ropa.types";

type ProductCardProps = {
  product: RopaProduct;
  onClick?: (product: RopaProduct) => void;
};

// Tarjeta cuadrada, solo imagen -- nada de precio ni categoria aca (eso
// vive en el detalle, al hacer click). Pedido explicito (15/09/2026): el
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
          <img src={imageSrc} alt={product.name} loading="lazy" />
        ) : (
          <span className="ropa-card-name-overlay" style={{ color: theme.textColor }}>
            {product.name}
          </span>
        )}
      </div>
    </button>
  );
}
