// util.ts
// Helpers compartidos del export (Etapas 7-8): cargar un SVG como <img> y
// descargar un Blob. La regla de recursos (sección 12) pide liberar todas las
// object URLs, así que `svgElementAImagen` devuelve una función `liberar`.

import { serializarSvg } from './serializarSvg';

export interface ImagenSvg {
  imagen: HTMLImageElement;
  liberar: () => void; // revoca la object URL del blob
}

// Convierte un <svg> en una <img> ya cargada (con el tamaño de su viewBox o parámetros).
export function svgElementAImagen(svg: SVGSVGElement, ancho?: number, alto?: number): Promise<ImagenSvg> {
  const blob = new Blob([serializarSvg(svg, ancho, alto)], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const imagen = new Image();
  return new Promise((resolve, reject) => {
    imagen.onload = () => resolve({ imagen, liberar: () => URL.revokeObjectURL(url) });
    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar el SVG como imagen.'));
    };
    imagen.src = url;
  });
}

// Dispara la descarga de un Blob con el nombre dado y libera su object URL.
export function descargarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
