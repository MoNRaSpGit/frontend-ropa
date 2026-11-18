// Prompts para la IA (17/11/2026). Hay DOS tipos, para productos y para el carrusel:
//  - CREAR: la IA genera una imagen nueva desde cero.
//  - ARREGLAR: la clienta adjunta SU propia foto y la IA la adapta a la medida
//    sin cambiar el producto (porque hay fotos que sacó ella y no quedan bien).
// Productos: vertical, formato Instagram 4 a 5. La tarjeta es 4:5 y puede recortar
// apenas los bordes, por eso se pide nada importante pegado al borde.
// Carrusel: franja 4 a 1, todo lo importante centrado (en celular se recortan los costados).
export const PRODUCT_IMAGE_SIZE = { width: 1080, height: 1350 } as const;
export const CAROUSEL_IMAGE_SIZE = { width: 1600, height: 400 } as const;

const PRODUCT_TOPIC =
  '[ESCRIBÍ ACÁ QUÉ ES: ej. "chupetero con letras y aplique de zebra", "pulsera tejida", "collar para mascotas"]';
const CAROUSEL_TOPIC = '[ESCRIBÍ ACÁ DE QUÉ ES: ej. "Chupeteros personalizados", "Día de la madre", "Envío gratis"]';

// ---------- PRODUCTOS ----------
export const PRODUCT_CREATE_PROMPT = `Necesito una foto de producto para el catálogo de la tienda online Armii Creaciones Alexa (accesorios y regalos personalizados).

Medidas exactas: ${PRODUCT_IMAGE_SIZE.width} x ${PRODUCT_IMAGE_SIZE.height} píxeles (vertical, formato Instagram, proporción 4:5).

Cómo tiene que ser:
- El producto bien GRANDE y CENTRADO, ocupando casi todo el cuadro, con un margen parejo de unos 90 px por cada lado. Que no quede chiquito en el medio.
- Fondo liso y claro (blanco, crema o rosa muy suave), sin objetos que distraigan.
- Nada importante pegado a los bordes ni a las esquinas: la tarjeta puede recortar apenas los costados y los bordes de la imagen.
- Todo el producto tiene que verse completo, sin cortarse.
- Luz natural y pareja, sin sombras fuertes. Foto nítida y bien enfocada.
- Sin texto, sin marcos, sin bordes de color y sin marcas de agua.

Producto: ${PRODUCT_TOPIC}`;

export const PRODUCT_FIX_PROMPT = `Te adjunto una foto de un producto que saqué yo. Necesito que la adaptes para el catálogo de mi tienda online, SIN cambiar el producto.

Medidas exactas de la imagen final: ${PRODUCT_IMAGE_SIZE.width} x ${PRODUCT_IMAGE_SIZE.height} píxeles (vertical, formato Instagram, proporción 4:5).

Qué tenés que hacer:
- Mantené el producto EXACTAMENTE como es: mismos colores, forma, detalles, letras y materiales. No lo inventes, no lo cambies y no le agregues cosas.
- Si mi foto no tiene la forma 4:5, NO la estires ni la deformes. Ampliá el fondo hacia los costados o hacia arriba y abajo, continuando el mismo fondo, hasta llegar a la medida. Si sobra fondo, recortalo, pero nunca cortes el producto.
- El producto tiene que quedar GRANDE y CENTRADO, ocupando casi todo el cuadro, con un margen parejo de unos 90 px por cada lado.
- Limpiá el fondo: que quede liso y claro (blanco, crema o rosa muy suave). Sacá objetos que distraigan, manchas y sombras duras.
- Mejorá la luz y la nitidez sin cambiar los colores reales del producto.
- Nada importante pegado a los bordes ni a las esquinas.
- Sin texto, sin marcos, sin bordes de color y sin marcas de agua.

Devolveme solamente la imagen final.

Producto (para que sepas qué es): ${PRODUCT_TOPIC}`;

// ---------- CARRUSEL ----------
export const CAROUSEL_CREATE_PROMPT = `Necesito un banner publicitario para el carrusel de la tienda online Armii Creaciones Alexa (accesorios y regalos personalizados).

Medidas exactas: ${CAROUSEL_IMAGE_SIZE.width} x ${CAROUSEL_IMAGE_SIZE.height} píxeles (una franja horizontal, proporción 4:1).

Cómo tiene que ser:
- La misma imagen se ve en el celular y en la computadora. En la compu se ve casi entera; en el celular se recortan los COSTADOS. Por eso TODO lo importante (título, frase, producto, logo) tiene que estar CENTRADO, dentro del 45% central del ancho (entre los píxeles 440 y 1160).
- Los costados y las ESQUINAS tienen que quedar libres: nada de letras, logos ni imágenes ahí. Solo fondo, color o una decoración suave que se pueda cortar sin problema.
- Dejá al menos 30 px libres arriba y abajo: ningún texto pegado al borde.
- Un título corto y bien grande (2 a 5 palabras) y, como mucho, una frase breve. En el celular la imagen se ve chica: nada de letra chica.
- Estilo de la tienda: rosa pastel, femenino, limpio y moderno. Buen contraste entre el texto y el fondo para que se lea.
- Sin marcos ni bordes blancos: la imagen ocupa todo el lienzo.

Tema del banner: ${CAROUSEL_TOPIC}`;

export const CAROUSEL_FIX_PROMPT = `Te adjunto un banner que ya tengo para el carrusel de mi tienda online. Necesito que lo adaptes a la medida que pide la página, manteniendo su diseño.

Medidas exactas de la imagen final: ${CAROUSEL_IMAGE_SIZE.width} x ${CAROUSEL_IMAGE_SIZE.height} píxeles (una franja horizontal, proporción 4:1).

Qué tenés que hacer:
- Mantené el diseño: los mismos textos (sin cambiar ni una palabra), colores, estilo y fotos de productos. No inventes nada nuevo.
- Si mi imagen no tiene la forma 4:1, NO la estires ni la deformes. Ampliá o recortá el fondo hasta llegar a la medida, continuando el mismo fondo.
- La misma imagen se ve en el celular y en la computadora, y en el celular se recortan los COSTADOS. Por eso TODO lo importante (título, frase, producto, logo) tiene que quedar CENTRADO, dentro del 45% central del ancho (entre los píxeles 440 y 1160).
- Los costados y las ESQUINAS tienen que quedar libres: sin letras, logos ni imágenes ahí. Solo fondo o decoración suave.
- Dejá al menos 30 px libres arriba y abajo. El título tiene que verse grande y legible.
- Sin marcos ni bordes blancos: la imagen ocupa todo el lienzo.

Devolveme solamente la imagen final.

Tema del banner (para que sepas de qué es): ${CAROUSEL_TOPIC}`;
