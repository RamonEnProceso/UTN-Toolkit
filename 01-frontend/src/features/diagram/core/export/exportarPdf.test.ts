// exportarPdf.test.ts
// Tests unitarios para el cálculo de dimensiones y ajuste de página A4 en exportarPdf.

import { describe, expect, it } from 'vitest';
import {
  ALTO_UTIL_MM,
  ANCHO_PAGINA_MM,
  ANCHO_UTIL_MM,
  MARGEN_MM,
  calcularAjustePagina,
} from './exportarPdf';

describe('exportarPdf - calcularAjustePagina', () => {
  it('ajusta un diagrama estándar para que entre completo dentro del área útil de la página A4', () => {
    const ajuste = calcularAjustePagina(400, 600, 'main', 0, 1);

    // Debe caber dentro de 190 mm de ancho y 265 mm de alto
    expect(ajuste.anchoDestinoMm).toBeLessThanOrEqual(ANCHO_UTIL_MM);
    expect(ajuste.altoDestinoMm).toBeLessThanOrEqual(ALTO_UTIL_MM);

    // Centrado horizontal dentro de la página
    expect(ajuste.xMm).toBeGreaterThanOrEqual(MARGEN_MM);
    expect(ajuste.xMm + ajuste.anchoDestinoMm).toBeLessThanOrEqual(ANCHO_PAGINA_MM - MARGEN_MM + 0.001);

    // Centrado vertical dentro del área útil
    expect(ajuste.yMm).toBeGreaterThanOrEqual(MARGEN_MM);
    expect(ajuste.yMm + ajuste.altoDestinoMm).toBeLessThanOrEqual(MARGEN_MM + ALTO_UTIL_MM + 0.001);

    // Texto de pie de página
    expect(ajuste.textoPie).toBe('main — pág. 1/1');
  });

  it('ajusta diagramas muy altos (largos algoritmos) para no exceder una sola página A4', () => {
    const ajuste = calcularAjustePagina(400, 1600, 'algoritmoLargo', 1, 3);

    // Debe ocupar a lo sumo el alto útil disponible sin sobrepasarlo
    expect(ajuste.altoDestinoMm).toBeCloseTo(ALTO_UTIL_MM, 2);
    expect(ajuste.anchoDestinoMm).toBeLessThanOrEqual(ANCHO_UTIL_MM);
    expect(ajuste.xMm).toBeGreaterThanOrEqual(MARGEN_MM);
    expect(ajuste.textoPie).toBe('algoritmoLargo — pág. 2/3');
  });

  it('ajusta diagramas muy anchos (ej. switch múltiple) respetando márgenes horizontales', () => {
    const ajuste = calcularAjustePagina(1200, 400, 'switchGrande', 2, 3);

    expect(ajuste.anchoDestinoMm).toBeCloseTo(ANCHO_UTIL_MM, 2);
    expect(ajuste.altoDestinoMm).toBeLessThanOrEqual(ALTO_UTIL_MM);
    expect(ajuste.xMm).toBeCloseTo(MARGEN_MM, 2);
    expect(ajuste.textoPie).toBe('switchGrande — pág. 3/3');
  });

  it('preserva la proporción de aspecto original del diagrama', () => {
    const anchoPx = 500;
    const altoPx = 750;
    const ajuste = calcularAjustePagina(anchoPx, altoPx, 'testProporcion', 0, 2);

    const aspectOriginal = anchoPx / altoPx;
    const aspectCalculado = ajuste.anchoDestinoMm / ajuste.altoDestinoMm;

    expect(aspectCalculado).toBeCloseTo(aspectOriginal, 4);
  });
});
