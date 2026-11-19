import { useRef, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { addProductGalleryImage, createProduct, deleteProductGalleryImage, getProductImageSrc, updateProduct, uploadProductImage } from "../ropa.client";
import { buildCategoryGroups } from "../ropa.categories";
import { useRopaGenres } from "../ropa.genres";
import { PRODUCT_IMAGE_SIZE, resizeImageFile } from "../ropa.imageResize";
import type { RopaProduct } from "../ropa.types";

type ProductFormModalProps = {
  token: string;
  // Si viene un producto, el modal edita en vez de crear -- mismo
  // formulario para las dos cosas (pedido 15/09/2026).
  product?: RopaProduct;
  onCancelar: () => void;
  onGuardado: (product: RopaProduct) => void;
  // Las fotos extra se suben/borran al instante: avisa para refrescar el catalogo.
  onProductoActualizado?: (product: RopaProduct) => void;
};

// Precio SIEMPRE en pesos (UYU) y SIEMPRE mensual -- pedido explicito
// (15/09/2026): "el precio va a ser en pesos... eso es mensual". No hay
// selector de moneda, se manda fijo.
export function ProductFormModal({ token, product, onCancelar, onGuardado, onProductoActualizado }: ProductFormModalProps) {
  const genres = useRopaGenres();
  const isEditing = Boolean(product);
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [imagePreview, setImagePreview] = useState<string | null>(product ? getProductImageSrc(product) : null);
  const [pendingImageDataUri, setPendingImageDataUri] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Fotos extra (otros angulos) -- solo al editar, porque necesitan el id del producto.
  const MAX_GALLERY = 5;
  const [gallery, setGallery] = useState(product?.gallery ?? []);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function handleGalleryFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !product) return;
    setGalleryBusy(true);
    try {
      const resized = await resizeImageFile(file);
      const updated = await addProductGalleryImage(token, product.id, resized);
      setGallery(updated.gallery ?? []);
      onProductoActualizado?.(updated);
      toast.success("Foto agregada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo agregar la foto.");
    } finally {
      setGalleryBusy(false);
    }
  }

  async function handleGalleryDelete(imageId: number) {
    if (!product) return;
    setGalleryBusy(true);
    try {
      const updated = await deleteProductGalleryImage(token, product.id, imageId);
      setGallery(updated.gallery ?? []);
      onProductoActualizado?.(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo borrar la foto.");
    } finally {
      setGalleryBusy(false);
    }
  }

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

    if (!name.trim()) {
      setError("Ingresá el nombre del producto.");
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
        category,
        description: description.trim() || undefined,
        featured
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
            <small className="ropa-size-line">
              <strong>
                Medidas de producto ({PRODUCT_IMAGE_SIZE.width} x {PRODUCT_IMAGE_SIZE.height} px) (Instagram)
              </strong>
            </small>
          </label>

          {isEditing ? (
            <div className="ropa-field">
              <span>
                Más fotos (otros ángulos) · {gallery.length}/{MAX_GALLERY}
              </span>
              <div className="ropa-gallery-editor">
                {gallery.map((photo) => (
                  <div className="ropa-gallery-thumb" key={photo.id}>
                    <img src={photo.url} alt="Foto extra" />
                    <button type="button" className="ropa-gallery-thumb-remove" onClick={() => void handleGalleryDelete(photo.id)} disabled={galleryBusy} aria-label="Quitar foto">
                      ×
                    </button>
                  </div>
                ))}
                {gallery.length < MAX_GALLERY ? (
                  <>
                    <input type="file" accept="image/*" ref={galleryInputRef} onChange={(event) => void handleGalleryFile(event)} hidden />
                    <button type="button" className="ropa-gallery-add" onClick={() => galleryInputRef.current?.click()} disabled={galleryBusy}>
                      {galleryBusy ? "..." : "+"}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="ropa-hint">Las fotos extra se suman al editar el producto.</p>
          )}

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
            <span>Descripción (opcional)</span>
            <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>

          {/* "Producto destacado" (18/11/2026): la tarjeta lleva una etiqueta. */}
          <label className="ropa-check">
            <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
            <span>⭐ Producto destacado</span>
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
