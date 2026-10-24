// exportarPng.ts
// Etapa 7 — exportar el diagrama a PNG (sección 11.1). Renderiza el SVG a un
// <canvas> a 2x sobre fondo blanco y baja un archivo "<nombre>.png".

import { descargarBlob, svgElementAImagen } from './util';

const ESCALA = 2; // 2x para que el PNG salga nítido

export async function exportarPng(
  svg: SVGSVGElement,
  nombreArchivo: string,
  ancho?: number,
  alto?: number,
): Promise<void> {
  const anchoPx = ancho ?? (svg.viewBox?.baseVal?.width || Number(svg.getAttribute('width')) || 400);
  const altoPx = alto ?? (svg.viewBox?.baseVal?.height || Number(svg.getAttribute('height')) || 400);

  const { imagen, liberar } = await svgElementAImagen(svg, anchoPx, altoPx);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(anchoPx * ESCALA);
    canvas.height = Math.round(altoPx * ESCALA);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo crear el contexto 2D del canvas.');

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(ESCALA, ESCALA);
    ctx.drawImage(imagen, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar el PNG.'))), 'image/png');
    });
    descargarBlob(blob, `${nombreArchivo}.png`);
  } finally {
    liberar();
  }
}
