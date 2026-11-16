import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  deleteClient,
  deleteProduct,
  getDiscountConfig,
  getCarouselDesktopImageSrc,
  getCarouselImageSrc,
  listCarouselImages,
  listCategories,
  listClients,
  listProducts,
  logoutUser,
  reorderProduct
} from "./ropa.client";
import { addToCart, clearCart, getCartCount, loadCart, removeFromCart, updateCartQuantity, type RopaCartItem } from "./ropa.cart";
import { AdminCarouselPage } from "./components/AdminCarouselPage";
import { AdminClientsPage } from "./components/AdminClientsPage";
import { AdminDiscountPage } from "./components/AdminDiscountPage";
import { AdminProductsPage } from "./components/AdminProductsPage";
import { AuthModal } from "./components/AuthModal";
import { Carousel, type CarouselSlide } from "./components/Carousel";

const SAMPLE_CARD_GRADIENTS = [
  "linear-gradient(160deg, #ffd1e1, #f7a8c4)",
  "linear-gradient(160deg, #e9d5ff, #cfa9f0)",
  "linear-gradient(160deg, #ffe0d1, #f8b9a0)",
  "linear-gradient(160deg, #d5e8ff, #a9c9f0)",
  "linear-gradient(160deg, #d8f5e3, #a9e0c0)",
  "linear-gradient(160deg, #fff0c9, #f5d98a)",
  "linear-gradient(160deg, #ffd9e6, #f4b6cc)",
  "linear-gradient(160deg, #f6d6f5, #e0a8de)"
];

const DEFAULT_CAROUSEL_SLIDES: CarouselSlide[] = [1, 2, 3].map((n) => ({
  key: `demo-${n}`,
  src: `${import.meta.env.BASE_URL}carrusel/anuncio-${n}.svg`,
  srcDesktop: `${import.meta.env.BASE_URL}carrusel/anuncio-${n}-pc.svg`
}));
import { CartDrawer } from "./components/CartDrawer";
import { ClientFormModal } from "./components/ClientFormModal";
import { Header } from "./components/Header";
import { MiniCart, type RopaLastAdded } from "./components/MiniCart";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { ProductFormModal } from "./components/ProductFormModal";
import { Footer } from "./components/Footer";
import { getGenreForCategory, getSubcategoryForCategory, setRopaGenres, useRopaGenres, type RopaGenreKey } from "./ropa.genres";
import { AdminCategoriesPage } from "./components/AdminCategoriesPage";
import { type RopaSize } from "./ropa.pricing";
import { clearSession, loadSession, saveSession, type RopaSession } from "./ropa.session";
import { setTrackingEnabled, trackEvent } from "./ropa.track";
import type { RopaCarouselImage, RopaClient, RopaDiscountConfig, RopaProduct } from "./ropa.types";

