// flecha.ts
// Geometría y posicionamiento de las flechas de dirección de los parámetros
// (sección 6.8). Las flechas se dibujan como paths SVG, NO como texto, para
// evitar problemas de fuentes al exportar a PDF. Acá están las funciones PURAS
// que comparten el layout (para reservar el ancho) y el render (para dibujar).

import type { ItemHexagono, Parametro } from '../types';
import type { Medida } from './medirTexto';

// Dimensiones de una flecha en función del tamaño de fuente.
export interface GeometriaFlecha {
  a: number;   // semiancho de la punta
  h2: number;  // semialto total (asta + punta)
}

export function geometriaFlecha(tamanoFuente: number): GeometriaFlecha {
  // 25 % más chicas que la versión original (0.4 / 0.5 -> * 0.75).
  return { a: tamanoFuente * 0.3, h2: tamanoFuente * 0.375 };
}

// Ancho horizontal que ocupa una flecha (para centrar la fila de items).
export function flechaAncho(tamanoFuente: number): number {
  return geometriaFlecha(tamanoFuente).a * 2;
}

// Posiciona los parámetros/argumentos de la mitad de abajo de un hexágono,
// centrados en `ancho`. Cada item es "nombre + separación + flecha"; entre
// items va ", ". Devuelve el centro del texto y el de la flecha de cada uno.
export function layoutItemsHexagono(
  parametros: Parametro[],
  ancho: number,
  tamanoFuente: number,
  fuente: string,
  medida: Medida,
): ItemHexagono[] {
  if (parametros.length === 0) return [];

  const gap = 3;
  const anchoFlecha = flechaAncho(tamanoFuente);
  const sep = medida(', ', fuente);

  // Medimos cada nombre una vez.
  const anchos = parametros.map((p) => ({
    nombre: p.nombre,
    direccion: p.direccion,
    ancho: medida(p.nombre, fuente),
  }));

  // Ancho total de la fila.
  let total = 0;
  for (let i = 0; i < anchos.length; i++) {
    if (i > 0) total += sep;
    total += anchos[i].ancho + gap + anchoFlecha;
  }

  let cursor = (ancho - total) / 2;
  const items: ItemHexagono[] = [];
  for (let i = 0; i < anchos.length; i++) {
    if (i > 0) cursor += sep;
    const { nombre, direccion, ancho: anchoNombre } = anchos[i];
    items.push({
      nombre,
      direccion,
      centroNombre: cursor + anchoNombre / 2,
      centroFlecha: cursor + anchoNombre + gap + anchoFlecha / 2,
    });
    cursor += anchoNombre + gap + anchoFlecha;
  }

  return items;
}
