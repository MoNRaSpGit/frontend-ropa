import { getProductImageSrc } from "../ropa.client";
import { getGenreForCategory, type RopaGenre, type RopaGenreKey } from "../ropa.genres";
import { getProductTheme } from "../ropa.theme";
import type { RopaProduct } from "../ropa.types";

// Portada del catalogo (26/11/2026, pedido explicito: "no mostrar la chorrera
// de productos"): una tarjeta por categoria; al tocarla se ven sus productos.
// La foto de cada tarjeta sale de un producto de esa categoria (uno destacado
// si hay). Las categorias sin productos no se muestran.
export function CategoryCards({
  genres,
  products,
  onSelect
}: {
  genres: RopaGenre[];
  products: RopaProduct[];
  onSelect: (genre: RopaGenreKey) => void;
}) {
  const cards = genres
    .map((genre) => {
      const items = products.filter((product) => getGenreForCategory(product.category) === genre.key);
      const cover = items.find((product) => product.featured && getProductImageSrc(product)) ?? items.find((product) => getProductImageSrc(product)) ?? items[0];
      return { genre, count: items.length, cover };
    })
    .filter((card) => card.count > 0);

  return (
    <div className="ropa-cats">
      {cards.map(({ genre, count, cover }) => {
        const image = cover ? getProductImageSrc(cover) : null;
        return (
          <button type="button" key={genre.key} className="ropa-cat-card" onClick={() => onSelect(genre.key)}>
            <span className="ropa-cat-media" style={image || !cover ? undefined : { background: getProductTheme(cover).gradient }}>
              {image ? <img src={image} alt="" loading="lazy" /> : null}
            </span>
            <span className="ropa-cat-name">{genre.label}</span>
            <span className="ropa-cat-count">{count === 1 ? "1 producto" : `${count} productos`}</span>
          </button>
        );
      })}
    </div>
  );
}