// Pantalla unica de arranque, pedida tal cual (14/09/2026): buscador en el
// medio + tarjetas de producto debajo, mismo espiritu visual que Netflix
// (buscador arriba, grilla de tarjetas abajo). Se le suma el header
// (marca, nav, ingresar) y el login/registro (15/09/2026), y despues
// tarjeta cuadrada + detalle al click + carrito + WhatsApp flotante
// (15/09/2026) -- el resto de las pantallas (editar producto, Blog,
// Contacto reales) se suman despues.
export function RopaHomePage() {
  const [session, setSession] = useState<RopaSession | null>(() => loadSession());
  // "catalogo" = lo que ve cualquier visitante; "productos" = pantalla
  // propia del admin para cargar/editar/borrar -- pedido explicito
  // (15/09/2026): "que no ingrese directo en la pantalla principal, que
  // tenga su propia pestaña".
  const [view, setView] = useState<"catalogo" | "productos" | "carrusel" | "clientes" | "codigo" | "categorias">("catalogo");
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<RopaGenreKey | null>(null);
  // Subcategoria (16/11/2026): se elige despues de la categoria; al cambiar
  // de categoria vuelve a "Todas".
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  useEffect(() => setSelectedSub(null), [selectedGenre]);
  const ropaGenres = useRopaGenres();
  const selectedGenreInfo = ropaGenres.find((genre) => genre.key === selectedGenre) ?? null;

  // Categorias editables por el administrador (16/11/2026): se piden al
  // servidor; si no responde, queda la lista de respaldo del codigo.
  useEffect(() => {
    void listCategories()
      .then((items) => {
        if (items.length > 0) setRopaGenres(items);
      })
      .catch(() => undefined);
  }, []);
  const [products, setProducts] = useState<RopaProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carouselImages, setCarouselImages] = useState<RopaCarouselImage[]>([]);
  const [isCarouselLoading, setIsCarouselLoading] = useState(true);
  const [carouselError, setCarouselError] = useState<string | null>(null);
  // Cuenta corriente (15/09/2026) -- SOLO se pide al backend cuando hay
  // sesion de admin (ver useEffect mas abajo), a diferencia de
  // productos/carrusel que son publicos y se piden siempre.
  const [clients, setClients] = useState<RopaClient[]>([]);
  const [isClientsLoading, setIsClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  // Codigo de descuento (28/09/2026) -- publico, se pide siempre junto con
  // productos/carrusel. null = deshabilitado O no se pudo consultar (ver
  // CartDrawer: en cualquiera de los dos casos, el input de codigo ni
  // aparece -- pedido explicito: si falla, se trata igual que "no hay
  // codigo", sin mostrarle ningun error al cliente final por esto).
  const [discountConfig, setDiscountConfig] = useState<RopaDiscountConfig | null>(null);
  // "new" = alta; un RopaProduct = edicion de ese producto; null = cerrado.
  // Un solo estado para las dos cosas -- mismo modal (ver
  // ProductFormModal), pedido 15/09/2026.
  const [productFormTarget, setProductFormTarget] = useState<RopaProduct | "new" | null>(null);
  // Mismo criterio para clientes (ver ClientFormModal).
  const [clientFormTarget, setClientFormTarget] = useState<RopaClient | "new" | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<RopaProduct | null>(null);
  const [cartItems, setCartItems] = useState<RopaCartItem[]>(() => loadCart());
  const [showCart, setShowCart] = useState(false);
  // Ultimo producto agregado: dispara el mini carrito lateral (MiniCart).
  const [lastAdded, setLastAdded] = useState<RopaLastAdded | null>(null);
  const searchRowRef = useRef<HTMLFormElement>(null);
  const [fadeStart, setFadeStart] = useState<number | null>(null);

  const isAdmin = session?.user.role === "administrador";

  // Contador de visitas (30/10/2026): una visita por apertura de la pagina,
  // y nada de lo que haga el administrador cuenta (ver ropa.track.ts).
  const visitTrackedRef = useRef(false);
  useEffect(() => {
    setTrackingEnabled(!isAdmin);
    if (!isAdmin && !visitTrackedRef.current) {
      visitTrackedRef.current = true;
      trackEvent("visit");
    }
  }, [isAdmin]);

  function handleOpenProduct(product: RopaProduct) {
    trackEvent("view_product", { productId: product.id, label: product.name });
    setSelectedProduct(product);
  }

  function handleOpenCart() {
    trackEvent("open_cart");
    setShowCart(true);
  }

  // La foto de fondo (fija a la ventana) empieza a oscurecerse justo
  // debajo del buscador -- pedido explicito (15/09/2026): "en la caja de
  // abajo del input, ahi es la division". Se mide la posicion real del
  // buscador (no un porcentaje fijo) para que la linea quede siempre
  // pegada a el, sea cual sea el tamaño de pantalla.
  useEffect(() => {
    function measureFadeStart() {
      if (!searchRowRef.current) return;
      const rect = searchRowRef.current.getBoundingClientRect();
      setFadeStart(rect.bottom + window.scrollY);
    }
    measureFadeStart();
    window.addEventListener("resize", measureFadeStart);
    return () => window.removeEventListener("resize", measureFadeStart);
  }, []);

  // El genero (Cine/Musica/Juegos) filtra sobre lo que ya trajo el
  // buscador -- no pega al backend de nuevo, se resuelve en el momento a
  // partir de la categoria de cada producto (ver ropa.genres.ts).
  const visibleProducts = selectedGenre
    ? products.filter(
        (product) =>
          getGenreForCategory(product.category) === selectedGenre &&
          (selectedSub === null || getSubcategoryForCategory(product.category) === selectedSub)
      )
    : products;

  async function refresh(search?: string) {
    setIsLoading(true);
    try {
      const items = await listProducts(search);
      setProducts(items);
      setError(null);
    } catch (fetchError) {
      console.error("[ropa] Error al cargar productos:", fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "No se pudo cargar el catálogo.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh(query);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  // Mientras el admin no cargue imagenes propias (o si no se pueden traer),
  // se muestran 3 anuncios de ejemplo; apenas suba la primera, la reemplaza.
  const carouselSlides: CarouselSlide[] =
    carouselImages.length > 0 && !carouselError
      ? carouselImages.map((image) => ({
          key: image.id,
          src: getCarouselImageSrc(image),
          srcDesktop: getCarouselDesktopImageSrc(image) ?? undefined
        }))
      : DEFAULT_CAROUSEL_SLIDES;

  async function refreshCarousel() {
    setIsCarouselLoading(true);
    try {
      const items = await listCarouselImages();
      setCarouselImages(items);
      setCarouselError(null);
    } catch (fetchError) {
      setCarouselError(fetchError instanceof Error ? fetchError.message : "No se pudo cargar el carrusel.");
    } finally {
      setIsCarouselLoading(false);
    }
  }

  useEffect(() => {
    void refreshCarousel();
  }, []);

  useEffect(() => {
    getDiscountConfig()
      .then((config) => setDiscountConfig(config.enabled ? config : null))
      .catch(() => setDiscountConfig(null));
  }, []);

  // Cuenta corriente: se pide recien cuando hay sesion de admin (el
  // endpoint exige token, a diferencia de productos/carrusel que son
  // publicos) -- si se desloguea, se limpia para no dejar datos de
  // clientes colgados en memoria.
  useEffect(() => {
    if (!isAdmin || !session) {
      setClients([]);
      return;
    }
    setIsClientsLoading(true);
    listClients(session.token)
      .then((items) => {
        setClients(items);
        setClientsError(null);
      })
      .catch((fetchError) => {
        setClientsError(fetchError instanceof Error ? fetchError.message : "No se pudo cargar la cuenta corriente.");
      })
      .finally(() => setIsClientsLoading(false));
  }, [isAdmin, session]);

  function handleInicio() {
    setView("catalogo");
    setQuery("");
    setSelectedGenre(null);
  }

  async function handleSalir() {
    if (session) {
      await logoutUser(session.token);
    }
    clearSession();
    setSession(null);
    setView("catalogo");
    toast.success("Saliste de tu cuenta.");
  }

  function handleAgregarAlCarrito(product: RopaProduct, size: RopaSize, quantity: number) {
    trackEvent("add_to_cart", { productId: product.id, label: `${product.name}${size ? ` (${size})` : ""} x${quantity}` });
    setCartItems((current) => addToCart(current, product, size, quantity));
    setSelectedProduct(null);
    // Pedido explicito (19/09/2026): en vez del toast "se agrego al
    // carrito", entra el mini carrito lateral con el resumen (ver
    // MiniCart.tsx). Un id nuevo por agregado hace que reaparezca y
    // reinicie los 3 segundos aunque ya estuviera a la vista.
    setLastAdded({ id: Date.now(), product, size, quantity });
  }

  function handleEditar(product: RopaProduct) {
    setSelectedProduct(null);
    setProductFormTarget(product);
  }

  async function handleEliminar(product: RopaProduct) {
    if (!session) return;
    try {
      await deleteProduct(session.token, product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setSelectedProduct(null);
      toast.success(`"${product.name}" se eliminó.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el producto.");
    }
  }

  // Orden manual (16/09/2026): el swap en el backend cambia la posicion
  // de DOS productos a la vez (el movido y el que ya estaba en ese
  // puesto) -- se vuelve a pedir la lista entera en vez de parchear a
  // mano, para no arriesgarse a que el otro quede con un numero viejo.
  async function handleReordenarProducto(product: RopaProduct, position: number) {
    if (!session) return;
    try {
      await reorderProduct(session.token, product.id, position);
      await refresh(query);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo reordenar el producto.");
    }
  }

  function handleEditarCliente(client: RopaClient) {
    setClientFormTarget(client);
  }

  async function handleEliminarCliente(client: RopaClient) {
    if (!session) return;
    try {
      await deleteClient(session.token, client.id);
      setClients((current) => current.filter((item) => item.id !== client.id));
      toast.success(`"${client.name}" se eliminó.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el cliente.");
    }
  }

  return (
    <div className="ropa-shell">
      {/* Foto de fondo de TODA la pagina (no solo del hero) -- fija a la
          ventana, el contenido scrollea por encima. Se sirve directo
          desde public/ (no empaquetada por Vite). Pedido explicito
          (15/09/2026): "dejemos la foto de fondo original" -- las fotos
          que carga el admin en "Carrusel" van en su propia vidriera
          horizontal dentro del catalogo (ver Carousel.tsx), no aca. */}
      <div
        className="ropa-page-backdrop"
        style={{
          backgroundImage: "linear-gradient(160deg, #ffd3e3 0%, #ffe8f0 55%, #fff5f8 100%)",
          ...(fadeStart ? ({ "--ropa-fade-start": `${fadeStart}px` } as Record<string, string>) : {})
        }}
      />

      {/* Hero: header arriba con aire, sobre la foto de fondo fija. Se va
          oscureciendo hacia abajo (ver .ropa-page-backdrop::after) hasta
          hacer contraste con el buscador y las tarjetas, sin dejar de
          ser la misma foto. */}
      <div className="ropa-hero">
        <Header
          session={session}
          cartCount={getCartCount(cartItems)}
          selectedGenre={selectedGenre}
          onSelectGenre={(genre) => {
            // Pedido explicito (17/09/2026): "si estoy en Productos y
            // pongo categoria, no me lleva a categoria, queda trancado
            // ahi" -- elegir una categoria solo actualizaba el filtro,
            // nunca cambiaba la vista. Andaba "bien" en Inicio porque ya
            // estabamos en catalogo (no hacia falta navegar a ningun
            // lado), pero en Productos/Carrusel/Clientes el filtro
            // quedaba aplicado sin que se viera nada.
            setSelectedGenre(genre);
            setView("catalogo");
          }}
          activeView={view}
          onInicio={handleInicio}
          onProductos={() => setView("productos")}
          onCarrusel={() => setView("carrusel")}
          onClientes={() => setView("clientes")}
          onCodigo={() => setView("codigo")}
          onCategorias={() => setView("categorias")}
          onIngresar={() => setShowAuthModal(true)}
          onSalir={() => void handleSalir()}
          onAbrirCarrito={handleOpenCart}
        />

        {/* Pegado a la cabecera de verdad (adentro de .ropa-hero, justo
            despues del <Header>) -- pedido explicito (15/09/2026): "no
            quedo pegado a la cabecera, quedo pegado al titulo del
            buscador". El hero reserva un alto grande (46vh) para
            lucir la foto de fondo antes del titulo/buscador; poniendo
            el carrusel afuera de este div quedaba pegado al titulo en
            vez de al header, por ese espacio de por medio. */}
        {view === "catalogo" && !isCarouselLoading ? (
          <div className="ropa-carousel-wrap">
            <Carousel images={carouselSlides} />
          </div>
        ) : null}
      </div>

      {view === "productos" && isAdmin ? (
        <AdminProductsPage
          products={products}
          isLoading={isLoading}
          error={error}
          onNuevo={() => setProductFormTarget("new")}
          onEditar={handleEditar}
          onEliminar={(product) => void handleEliminar(product)}
          onReordenar={(product, position) => void handleReordenarProducto(product, position)}
        />
      ) : view === "carrusel" && isAdmin && session ? (
        <AdminCarouselPage
          token={session.token}
          images={carouselImages}
          isLoading={isCarouselLoading}
          error={carouselError}
          onAgregada={(image) => setCarouselImages((current) => [...current, image])}
          onActualizada={(image) => setCarouselImages((current) => current.map((item) => (item.id === image.id ? image : item)))}
          onEliminada={(imageId) => setCarouselImages((current) => current.filter((item) => item.id !== imageId))}
        />
      ) : view === "clientes" && isAdmin && session ? (
        <AdminClientsPage
          clients={clients}
          isLoading={isClientsLoading}
          error={clientsError}
          onNuevo={() => setClientFormTarget("new")}
          onEditar={handleEditarCliente}
          onEliminar={(client) => void handleEliminarCliente(client)}
        />
      ) : view === "categorias" && isAdmin && session ? (
        <AdminCategoriesPage token={session.token} />
      ) : view === "codigo" && isAdmin && session ? (
        <AdminDiscountPage
          token={session.token}
          onGuardado={(config) => setDiscountConfig(config.enabled ? config : null)}
        />
      ) : (
        <>

          <div className="ropa-search-wrap">
            <div className="ropa-hero-heading">
              <h1 className="ropa-hero-title">Encontrá tu próximo detalle favorito</h1>
            </div>

            <form className="ropa-search-row" ref={searchRowRef} onSubmit={(event) => event.preventDefault()}>
              <span className="ropa-search-icon ropa-search-icon--left" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.2" y2="16.2" strokeLinecap="round" />
                </svg>
              </span>

              <input
                type="text"
                className="ropa-search-input"
                placeholder="Buscar productos"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
              />

              <button type="submit" className="ropa-search-button" aria-label="Buscar">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.2" y2="16.2" strokeLinecap="round" />
                </svg>
              </button>
            </form>

            {/* Pedido de un cliente (30/10/2026): las categorias tambien a
                la vista, en una fila prolija abajo del buscador (el
                desplegable "Categorías" del header queda igual). */}
            <div className="ropa-genre-row" role="group" aria-label="Filtrar por categoría">
              <button
                type="button"
                className={selectedGenre === null ? "ropa-chip is-active" : "ropa-chip"}
                onClick={() => setSelectedGenre(null)}
              >
                Todos
              </button>
              {ropaGenres.map((genre) => (
                <button
                  type="button"
                  key={genre.key}
                  className={selectedGenre === genre.key ? "ropa-chip is-active" : "ropa-chip"}
                  onClick={() => setSelectedGenre(genre.key)}
                >
                  {genre.label}
                </button>
              ))}
            </div>

            {selectedGenreInfo ? (
              <div className="ropa-genre-row ropa-genre-row--sub" role="group" aria-label={`Subcategorías de ${selectedGenreInfo.label}`}>
                <button
                  type="button"
                  className={selectedSub === null ? "ropa-chip ropa-chip--sub is-active" : "ropa-chip ropa-chip--sub"}
                  onClick={() => setSelectedSub(null)}
                >
                  Todo {selectedGenreInfo.label}
                </button>
                {selectedGenreInfo.subcategories.map((sub) => (
                  <button
                    type="button"
                    key={sub.key}
                    className={selectedSub === sub.key ? "ropa-chip ropa-chip--sub is-active" : "ropa-chip ropa-chip--sub"}
                    onClick={() => setSelectedSub(sub.key)}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <main className="ropa-main">
            {/* (16/11/2026) El error tecnico ("Cannot GET ...") lo ve SOLO el
                admin (y queda en la consola); el cliente ve un mensaje amable. */}
            {error ? (
              isAdmin ? (
                <p className="ropa-error ropa-error--center">Error al cargar productos: {error}</p>
              ) : (
                <p className="ropa-hint">Todavía no hay productos cargados.</p>
              )
            ) : null}

            {!error && isLoading ? <p className="ropa-hint">Cargando...</p> : null}

            {!error && !isLoading && visibleProducts.length === 0 ? (
              <p className="ropa-hint">
                {query.trim()
                  ? `No se encontraron productos para "${query.trim()}".`
                  : selectedGenre
                    ? "No hay productos cargados en esta categoría todavía."
                    : "Todavía no hay productos cargados."}
              </p>
            ) : null}

            {!isLoading && visibleProducts.length === 0 && !query.trim() && !selectedGenre ? (
              <div className="ropa-grid ropa-grid--samples" aria-hidden="true">
                {SAMPLE_CARD_GRADIENTS.map((gradient, index) => (
                  <div className="ropa-card ropa-card--sample" key={index}>
                    <div className="ropa-card-media" style={{ background: gradient }}>
                      <span className="ropa-card-sample-tag">Ejemplo</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 7a2 2 0 1 0-2-2" />
                        <path d="M12 7v2l9 5.5a1.2 1.2 0 0 1-.6 2.2H3.6A1.2 1.2 0 0 1 3 14.5L12 9" />
                      </svg>
                      <span>Foto del producto</span>
                      <span className="ropa-card-sample-size">640 × 640 px</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="ropa-grid">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} onClick={handleOpenProduct} />
              ))}
            </div>
          </main>
        </>
      )}

      <Footer />

      {selectedProduct ? (
        <ProductDetailModal
          product={selectedProduct}
          isAdmin={isAdmin}
          onCerrar={() => setSelectedProduct(null)}
          onAgregarAlCarrito={handleAgregarAlCarrito}
          onEditar={handleEditar}
          onEliminar={(product) => void handleEliminar(product)}
        />
      ) : null}

      <MiniCart items={cartItems} lastAdded={lastAdded} hidden={showCart} onVerCarrito={handleOpenCart} />

      {showCart ? (
        <CartDrawer
          items={cartItems}
          onCerrar={() => setShowCart(false)}
          onCambiarCantidad={(productId, size, quantity) =>
            setCartItems((current) => updateCartQuantity(current, productId, size, quantity))
          }
          onQuitar={(productId, size) => setCartItems((current) => removeFromCart(current, productId, size))}
          onVaciar={() => {
            setCartItems(clearCart());
            toast.success("Carrito vaciado.");
          }}
          // Pedido explicito (19/09/2026): al tocar "Comprar por WhatsApp" el
          // carrito tiene que vaciarse (antes quedaba la lista armada). Se
          // cierra tambien el cajon para volver a una pantalla limpia.
          onCompraEnviada={() => {
            setCartItems(clearCart());
            setShowCart(false);
          }}
          discountConfig={discountConfig}
        />
      ) : null}

      {productFormTarget && session ? (
        <ProductFormModal
          token={session.token}
          product={productFormTarget === "new" ? undefined : productFormTarget}
          onCancelar={() => setProductFormTarget(null)}
          onGuardado={(product) => {
            const wasEditing = productFormTarget !== "new";
            setProductFormTarget(null);
            // Un producto nuevo entra siempre al final (mayor numero de
            // posicion, ver ropa-products.service.ts#createProduct) -- se
            // agrega al final del array tambien, para no mostrarlo
            // primero en el catalogo cuando en realidad quedo ultimo.
            setProducts((current) =>
              wasEditing ? current.map((item) => (item.id === product.id ? product : item)) : [...current, product]
            );
            toast.success(wasEditing ? `"${product.name}" se actualizó.` : `"${product.name}" se agregó correctamente.`);
          }}
        />
      ) : null}

      {clientFormTarget && session ? (
        <ClientFormModal
          token={session.token}
          client={clientFormTarget === "new" ? undefined : clientFormTarget}
          onCancelar={() => setClientFormTarget(null)}
          onGuardado={(client) => {
            const wasEditing = clientFormTarget !== "new";
            setClientFormTarget(null);
            setClients((current) =>
              wasEditing ? current.map((item) => (item.id === client.id ? client : item)) : [client, ...current]
            );
            toast.success(wasEditing ? `"${client.name}" se actualizó.` : `"${client.name}" se agregó correctamente.`);
          }}
        />
      ) : null}

      {showAuthModal ? (
        <AuthModal
          onCancelar={() => setShowAuthModal(false)}
          onIngresado={(nextSession) => {
            saveSession(nextSession);
            setSession(nextSession);
            setShowAuthModal(false);
            toast.success(`Hola, ${nextSession.user.fullName || nextSession.user.email}.`);
          }}
        />
      ) : null}
    </div>
  );
}
