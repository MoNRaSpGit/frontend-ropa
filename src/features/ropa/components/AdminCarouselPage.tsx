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

// Prompt para que la clienta genere el banner con su IA (17/11/2026): UNA sola
// medida que se ve bien en celular y en PC. En PC se ve entera; en celular se
// recortan un poco los costados, por eso lo importante va al centro.
const AI_PROMPT = `Necesito un banner publicitario para el carrusel de la tienda online Armii Creaciones Alexa (accesorios y regalos personalizados).

Medidas exactas: ${CAROUSEL_SIZE.width} x ${CAROUSEL_SIZE.height} píxeles (una franja horizontal, proporción 4:1).

Cómo tiene que ser:
- La misma imagen se ve en el celular y en la computadora. En la compu se ve casi entera; en el celular se recortan los COSTADOS. Por eso TODO lo importante (título, frase, producto, logo) tiene que estar CENTRADO, dentro del 45% central del ancho (entre los píxeles 440 y 1160).
- Los costados y las ESQUINAS tienen que quedar libres: nada de letras, logos ni imágenes ahí. Solo fondo, color o una decoración suave que se pueda cortar sin problema.
- Dejá al menos 30 px libres arriba y abajo: ningún texto pegado al borde.
- Un título corto y bien grande (2 a 5 palabras) y, como mucho, una frase breve. En el celular la imagen se ve chica: nada de letra chica.
- Estilo de la tienda: rosa pastel, femenino, limpio y moderno. Buen contraste entre el texto y el fondo para que se lea.
- Sin marcos ni bordes blancos: la imagen ocupa todo el lienzo.

Tema del banner: [ESCRIBÍ ACÁ DE QUÉ ES: ej. "Chupeteros personalizados", "Día de la madre", "Envío gratis"]`;

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(AI_PROMPT);
    toast.success("Prompt copiado. Pegalo en tu IA y completá el tema.");
  } catch {
    toast.error("No se pudo copiar. Probá de nuevo.");
  }
}

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
          Medida: {CAROUSEL_SIZE.width} × {CAROUSEL_SIZE.height} px (4 a 1). También sirve más finita, hasta 1600 × 250.
        </strong>
        <span>
          La misma imagen se ve en celular y en PC. Todo lo importante tiene que ir CENTRADO (en el 45% del medio): en el celular se recortan los
          costados, así que nada de letras ni imágenes en los costados ni en las esquinas.
        </span>
        <button type="button" className="ropa-button ropa-button--ghost" onClick={() => void copyPrompt()}>
          Copiar prompt para IA
        </button>
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
