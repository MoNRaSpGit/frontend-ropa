import { useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  addCarouselImage,
  deleteCarouselImage,
  getCarouselDesktopImageSrc,
  getCarouselImageSrc,
  setCarouselDesktopImage
} from "../ropa.client";
import { CAROUSEL_SIZES, resizeCarouselImageFile } from "../ropa.imageResize";
import type { RopaCarouselImage } from "../ropa.types";

type AdminCarouselPageProps = {
  token: string;
  images: RopaCarouselImage[];
  isLoading: boolean;
  error: string | null;
  onAgregada: (image: RopaCarouselImage) => void;
  onActualizada: (image: RopaCarouselImage) => void;
  onEliminada: (imageId: number) => void;
};

// Prompts para que la clienta genere los banners con su IA (16/11/2026,
// pedido explicito): boton "Copiar prompt" por cada medida.
const AI_PROMPTS = {
  mobile: `Necesito un banner publicitario para el carrusel de la tienda online de ropa, en la versión para CELULAR.

Medidas exactas: ${CAROUSEL_SIZES.mobile.width} x ${CAROUSEL_SIZES.mobile.height} píxeles (horizontal, proporción 3:1).

Cómo tiene que ser:
- La imagen se ve ENTERA en el celular, pero chica (unos 390 x 130 px en pantalla). Por eso: poco texto y bien grande.
- Máximo un título corto (2 a 5 palabras) y, si hace falta, una frase breve abajo. Nada de letra chica.
- Dejá un margen libre de al menos 60 px en los 4 bordes: ningún texto ni prenda pegado al borde.
- Texto a la izquierda y la prenda/foto o dibujo a la derecha queda muy bien.
- Estilo de la tienda: rosa pastel, femenino, limpio y moderno. Buen contraste entre el texto y el fondo para que se lea.
- Sin marcos, sin bordes blancos y sin simular una pantalla de celular: la imagen ocupa todo el lienzo.

Tema del banner: [ESCRIBÍ ACÁ DE QUÉ ES: ej. "nueva temporada de primavera", "20% off en jeans", "envío gratis"]`,
  desktop: `Necesito un banner publicitario para el carrusel de la tienda online de ropa, en la versión para PC (computadora).

Medidas exactas: ${CAROUSEL_SIZES.desktop.width} x ${CAROUSEL_SIZES.desktop.height} píxeles (una franja MUY horizontal y finita, proporción 6,4:1).

Cómo tiene que ser:
- La franja ocupa todo el ancho de la pantalla. En ventanas más angostas se recortan los COSTADOS, así que todo lo importante (texto, prenda, logo) tiene que ir en la zona CENTRAL: entre los píxeles 500 y 1420 de ancho.
- Los costados (los primeros y últimos 500 px) solo con fondo, color o decoración que se pueda cortar sin problema.
- Dejá al menos 30 px libres arriba y abajo: ningún texto pegado al borde.
- Un título corto y bien legible, y como mucho una frase breve. Es una franja finita: poco texto.
- Estilo de la tienda: rosa pastel, femenino, limpio y moderno. Buen contraste entre el texto y el fondo para que se lea.
- Sin marcos ni bordes blancos: la imagen ocupa todo el lienzo.

Tema del banner: [ESCRIBÍ ACÁ DE QUÉ ES: ej. "nueva temporada de primavera", "20% off en jeans", "envío gratis"]`
} as const;

async function copyPrompt(variant: keyof typeof AI_PROMPTS) {
  try {
    await navigator.clipboard.writeText(AI_PROMPTS[variant]);
    toast.success(`Prompt para ${variant === "mobile" ? "celular" : "PC"} copiado. Pegalo en tu IA y completá el tema.`);
  } catch {
    toast.error("No se pudo copiar. Probá de nuevo.");
  }
}

