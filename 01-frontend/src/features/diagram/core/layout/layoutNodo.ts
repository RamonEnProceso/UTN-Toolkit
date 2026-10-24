// layoutNodo.ts
// Etapa 2 — Layout (parte 2): posicionar UN nodo.
//
// Responsabilidad: dado un nodo del AST y una caja (x, y, ancho), calcular su
// posición final (NodoLayout). Es una función PURA: no importa React, no toca
// el DOM. La medición del texto llega inyectada por `medida`.
//
// Regla de anchos (sección 7.4):
//   - un nodo hoja ocupa todo el ancho que le da su padre;
//   - un contenedor (Si, Switch, Mientras, Para) deja un margen
//     `separacionAnidado` a cada lado y reparte el resto entre sus hijos.

import type { Config } from '../config';
import type {
  Columna,
  Nodo,
  NodoAccion,
  NodoEntrada,
  NodoLlamada,
  NodoLayout,
  NodoMientras,
  NodoPara,
  NodoSalida,
  NodoSi,
  NodoSwitch,
} from '../types';
import { ALTURA_LINEA, fuenteDe, medirTexto } from './medirTexto';
import type { Medida } from './medirTexto';
import { layoutBloques } from './layoutBloques';
import { layoutItemsHexagono } from './flecha';

// Punto de entrada: despacha según el tipo de nodo.
export function layoutNodo(
  nodo: Nodo,
  x: number,
  y: number,
  ancho: number,
  config: Config,
  medida: Medida,
): NodoLayout {
  const fuente = fuenteDe(config);

  switch (nodo.tipo) {
    case 'accion':
    case 'entrada':
    case 'salida':
      return hoja(nodo, x, y, ancho, config, fuente, medida);

    case 'llamada':
      return llamada(nodo, x, y, ancho, config, fuente, medida);

    case 'mientras':
    case 'para':
      return bucle(nodo, x, y, ancho, config, fuente, medida);

    case 'si':
      return condicionalSi(nodo, x, y, ancho, config, fuente, medida);

    case 'switch':
      return condicionalSwitch(nodo, x, y, ancho, config, fuente, medida);
  }
}

// --- Nodos hoja: acción, entrada y salida (una sola forma con texto) ---
// El alto sale de cuántos renglones ocupa el texto + el padding (sección 6.2).
function hoja(
  nodo: NodoAccion | NodoEntrada | NodoSalida,
  x: number,
  y: number,
  ancho: number,
  config: Config,
  fuente: string,
  medida: Medida,
): NodoLayout {
  const padding = config.paddingForma;
  const medido = medirTexto(nodo.texto, ancho - 2 * padding, fuente, medida);
  return {
    nodo,
    caja: { x, y, ancho, alto: medido.alto + 2 * padding },
    renglones: medido.renglones,
    hijos: [],
    conectores: [],
  };
}

// --- Llamada (hexágono) ---
// El hexágono siempre tiene dos mitades (sección 6.8): arriba el nombre (o
// "var <- nombre") y abajo los argumentos, cada uno con su flecha de dirección.
// Si no hay argumentos, la mitad de abajo queda vacía pero conserva su altura.
function llamada(
  nodo: NodoLlamada,
  x: number,
  y: number,
  ancho: number,
  config: Config,
  fuente: string,
  medida: Medida,
): NodoLayout {
  const padding = config.paddingForma;
  const arriba = nodo.asignaA ? `${nodo.asignaA} <- ${nodo.nombre}` : nodo.nombre;
  const items = layoutItemsHexagono(nodo.argumentos, ancho, config.tamanoFuente, fuente, medida);
  const altoLinea = config.tamanoFuente * ALTURA_LINEA;
  return {
    nodo,
    caja: { x, y, ancho, alto: 2 * altoLinea + 2 * padding },
    renglones: [arriba],
    hexagono: { arriba, items },
    hijos: [],
    conectores: [],
  };
}

// --- Franja superior de un contenedor ---
// Todo contenedor tiene una franja arriba con su texto (la condición o la
// variable). Devuelve su alto y sus renglones ya partidos.
function franja(
  texto: string,
  ancho: number,
  config: Config,
  fuente: string,
  medida: Medida,
): { alto: number; renglones: string[] } {
  const padding = config.paddingForma;
  const medido = medirTexto(texto, ancho - 2 * padding, fuente, medida);
  return { alto: medido.alto + 2 * padding, renglones: medido.renglones };
}

