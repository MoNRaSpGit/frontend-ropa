import { getProductImageSrc } from "../ropa.client";
import { getGenreForCategory, type RopaGenre, type RopaGenreKey } from "../ropa.genres";
import { getProductTheme } from "../ropa.theme";
import type { RopaProduct } from "../ropa.types";

// Portada del catalogo (26/11/2026, pedido explicito: "no mostrar la chorrera
// de productos"): una tarjeta por categoria; al tocarla se ven sus productos.
// La foto la elige la administradora en Categorias; si no puso ninguna, sale
// la de un producto de esa categoria (uno destacado si hay). Cada categoria
// tiene su tarjeta apenas se crea (sin productos dice "Próximamente").
export function pickCoverProduct(genre: RopaGenreKey, products: RopaProduct[]) {
  const items = products.filter((product) => getGenreForCategory(product.category) === genre);
  const cover = items.find((product) => product.featured && getProductImageSrc(product)) ?? items.find((product) => getProductImageSrc(product)) ?? items[0];
  return { count: items.length, cover };
}

export function CategoryCards({
  genres,
  products,
  onSelect
}: {
  genres: RopaGenre[];
  products: RopaProduct[];
  onSelect: (genre: RopaGenreKey) => void;
}) {
  const cards = genres.map((genre) => ({ genre, ...pickCoverProduct(genre.key, products) }));

  return (
    <div className="ropa-cats">
      {cards.map(({ genre, count, cover }) => {
        const image = genre.imageUrl || (cover ? getProductImageSrc(cover) : null);
        return (
          <button type="button" key={genre.key} className="ropa-cat-card" onClick={() => onSelect(genre.key)}>
            <span className="ropa-cat-media" style={image || !cover ? undefined : { background: getProductTheme(cover).gradient }}>
              {image ? <img src={image} alt="" loading="lazy" /> : null}
            </span>
            <span className="ropa-cat-name">{genre.label}</span>
            <span className="ropa-cat-count">{count === 0 ? "Próximamente" : count === 1 ? "1 producto" : `${count} productos`}</span>
          </button>
        );
      })}
    </div>
  );
}
