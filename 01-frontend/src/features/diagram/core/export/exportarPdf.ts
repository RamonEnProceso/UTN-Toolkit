// exportarPdf.ts
// Exportación a PDF: una página por función (pestaña), formato A4 vertical.
// Cada función se ajusta proporcionalmente para entrar completa en una única página (190x265mm),
// centrada y rasterizada a 3x para máxima nitidez de tipografía y formas.

import { svgElementAImagen } from './util';

export interface DiagramaParaExportar {
  nombre: string;           // nombre de la función (pie de página)
  svg: SVGSVGElement;
  ancho?: number;
  alto?: number;
  cortesPosibles?: number[]; // mantenido por compatibilidad
}

export interface DimensionesPaginaPdf {
  xMm: number;
  yMm: number;
  anchoDestinoMm: number;
  altoDestinoMm: number;
  textoPie: string;
}

export const MARGEN_MM = 10;
export const ANCHO_PAGINA_MM = 210;
export const ALTO_PAGINA_MM = 297;
export const ANCHO_UTIL_MM = ANCHO_PAGINA_MM - 2 * MARGEN_MM; // 190 mm
export const ALTO_UTIL_MM = 265; // 297 - 10 (top) - 22 (pie de página y margen inferior)
export const ESCALA_RASTER = 3;

/**
 * Calcula las dimensiones y posición del diagrama para que entre exactamente
 * en una página A4 vertical respetando márgenes y aspecto original.
 */
export function calcularAjustePagina(
  anchoPx: number,
  altoPx: number,
  nombre: string,
  indice: number,
  totalPaginas: number,
): DimensionesPaginaPdf {
  const escalaMm = Math.min(ANCHO_UTIL_MM / anchoPx, ALTO_UTIL_MM / altoPx);
  const anchoDestinoMm = anchoPx * escalaMm;
  const altoDestinoMm = altoPx * escalaMm;

  // Centrado horizontal en la página
  const xMm = (ANCHO_PAGINA_MM - anchoDestinoMm) / 2;
  // Centrado vertical dentro del área útil de la página
  const yMm = MARGEN_MM + (ALTO_UTIL_MM - altoDestinoMm) / 2;

  const textoPie = `${nombre} — pág. ${indice + 1}/${totalPaginas}`;

  return {
    xMm,
    yMm,
    anchoDestinoMm,
    altoDestinoMm,
    textoPie,
  };
}

export async function exportarPdf(
  diagramas: DiagramaParaExportar[],
  nombreArchivo: string = 'diagrama',
): Promise<void> {
  if (diagramas.length === 0) return;

  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const totalPaginas = diagramas.length;

  for (let i = 0; i < totalPaginas; i++) {
    const d = diagramas[i];
    if (i > 0) pdf.addPage();

    const anchoPx = d.ancho ?? (d.svg.viewBox?.baseVal?.width || Number(d.svg.getAttribute('width')) || 400);
    const altoPx = d.alto ?? (d.svg.viewBox?.baseVal?.height || Number(d.svg.getAttribute('height')) || 400);

    const ajuste = calcularAjustePagina(anchoPx, altoPx, d.nombre, i, totalPaginas);

    const { imagen, liberar } = await svgElementAImagen(d.svg, anchoPx, altoPx);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(anchoPx * ESCALA_RASTER);
      canvas.height = Math.round(altoPx * ESCALA_RASTER);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo crear el contexto 2D del canvas.');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        ajuste.xMm,
        ajuste.yMm,
        ajuste.anchoDestinoMm,
        ajuste.altoDestinoMm,
      );

      pdf.setFontSize(10);
      pdf.setTextColor(90, 90, 90);
      pdf.text(ajuste.textoPie, ANCHO_PAGINA_MM / 2, ALTO_PAGINA_MM - 8, { align: 'center' });
    } finally {
      liberar();
    }
  }

  pdf.save(`${nombreArchivo}.pdf`);
}
