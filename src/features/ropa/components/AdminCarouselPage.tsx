import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { addCarouselImage, deleteCarouselImage, getCarouselImageSrc } from "../ropa.client";
import { CAROUSEL_SIZE, prepareCarouselImage } from "../ropa.imageResize";
import type { RopaCarouselImage } from "../ropa.types";

type AdminCarouselPageProps = {
  token: string;
  images: RopaCarouselImage[];
  isLoading: boolean;
  error: string | null;
  onAgregada: (image: RopaCarouselImage) => void;
  onEliminada: (imageId: number) => void;
};

// Pestaña "Carrusel" del admin: una sola subida. La misma imagen se ve en el
// celular y en la PC. Antes de subirla se revisa la forma (4 a 1): si no
// cumple, se avisa por qué en vez de subir algo que se vería mal.
export function AdminCarouselPage({ token, images, isLoading, error, onAgregada, onEliminada }: AdminCarouselPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [problema, setProblema] = useState<string | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setProblema(null);
    setSubiendo(true);
    try {
      const dataUri = await prepareCarouselImage(file);
      const image = await addCarouselImage(token, dataUri);
      onAgregada(image);
      toast.success("Imagen agregada al carrusel.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo subir la imagen.";
      setProblema(message);
      toast.error("No se pudo subir la imagen.");
    } finally {
      setSubiendo(false);
    }
  }

  async function handleEliminar(imageId: number) {
    setEliminandoId(imageId);
    try {
      await deleteCarouselImage(token, imageId);
      onEliminada(imageId);
      toast.success("Imagen eliminada del carrusel.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la imagen.");
    } finally {
      setEliminandoId(null);
      setConfirmandoId(null);
    }
  }

  return (
    <main className="ropa-admin-main">
      <div className="ropa-admin-header">
        <h2>Carrusel</h2>
        <input type="file" accept="image/jpeg,image/png,image/webp" ref={fileInputRef} onChange={(event) => void handleFile(event)} hidden />
        <button type="button" className="ropa-button ropa-button--primary" onClick={() => fileInputRef.current?.click()} disabled={subiendo}>
          {subiendo ? "Subiendo..." : "+ Subir imagen"}
        </button>
      </div>

      <div className="ropa-carousel-size">
        <strong>
          Medida del carrusel: {CAROUSEL_SIZE.width} × {CAROUSEL_SIZE.height} px (4 a 1)
        </strong>
        <span>
          También sirve más finita, hasta 1600 × 250. Es la misma imagen para celular y PC: todo lo importante tiene que ir CENTRADO (en el 45% del
          medio); en el celular se recortan los costados, así que nada de letras ni imágenes en los costados ni en las esquinas.
        </span>
      </div>

      {problema ? <p className="ropa-error">{problema}</p> : null}

      <p className="ropa-hint">Mientras no subas ninguna, el carrusel muestra 3 anuncios de ejemplo.</p>

      {error ? <p className="ropa-error ropa-error--center">{error}</p> : null}
      {!error && isLoading ? <p className="ropa-hint">Cargando...</p> : null}
      {!error && !isLoading && images.length === 0 ? <p className="ropa-hint">Todavía no agregaste ninguna imagen.</p> : null}

      <div className="ropa-carousel-grid">
        {images.map((image, index) => (
          <div className="ropa-carousel-item" key={image.id}>
            <img src={getCarouselImageSrc(image)} alt={`Carrusel #${index + 1}`} />
            {confirmandoId === image.id ? (
              <div className="ropa-carousel-item-confirm">
                <span>¿Eliminar?</span>
                <div className="ropa-modal-actions">
                  <button type="button" className="ropa-button ropa-button--ghost" onClick={() => setConfirmandoId(null)}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="ropa-button ropa-button--danger"
                    disabled={eliminandoId === image.id}
                    onClick={() => void handleEliminar(image.id)}
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="ropa-carousel-item-remove" onClick={() => setConfirmandoId(image.id)} aria-label="Eliminar imagen">
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
