// Prompts para que la clienta genere las imagenes con su IA (17/11/2026).
// Productos: vertical, formato Instagram 4 a 5. La tarjeta del catalogo es 4:5 y
// puede recortar apenas los bordes, por eso se pide nada importante pegado al borde.
export const PRODUCT_IMAGE_SIZE = { width: 1080, height: 1350 } as const;

export const PRODUCT_AI_PROMPT = `Necesito una foto de producto para el catálogo de la tienda online Armii Creaciones Alexa (accesorios y regalos personalizados).

Medidas exactas: ${PRODUCT_IMAGE_SIZE.width} x ${PRODUCT_IMAGE_SIZE.height} píxeles (vertical, formato Instagram, proporción 4:5).

Cómo tiene que ser:
- El producto bien GRANDE y CENTRADO, ocupando casi todo el cuadro, con un margen parejo de unos 90 px por cada lado. Que no quede chiquito en el medio.
- Fondo liso y claro (blanco, crema o rosa muy suave), sin objetos que distraigan.
- Nada importante pegado a los bordes ni a las esquinas: la tarjeta puede recortar apenas los costados y los bordes de la imagen.
- Todo el producto tiene que verse completo, sin cortarse.
- Luz natural y pareja, sin sombras fuertes. Foto nítida y bien enfocada.
- Sin texto, sin marcos, sin bordes de color y sin marcas de agua.

Producto: [ESCRIBÍ ACÁ QUÉ ES: ej. "chupetero con letras y aplique de zebra", "pulsera tejida", "collar para mascotas"]`;
