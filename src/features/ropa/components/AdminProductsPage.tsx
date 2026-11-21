import { useState } from "react";
import { getProductImageSrc } from "../ropa.client";
import { getCategoryLabel } from "../ropa.genres";
import { PRODUCT_IMAGE_SIZE } from "../ropa.imageResize";
import { getUnitPrice } from "../ropa.pricing";
import type { RopaProduct } from "../ropa.types";

type AdminProductsPageProps = {
  products: RopaProduct[];
  isLoading: boolean;
  error: string | null;
  onNuevo: () => void;
  onEditar: (product: RopaProduct) => void;
  onEliminar: (product: RopaProduct) => void;
  onReordenar: (product: RopaProduct, position: number) => void;
};

// Input de posicion -- key con el numero actual para que se resetee solo
// cuando cambia desde afuera (por ejemplo, al hacer swap con otra
// tarjeta), sin pisar lo que el admin esta tipeando mientras escribe.
function PositionInput({ product, onReordenar }: { product: RopaProduct; onReordenar: (product: RopaProduct, position: number) => void }) {
  const [value, setValue] = useState(String(product.position));

  function commit() {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setValue(String(product.position));
      return;
    }
    if (parsed !== product.position) {
      onReordenar(product, parsed);
    }
  }

  return (
    <input
      key={product.position}
      type="number"
      min="1"
      className="ropa-admin-position-input"
      defaultValue={product.position}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      aria-label={`Posición de ${product.name}`}
    />
  );
}

// Pantalla propia del administrador para cargar/editar/borrar productos --
// pedido explicito (15/09/2026): "que no ingrese directo en la pantalla
// principal, que tenga su propia pestaña". Antes el alta vivia como un
// boton suelto arriba de la grilla publica; ahora esa grilla publica
// vuelve a ser solo de consulta, y esto es lo unico que ve el admin al
// entrar a "Productos".
//
// Orden manual (16/09/2026): cada fila muestra su numero de posicion en
// un input editable -- "si la cambio al puesto 1, la 1 pasa al puesto de
// la que cambie" (swap, resuelto en el backend). La lista siempre se
// ordena por esa posicion.
export function AdminProductsPage({ products, isLoading, error, onNuevo, onEditar, onEliminar, onReordenar }: AdminProductsPageProps) {
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  // Acepta "36", "N° 36" o parte del nombre.
  const query = search.trim().toLowerCase().replace(/^n[°º]?\s*/, "");
  const sortedProducts = [...products]
    .sort((a, b) => a.position - b.position)
    .filter((product) => !query || String(product.id) === query || product.name.toLowerCase().includes(query));

  return (
    <main className="ropa-admin-main">
      <div className="ropa-admin-header">
        <h2>Productos</h2>
        <button type="button" className="ropa-button ropa-button--primary" onClick={onNuevo}>
          + Ingresar producto
        </button>
      </div>

      <p className="ropa-size-line">
        <strong>
          Medidas de producto ({PRODUCT_IMAGE_SIZE.width} x {PRODUCT_IMAGE_SIZE.height} px) (Instagram)
        </strong>
      </p>

      <p className="ropa-hint">Cambiá el número de posición de una tarjeta para moverla -- la que estaba en ese lugar pasa al de ella.</p>

      <input
        type="search"
        className="ropa-admin-search"
        placeholder="Buscar por N° de producto o nombre (ej: 36)"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        aria-label="Buscar producto por número o nombre"
      />

      {error ? <p className="ropa-error ropa-error--center">{error}</p> : null}
      {!error && isLoading ? <p className="ropa-hint">Cargando...</p> : null}
      {!error && !isLoading && products.length === 0 ? <p className="ropa-hint">Todavía no cargaste ningún producto.</p> : null}
      {!error && !isLoading && products.length > 0 && sortedProducts.length === 0 ? <p className="ropa-hint">No hay ningún producto con ese número o nombre.</p> : null}

      <div className="ropa-admin-list">
        {sortedProducts.map((product) => {
          const imageSrc = getProductImageSrc(product);
          return (
            <div className="ropa-admin-row" key={product.id}>
              <PositionInput product={product} onReordenar={onReordenar} />

              <div className="ropa-admin-row-media">
                {imageSrc ? <img src={imageSrc} alt={product.name} /> : <span className="ropa-admin-row-media-empty">Sin imagen</span>}
              </div>

              <div className="ropa-admin-row-info">
                <span className="ropa-admin-row-name">{product.name}</span>
                <span className="ropa-admin-row-code">N° {product.id}</span>
                <span className="ropa-admin-row-meta">
                  {getCategoryLabel(product.category) || "Sin categoría"} ·{" "}
                  ${getUnitPrice(product).toFixed(0)}
                </span>
              </div>

              <div className="ropa-admin-row-actions">
                {confirmandoId === product.id ? (
                  <>
                    <span className="ropa-admin-confirm-text">¿Eliminar?</span>
                    <button type="button" className="ropa-button ropa-button--ghost" onClick={() => setConfirmandoId(null)}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="ropa-button ropa-button--danger"
                      onClick={() => {
                        setConfirmandoId(null);
                        onEliminar(product);
                      }}
                    >
                      Sí, eliminar
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="ropa-button ropa-button--ghost" onClick={() => onEditar(product)}>
                      Editar
                    </button>
                    <button type="button" className="ropa-button ropa-button--danger" onClick={() => setConfirmandoId(product.id)}>
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
