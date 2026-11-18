import { useEffect, useRef, useState } from "react";
import { useRopaGenres, type RopaGenreKey } from "../ropa.genres";
import type { RopaSession } from "../ropa.session";
import { trackEvent } from "../ropa.track";
import { buildWhatsAppHref } from "../ropa.whatsapp";

const HEADER_WHATSAPP_HREF = buildWhatsAppHref("Hola! Quiero consultar por un producto.");

type HeaderProps = {
  session: RopaSession | null;
  cartCount: number;
  selectedGenre: RopaGenreKey | null;
  onSelectGenre: (genre: RopaGenreKey | null) => void;
  activeView: "catalogo" | "productos" | "carrusel" | "clientes" | "codigo" | "categorias";
  onInicio: () => void;
  onProductos: () => void;
  onCarrusel: () => void;
  onClientes: () => void;
  onCodigo: () => void;
  onCategorias: () => void;
  onIngresar: () => void;
  onSalir: () => void;
  onAbrirCarrito: () => void;
};

// "Categorias" (15/09/2026): antes los chips de genero (Cine/Musica/
// Juegos) vivian al lado del buscador -- pedido explicito de sacarlos de
// ahi y ponerlos en un desplegable propio del header.
export function Header({
  session,
  cartCount,
  selectedGenre,
  onSelectGenre,
  activeView,
  onInicio,
  onProductos,
  onCarrusel,
  onClientes,
  onCodigo,
  onCategorias,
  onIngresar,
  onSalir,
  onAbrirCarrito
}: HeaderProps) {
  const [showFeatures, setShowFeatures] = useState(false);
  const genres = useRopaGenres();
  const isAdmin = session?.user.role === "administrador";
  // Menu del usuario (solo celular, 17/11/2026): el icono de usuario al lado del
  // carrito. Administrador: todas las pestañas + Salir. Usuario comun: solo Salir.
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showUserMenu) return undefined;
    function handleOutside(event: MouseEvent | TouchEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [showUserMenu]);

  function runAndClose(action: () => void) {
    setShowUserMenu(false);
    action();
  }

  function handleSelectGenre(genre: RopaGenreKey | null) {
    onSelectGenre(genre);
    setShowFeatures(false);
  }

  return (
    <header className="ropa-header">
      {/* Se saco el boton "Ingresar" -- pedido explicito (15/09/2026):
          para entrar, se aprieta el logo del cliente. Solo tiene sentido
          cuando no hay sesion -- si ya estas logueado, el logo no hace
          nada (para eso esta "Salir"). */}
      {session ? (
        <span className="ropa-brand-text">Mi Tienda</span>
      ) : (
        <button type="button" className="ropa-brand-logo-button" onClick={onIngresar} aria-label="Ingresar">
          <span className="ropa-brand-text">Mi Tienda</span>
        </button>
      )}

      <nav className="ropa-nav">
        <button
          type="button"
          className={activeView === "catalogo" ? "ropa-nav-link is-active" : "ropa-nav-link"}
          onClick={onInicio}
        >
          Inicio
        </button>

        {isAdmin ? (
          <button
            type="button"
            className={activeView === "productos" ? "ropa-nav-link is-active" : "ropa-nav-link"}
            onClick={onProductos}
          >
            Productos
          </button>
        ) : null}

        {isAdmin ? (
          <button
            type="button"
            className={activeView === "carrusel" ? "ropa-nav-link is-active" : "ropa-nav-link"}
            onClick={onCarrusel}
          >
            Carrusel
          </button>
        ) : null}

        {isAdmin ? (
          <button
            type="button"
            className={activeView === "clientes" ? "ropa-nav-link is-active" : "ropa-nav-link"}
            onClick={onClientes}
          >
            Clientes
          </button>
        ) : null}

        {isAdmin ? (
          <button
            type="button"
            className={activeView === "codigo" ? "ropa-nav-link is-active" : "ropa-nav-link"}
            onClick={onCodigo}
          >
            Código
          </button>
        ) : null}

        {isAdmin ? (
          <button
            type="button"
            className={activeView === "categorias" ? "ropa-nav-link is-active" : "ropa-nav-link"}
            onClick={onCategorias}
          >
            Categorías
          </button>
        ) : null}

        <div className="ropa-features-dropdown">
          <button
            type="button"
            className={selectedGenre ? "ropa-nav-link is-active" : "ropa-nav-link"}
            onClick={() => setShowFeatures((current) => !current)}
          >
            Categorías
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" className="ropa-features-caret">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {showFeatures ? (
            <div className="ropa-features-panel" role="group" aria-label="Filtrar por categoría">
              <button
                type="button"
                className={selectedGenre === null ? "ropa-chip is-active" : "ropa-chip"}
                onClick={() => handleSelectGenre(null)}
              >
                Todos
              </button>
              {genres.map((genre) => (
                <button
                  type="button"
                  key={genre.key}
                  className={selectedGenre === genre.key ? "ropa-chip is-active" : "ropa-chip"}
                  onClick={() => handleSelectGenre(genre.key)}
                >
                  {genre.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Pedido explicito (14/10/2026): "saca lo que dice Contacto y
            Blog y pone el wpp flotante pero ponelo ahi como una pestana
            mas" -- la burbuja flotante (RopaHomePage.tsx) se saco del
            todo, ahora el acceso a WhatsApp en PC vive aca, como una
            pestana mas del menu. */}
        <a href={HEADER_WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="ropa-nav-link ropa-nav-link--whatsapp" onClick={() => trackEvent("whatsapp_click", { label: "encabezado" })}>
          <svg viewBox="0 0 32 32" width="15" height="15" fill="currentColor" aria-hidden="true">
            <path d="M16.02 3C9.4 3 4 8.36 4 15c0 2.28.64 4.42 1.75 6.24L4 29l7.98-1.7A11.9 11.9 0 0 0 16.02 27C22.64 27 28 21.64 28 15S22.64 3 16.02 3Zm6.54 16.9c-.28.79-1.62 1.5-2.24 1.58-.6.08-1.31.11-2.11-.13a19.4 19.4 0 0 1-1.94-.72c-3.42-1.48-5.65-4.91-5.82-5.14-.17-.23-1.39-1.85-1.39-3.52 0-1.67.87-2.49 1.18-2.83.31-.34.68-.42.91-.42.23 0 .45.002.65.011.21.01.49-.08.76.58.28.68.95 2.35 1.03 2.52.08.17.14.37.03.6-.11.23-.17.37-.34.57-.17.2-.36.45-.51.6-.17.17-.35.36-.15.71.2.34.88 1.45 1.89 2.35 1.3 1.16 2.4 1.52 2.74 1.69.34.17.54.14.74-.09.2-.23.85-.99 1.08-1.33.23-.34.46-.28.77-.17.31.11 1.97.93 2.31 1.1.34.17.57.26.65.4.08.14.08.8-.2 1.59Z" />
          </svg>
          WhatsApp
        </a>
      </nav>

      <div className="ropa-header-right">
        <button type="button" className="ropa-cart-button" onClick={onAbrirCarrito} aria-label="Ver carrito">
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1.4" />
            <circle cx="18" cy="21" r="1.4" />
            <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {cartCount > 0 ? <span className="ropa-cart-badge">{cartCount}</span> : null}
        </button>

        {session ? (
          <>
            {/* PC: nombre + Salir como siempre (las pestañas estan en el menu de arriba). */}
            <div className="ropa-session">
              <span className="ropa-session-name">{session.user.fullName || session.user.email}</span>
              <button type="button" className="ropa-button ropa-button--ghost" onClick={onSalir}>
                Salir
              </button>
            </div>

            {/* Celular: icono de usuario con el menu desplegable. */}
            <div className="ropa-user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="ropa-user-button"
                onClick={() => setShowUserMenu((current) => !current)}
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                aria-label="Menú de usuario"
              >
                <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </button>

              {showUserMenu ? (
                <div className="ropa-user-panel" role="menu">
                  {isAdmin ? (
                    <>
                      <span className="ropa-user-panel-title">Administrador</span>
                      <button type="button" role="menuitem" className={activeView === "catalogo" ? "ropa-user-item is-active" : "ropa-user-item"} onClick={() => runAndClose(onInicio)}>
                        Inicio
                      </button>
                      <button type="button" role="menuitem" className={activeView === "productos" ? "ropa-user-item is-active" : "ropa-user-item"} onClick={() => runAndClose(onProductos)}>
                        Productos
                      </button>
                      <button type="button" role="menuitem" className={activeView === "carrusel" ? "ropa-user-item is-active" : "ropa-user-item"} onClick={() => runAndClose(onCarrusel)}>
                        Carrusel
                      </button>
                      <button type="button" role="menuitem" className={activeView === "clientes" ? "ropa-user-item is-active" : "ropa-user-item"} onClick={() => runAndClose(onClientes)}>
                        Clientes
                      </button>
                      <button type="button" role="menuitem" className={activeView === "codigo" ? "ropa-user-item is-active" : "ropa-user-item"} onClick={() => runAndClose(onCodigo)}>
                        Código
                      </button>
                      <button type="button" role="menuitem" className={activeView === "categorias" ? "ropa-user-item is-active" : "ropa-user-item"} onClick={() => runAndClose(onCategorias)}>
                        Categorías
                      </button>
                      <div className="ropa-user-divider" />
                    </>
                  ) : null}
                  <button type="button" role="menuitem" className="ropa-user-item ropa-user-item--exit" onClick={() => runAndClose(onSalir)}>
                    Salir
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          // Solo se ve en celular (ver .ropa-header-whatsapp en global.css) --
          // en PC, sin sesion, el header-right queda con el carrito nomas.
          <a
            href={HEADER_WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="ropa-header-whatsapp"
            onClick={() => trackEvent("whatsapp_click", { label: "encabezado (celular)" })}
            aria-label="Escribinos por WhatsApp"
          >
            <svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M16.02 3C9.4 3 4 8.36 4 15c0 2.28.64 4.42 1.75 6.24L4 29l7.98-1.7A11.9 11.9 0 0 0 16.02 27C22.64 27 28 21.64 28 15S22.64 3 16.02 3Zm6.54 16.9c-.28.79-1.62 1.5-2.24 1.58-.6.08-1.31.11-2.11-.13a19.4 19.4 0 0 1-1.94-.72c-3.42-1.48-5.65-4.91-5.82-5.14-.17-.23-1.39-1.85-1.39-3.52 0-1.67.87-2.49 1.18-2.83.31-.34.68-.42.91-.42.23 0 .45.002.65.011.21.01.49-.08.76.58.28.68.95 2.35 1.03 2.52.08.17.14.37.03.6-.11.23-.17.37-.34.57-.17.2-.36.45-.51.6-.17.17-.35.36-.15.71.2.34.88 1.45 1.89 2.35 1.3 1.16 2.4 1.52 2.74 1.69.34.17.54.14.74-.09.2-.23.85-.99 1.08-1.33.23-.34.46-.28.77-.17.31.11 1.97.93 2.31 1.1.34.17.57.26.65.4.08.14.08.8-.2 1.59Z" />
            </svg>
          </a>
        )}
      </div>
    </header>
  );
}