// Pestaña "Carrusel" del admin. Cada slide tiene su imagen de CELULAR
// (obligatoria, 1200x400) y una de PC opcional (1920x300). Sin la de PC,
// la computadora muestra la de celular.
export function AdminCarouselPage({ token, images, isLoading, error, onAgregada, onActualizada, onEliminada }: AdminCarouselPageProps) {
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [desktopTargetId, setDesktopTargetId] = useState<number | null>(null);
  const [subiendoDesktopId, setSubiendoDesktopId] = useState<number | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  async function handleMobileFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setSubiendo(true);
    try {
      const dataUri = await resizeCarouselImageFile(file, "mobile");
      const image = await addCarouselImage(token, dataUri);
      onAgregada(image);
      toast.success("Imagen agregada. Si querés, subile también la versión PC.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setSubiendo(false);
    }
  }

  async function handleDesktopFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const imageId = desktopTargetId;
    if (!file || imageId === null) return;

    setSubiendoDesktopId(imageId);
    try {
      const dataUri = await resizeCarouselImageFile(file, "desktop");
      const image = await setCarouselDesktopImage(token, imageId, dataUri);
      onActualizada(image);
      toast.success("Versión PC guardada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setSubiendoDesktopId(null);
      setDesktopTargetId(null);
    }
  }

  function pickDesktopFor(imageId: number) {
    setDesktopTargetId(imageId);
    desktopInputRef.current?.click();
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

  const { mobile, desktop } = CAROUSEL_SIZES;

  return (
    <main className="ropa-admin-main">
      <div className="ropa-admin-header">
        <h2>Carrusel</h2>
        <input type="file" accept="image/*" ref={mobileInputRef} onChange={(event) => void handleMobileFile(event)} hidden />
        <input type="file" accept="image/*" ref={desktopInputRef} onChange={(event) => void handleDesktopFile(event)} hidden />
        <button
          type="button"
          className="ropa-button ropa-button--primary"
          onClick={() => mobileInputRef.current?.click()}
          disabled={subiendo}
        >
          {subiendo ? "Subiendo..." : "+ Agregar imagen"}
        </button>
      </div>

      <div className="ropa-carousel-sizes">
        <div className="ropa-carousel-size">
          <strong>📱 Celular: {mobile.width} × {mobile.height} px</strong>
          <span>Se ve entera. Poco texto y grande, con margen en los bordes.</span>
          <button type="button" className="ropa-button ropa-button--ghost" onClick={() => void copyPrompt("mobile")}>
            Copiar prompt para IA
          </button>
        </div>
        <div className="ropa-carousel-size">
          <strong>💻 PC: {desktop.width} × {desktop.height} px</strong>
          <span>Lo importante al centro: los costados se pueden cortar.</span>
          <button type="button" className="ropa-button ropa-button--ghost" onClick={() => void copyPrompt("desktop")}>
            Copiar prompt para IA
          </button>
        </div>
      </div>

      <p className="ropa-hint">
        Primero agregá la imagen de celular; después, en esa misma tarjeta, subí la versión PC. Si no tiene versión PC, la
        computadora muestra la de celular. Mientras no subas ninguna, el carrusel muestra 3 anuncios de ejemplo.
      </p>

      {error ? <p className="ropa-error ropa-error--center">{error}</p> : null}
      {!error && isLoading ? <p className="ropa-hint">Cargando...</p> : null}
      {!error && !isLoading && images.length === 0 ? <p className="ropa-hint">Todavía no agregaste ninguna imagen.</p> : null}

      <div className="ropa-carousel-grid">
        {images.map((image, index) => {
          const desktopSrc = getCarouselDesktopImageSrc(image);
          return (
            <div className="ropa-carousel-card" key={image.id}>
              <div className="ropa-carousel-item ropa-carousel-item--mobile">
                <img src={getCarouselImageSrc(image)} alt={`Carrusel #${index + 1} (celular)`} />
                <span className="ropa-carousel-item-tag">📱 Celular</span>
                {confirmandoId === image.id ? (
                  <div className="ropa-carousel-item-confirm">
                    <span>¿Eliminar las dos versiones?</span>
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
                  <button
                    type="button"
                    className="ropa-carousel-item-remove"
                    onClick={() => setConfirmandoId(image.id)}
                    aria-label="Eliminar imagen"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="ropa-carousel-item ropa-carousel-item--desktop">
                {desktopSrc ? (
                  <img src={desktopSrc} alt={`Carrusel #${index + 1} (PC)`} />
                ) : (
                  <span className="ropa-carousel-item-empty">Sin versión PC</span>
                )}
                <span className="ropa-carousel-item-tag">💻 PC</span>
              </div>

              <button
                type="button"
                className="ropa-button ropa-button--ghost"
                disabled={subiendoDesktopId === image.id}
                onClick={() => pickDesktopFor(image.id)}
              >
                {subiendoDesktopId === image.id ? "Subiendo..." : desktopSrc ? "Cambiar versión PC" : "+ Subir versión PC"}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
