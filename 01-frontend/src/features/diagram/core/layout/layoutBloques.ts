// layoutBloques.ts
// Etapa 2 — Layout (parte 3): apilar bloques + armar el diagrama completo.
//
// `layoutBloques` es el algoritmo central (sección 7.3): apila una lista de
// hermanos verticalmente, dejando un conector entre cada par. Usa un "cursor"
// que baja a medida que coloca cada bloque.
//
// `layoutDiagrama` es la entrada de alto nivel: toma una función y devuelve el
// DiagramaLayout completo (sección 6.10), con el elemento superior (círculo I
// en main, hexágono de firma en las demás), los bloques del cuerpo y el
// círculo final F.

import type { Config } from '../config';
import type { Conector, DiagramaLayout, Funcion, Nodo, NodoLayout } from '../types';
import { ALTURA_LINEA, fuenteDe } from './medirTexto';
import type { Medida } from './medirTexto';
import { layoutNodo } from './layoutNodo';
import { layoutItemsHexagono } from './flecha';

// Resultado de apilar una lista de hermanos.
export interface Bloques {
  items: NodoLayout[];
  conectores: Conector[]; // un conector entre cada par consecutivo
  alto: number;           // alto total ocupado (incluye los conectores internos)
}

// Apila `nodos` verticalmente empezando en (x, y). Cada hermano ocupa todo el
// `ancho`. Entre dos hermanos consecutivos deja un espacio `separacion` y un
// conector vertical centrado (sección 7.3).
export function layoutBloques(
  nodos: Nodo[],
  x: number,
  y: number,
  ancho: number,
  separacion: number,
  config: Config,
  medida: Medida,
): Bloques {
  let cursorY = y;
  const items: NodoLayout[] = [];
  const conectores: Conector[] = [];

  for (let i = 0; i < nodos.length; i++) {
    if (i > 0) {
      // Conector entre el bloque anterior y el que viene.
      conectores.push({ x: x + ancho / 2, y1: cursorY, y2: cursorY + separacion });
      cursorY += separacion;
    }

    const item = layoutNodo(nodos[i], x, cursorY, ancho, config, medida);
    items.push(item);
    cursorY += item.caja.alto;
  }

  return { items, conectores, alto: cursorY - y };
}

// Arma el diagrama completo de una función (sección 6.10):
//   (I o hexágono de firma)  ->  [bloques del cuerpo]  ->  (F)
//
// `conectores` guarda TODAS las líneas del nivel principal (incluidas las que
// van hacia el elemento superior y hacia F). `cortesPosibles` guarda la
// coordenada Y del medio de cada conector (sección 7.5): son los lugares
// seguros para cortar de una página a otra en el PDF.
export function layoutDiagrama(
  funcion: Funcion,
  config: Config,
  medida: Medida,
): DiagramaLayout {
  const ancho = config.anchoDiagrama;
  const margen = config.margenDiagrama;
  const contenidoAncho = ancho - 2 * margen;
  const sep = config.separacionBloques;
  const centroX = ancho / 2;
  const conectores: Conector[] = [];
  let cursorY = margen; // margen superior: el contenido no pega al borde

  // 1. Elemento superior: círculo I (main) o hexágono con la firma.
  const altoLinea = config.tamanoFuente * ALTURA_LINEA;
  const altoTop = funcion.esMain
    ? config.diametroCirculo
    : 2 * altoLinea + 2 * config.paddingForma;
  cursorY += altoTop;

  // Contenido del hexágono de firma (funciones no main): nombre arriba y
  // parámetros con flecha abajo (sección 6.8). `main` no lleva hexágono.
  const firma = funcion.esMain
    ? undefined
    : {
        arriba: funcion.nombre,
        items: layoutItemsHexagono(funcion.parametros, contenidoAncho, config.tamanoFuente, fuenteDe(config), medida),
      };

  if (funcion.cuerpo.length > 0) {
    // 2. Conector del elemento superior al primer bloque.
    conectores.push({ x: centroX, y1: cursorY, y2: cursorY + sep });
    cursorY += sep;

    // 3. Bloques del nivel principal.
    const bloques = layoutBloques(funcion.cuerpo, margen, cursorY, contenidoAncho, sep, config, medida);
    conectores.push(...bloques.conectores);
    cursorY += bloques.alto;

    // 4. Conector del último bloque al círculo final F.
    conectores.push({ x: centroX, y1: cursorY, y2: cursorY + sep });
    cursorY += sep;

    cursorY += config.diametroCirculo;
    cursorY += margen; // margen inferior

    return {
      funcion,
      firma,
      ancho,
      alto: cursorY,
      raiz: bloques.items,
      conectores,
      cortesPosibles: conectores.map((c) => (c.y1 + c.y2) / 2),
    };
  }

  // Cuerpo vacío: un solo conector une el elemento superior con F.
  conectores.push({ x: centroX, y1: cursorY, y2: cursorY + sep });
  cursorY += sep + config.diametroCirculo;
  cursorY += margen; // margen inferior

  return {
    funcion,
    firma,
    ancho,
    alto: cursorY,
    raiz: [],
    conectores,
    cortesPosibles: conectores.map((c) => (c.y1 + c.y2) / 2),
  };
}
