// texto.ts
// Constantes y helpers compartidos por todas las formas SVG (Etapa 3).
//
// Los estilos van como ATRIBUTOS de SVG (stroke, fill, font-family), nunca como
// clases CSS: al exportar a PNG/PDF se rasteriza el SVG y las clases CSS del
// documento se pierden (sección 12). Por eso todo el estilo está inline acá.

import { ALTURA_LINEA } from '../core';

export const FUENTE = 'monospace';
export const TRAZO = '#1a1a1a';
export const RELLENO = '#ffffff';
export const GROSOR = 1.5;

// Alto de una línea de texto en px, para un tamaño de fuente dado.
export function altoLinea(tamanoFuente: number): number {
  return tamanoFuente * ALTURA_LINEA;
}

// Alto de la franja superior de un contenedor (su texto + padding a los lados).
export function franjaAlto(cantidadRenglones: number, tamanoFuente: number, padding: number): number {
  return cantidadRenglones * altoLinea(tamanoFuente) + 2 * padding;
}