// --- Contenedor de cuerpo simple: Mientras y Para ---
// Estructura (sección 6.7): franja con la condición arriba y, debajo, el
// cuerpo apilado con margen `separacionAnidado` a los lados.
function bucle(
  nodo: NodoMientras | NodoPara,
  x: number,
  y: number,
  ancho: number,
  config: Config,
  fuente: string,
  medida: Medida,
): NodoLayout {
  const sep = config.separacionAnidado;
  const f = franja(nodo.condicion, ancho, config, fuente, medida);

  const cuerpoX = x + sep;
  const cuerpoY = y + f.alto + sep;
  const cuerpoAncho = ancho - 2 * sep;
  const bloques = layoutBloques(nodo.cuerpo, cuerpoX, cuerpoY, cuerpoAncho, sep, config, medida);

  return {
    nodo,
    caja: { x, y, ancho, alto: f.alto + sep + bloques.alto + sep },
    renglones: f.renglones,
    hijos: bloques.items,
    conectores: bloques.conectores,
  };
}

// --- Contenedor con columnas: Si ---
// Estructura (sección 6.5): franja con la condición y, debajo, dos columnas
// separadas por una línea vertical. Con "Sino": 50/50. Sin "Sino": la columna
// derecha queda al 10% (vacía) para conservar la forma de "Y".
function condicionalSi(
  nodo: NodoSi,
  x: number,
  y: number,
  ancho: number,
  config: Config,
  fuente: string,
  medida: Medida,
): NodoLayout {
  const sep = config.separacionAnidado;
  const f = franja(nodo.texto, ancho, config, fuente, medida);

  const areaX = x + sep;
  const areaY = y + f.alto + sep;
  const areaAncho = ancho - 2 * sep;

  const tieneSino = nodo.sino !== null;
  const anchoIzq = tieneSino ? areaAncho / 2 : areaAncho * 0.9;
  const anchoDer = areaAncho - anchoIzq;

  const colIzq = columna('SI', nodo.entonces, areaX, areaY, anchoIzq, config, fuente, medida);
  const colDer = columna('NO', nodo.sino ?? [], areaX + anchoIzq, areaY, anchoDer, config, fuente, medida);

  const altoColumnas = Math.max(colIzq.caja.alto, colDer.caja.alto);

  return {
    nodo,
    caja: { x, y, ancho, alto: f.alto + sep + altoColumnas + sep },
    renglones: f.renglones,
    hijos: [],
    columnas: [colIzq, colDer],
    conectores: [],
  };
}

// --- Contenedor con columnas: Switch ---
// Igual que el Si, pero con N columnas de igual ancho (una por caso, sección 6.6).
function condicionalSwitch(
  nodo: NodoSwitch,
  x: number,
  y: number,
  ancho: number,
  config: Config,
  fuente: string,
  medida: Medida,
): NodoLayout {
  const sep = config.separacionAnidado;
  const f = franja(nodo.variable, ancho, config, fuente, medida);

  const areaX = x + sep;
  const areaY = y + f.alto + sep;
  const areaAncho = ancho - 2 * sep;

  const n = nodo.casos.length;
  const anchoCol = areaAncho / n;

  const columnas = nodo.casos.map((caso, i) =>
    columna(caso.etiqueta, caso.cuerpo, areaX + i * anchoCol, areaY, anchoCol, config, fuente, medida),
  );

  const altoColumnas = columnas.reduce((max, c) => Math.max(max, c.caja.alto), 0);

  return {
    nodo,
    caja: { x, y, ancho, alto: f.alto + sep + altoColumnas + sep },
    renglones: f.renglones,
    hijos: [],
    columnas,
    conectores: [],
  };
}

// --- Una columna (SI / SINO / caso) ---
// Tiene su etiqueta arriba y, debajo, sus hijos apilados con margen a los lados.
function columna(
  etiqueta: string,
  cuerpo: Nodo[],
  x: number,
  y: number,
  ancho: number,
  config: Config,
  fuente: string,
  medida: Medida,
): Columna {
  const sep = config.separacionAnidado;
  const etq = franja(etiqueta, ancho, config, fuente, medida);

  const cuerpoX = x + sep;
  const cuerpoY = y + etq.alto + sep;
  const cuerpoAncho = ancho - 2 * sep;
  const bloques = layoutBloques(cuerpo, cuerpoX, cuerpoY, cuerpoAncho, sep, config, medida);

  return {
    etiqueta,
    renglones: etq.renglones,
    caja: { x, y, ancho, alto: etq.alto + sep + bloques.alto + sep },
    hijos: bloques.items,
    conectores: bloques.conectores,
  };
}
