import { useState } from "react";

// Foto que llena su recuadro SIN franjas (17/11/2026, pedido explicito: "no me
// interesan esos bordes"). Las fotos verticales o casi cuadradas (de 0,45 a 1,05 de
// ancho/alto, incluidas las fotos de celular en formato historia 9:16) llenan todo el recuadro, recortando apenas los bordes -- como la
// grilla de Instagram. Las muy horizontales se muestran enteras: recortarlas
// cortaria el producto. Hasta que carga, se ve entera.
type AdaptiveImageProps = {
  src: string;
  alt: string;
  loading?: "lazy" | "eager";
};

export function AdaptiveImage({ src, alt, loading }: AdaptiveImageProps) {
  const [fit, setFit] = useState<"cover" | "contain">("contain");

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      style={{ objectFit: fit }}
      onLoad={(event) => {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        const ratio = naturalHeight > 0 ? naturalWidth / naturalHeight : 1;
        setFit(ratio >= 0.45 && ratio <= 1.05 ? "cover" : "contain");
      }}
    />
  );
}
