// exportarPdf.ts
// Etapa 8 — exportar a PDF (sección 11.2). Una función por página, A4 vertical,
// 10mm de margen, ancho ajustado a 190mm y corte de páginas en los conectores
// (paginarA4). Plan B elegido (sección 11.2): rasterizar cada página a PNG de
// 3x y agregarla con addImage, para que el texto (tildes, ñ, monospace) salga
// idéntico a la pantalla y evitar los límites de svg2pdf.js.

import { paginarA4 } from './paginarA4';
import { svgElementAImagen } from './util';

export interface DiagramaParaExportar {
  nombre: string;           // nombre de la función (pie de página)
  svg: SVGSVGElement;
  cortesPosibles: number[]; // coordenadas Y seguras para cortar página
}

const MARGEN_MM = 10;
const ANCHO_UTIL_MM = 190; // 210 - 2*10
const ALTO_UTIL_MM = 277;  // 297 - 2*10
const ESCALA_RASTER = 3;

export async function exportarPdf(diagramas: DiagramaParaExportar[]): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let primeraPagina = true;

  for (const d of diagramas) {
    const anchoPx = d.svg.viewBox.baseVal.width;
    const altoPx = d.svg.viewBox.baseVal.height;
    const mmPorPx = ANCHO_UTIL_MM / anchoPx;
    const altoPaginaPx = ALTO_UTIL_MM / mmPorPx;
    const tramos = paginarA4(altoPx, d.cortesPosibles, altoPaginaPx);

    const { imagen, liberar } = await svgElementAImagen(d.svg);
    try {
      for (let i = 0; i < tramos.length; i++) {
        if (!primeraPagina) pdf.addPage();
        primeraPagina = false;

        const t = tramos[i];
        const altoTramoPx = t.yFin - t.yInicio;

        const canvas = document.createElement('canvas');
        canvas.width = anchoPx * ESCALA_RASTER;
        canvas.height = altoTramoPx * ESCALA_RASTER;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No se pudo crear el contexto 2D del canvas.');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          imagen,
          0, t.yInicio, anchoPx, altoTramoPx,
          0, 0, canvas.width, canvas.height,
        );

        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', MARGEN_MM, MARGEN_MM, ANCHO_UTIL_MM, altoTramoPx * mmPorPx);

        pdf.setFontSize(10);
        pdf.text(`${d.nombre} — pág. ${i + 1}/${tramos.length}`, 210 / 2, 297 - MARGEN_MM / 2, { align: 'center' });
      }
    } finally {
      liberar();
    }
  }

  pdf.save('diagrama.pdf');
}
