import { useRef, useState, type FormEvent } from "react";
import { createProduct, getProductImageSrc, updateProduct, uploadProductImage } from "../ropa.client";
import { buildCategoryGroups } from "../ropa.categories";
import { useRopaGenres } from "../ropa.genres";
import { resizeImageFile } from "../ropa.imageResize";
import type { RopaProduct } from "../ropa.types";

type ProductFormModalProps = {
  token: string;
  // Si viene un producto, el modal edita en vez de crear -- mismo
  // formulario para las dos cosas (pedido 15/09/2026).
  product?: RopaProduct;
  onCancelar: () => void;
  onGuardado: (product: RopaProduct) => void;
};

// Precio SIEMPRE en pesos (UYU) y SIEMPRE mensual -- pedido explicito
// (15/09/2026): "el precio va a ser en pesos... eso es mensual". No hay
// selector de moneda, se manda fijo.
export function ProductFormModal({ token, product, onCancelar, onGuardado }: ProductFormModalProps) {
  const genres = useRopaGenres();
  const isEditing = Boolean(product);
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [sizesText, setSizesText] = useState(product?.sizes?.join(", ") ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [imagePreview, setImagePreview] = useState<string | null>(product ? getProductImageSrc(product) : null);
  const [pendingImageDataUri, setPendingImageDataUri] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const resized = await resizeImageFile(file);
      setPendingImageDataUri(resized);
      setImagePreview(resized);
    } catch {
      setError("No se pudo procesar esa imagen. Probá con otra.");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const priceNum = Number(price.trim());
    const sizes = Array.from(new Set(sizesText.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean)));

    if (!name.trim()) {
      setError("Ingresá el nombre de la prenda.");
      return;
    }
    if (!price.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      setError("Ingresá un precio válido.");
      return;
    }
    if (!category) {
      setError("Elegí una categoría.");
      return;
    }

    setError("");
    setGuardando(true);
    try {
      const common = {
        name: name.trim(),
        currency: "UYU",
        sizes,
        category,
        description: description.trim() || undefined
      };

      // En alta, un precio vacio se omite (undefined); en edicion, un
      // precio vaciado a proposito se manda como null explicito para
      // borrarlo de verdad (ver UpdateRopaProductDto en el backend).
      const savedProduct =
        isEditing && product
          ? await updateProduct(token, product.id, { ...common, price: priceNum })
          : await createProduct(token, { ...common, price: priceNum });

      const finalProduct = pendingImageDataUri
        ? await uploadProductImage(token, savedProduct.id, pendingImageDataUri)
        : savedProduct;

      onGuardado(finalProduct);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el producto.");
      setGuardando(false);
    }
  }

  return (
    <div className="ropa-modal-overlay">
      <div className="ropa-modal-box">
        <h2>{isEditing ? "Editar producto" : "Nuevo producto"}</h2>

        <form onSubmit={(event) => void handleSubmit(event)}>
          <label className="ropa-field">
            <span>Imagen</span>
            <div className="ropa-image-picker">
              {imagePreview ? (
                <img src={imagePreview} alt="Vista previa" className="ropa-image-preview" />
              ) : (
                <div className="ropa-image-preview ropa-image-preview--empty">Sin imagen</div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(event) => void handleFileChange(event)}
                hidden
              />
              <button type="button" className="ropa-button ropa-button--ghost" onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? "Cambiar imagen" : "Elegir imagen"}
              </button>
            </div>
            <small>Se ajusta sola al tamaño de la tarjeta -- no hace falta subir algo pesado.</small>
          </label>

          <label className="ropa-field">
            <span>Nombre</span>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
          </label>

          <label className="ropa-field">
            <span>Categoría</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">Elegir...</option>
              {buildCategoryGroups(genres).map((group) => (
                <optgroup key={group.genre} label={group.label}>
                  {group.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          {/* Dos precios independientes -- pedido explicito (16/09/2026):
              "hay tarjetas que si llevan los dos, otras que no". Se
              puede dejar uno vacio, pero no los dos. */}
          <label className="ropa-field">
            <span>Precio ($)</span>
            <input type="number" step="1" min="0" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} />
          </label>

          <label className="ropa-field">
            <span>Talles (separados por coma, opcional)</span>
            <input type="text" value={sizesText} onChange={(event) => setSizesText(event.target.value)} placeholder="Ej: S, M, L, XL" />
            <small>Si no ponés ninguno, la prenda se agrega al carrito sin pedir talle.</small>
          </label>

          <label className="ropa-field">
            <span>Descripción (opcional)</span>
            <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>

          {error ? <p className="ropa-error">{error}</p> : null}

          <div className="ropa-modal-actions">
            <button type="button" className="ropa-button ropa-button--ghost" onClick={onCancelar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="ropa-button ropa-button--primary" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
