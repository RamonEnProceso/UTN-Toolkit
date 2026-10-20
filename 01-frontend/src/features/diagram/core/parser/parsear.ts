// parsear.ts
// Etapa 1 — Parser (parte 2, la principal).
//
// Responsabilidad: armar el árbol completo (Programa) a partir de un texto.
// Recibe el string del textarea y devuelve { funciones, errores }. Es una
// función PURA: no importa React, no toca el DOM y NUNCA lanza excepciones;
// todo problema se devuelve dentro de `errores` (regla 0.3 y Etapa 1).
//
// El trabajo se divide en tres pasos:
//   1) `leerLineas`     -> clasifica cada renglón y le asigna un nivel (0 = raíz).
//   2) `parsear`        -> agrupa los niveles 0 en funciones y los niveles > 0
//                          en nodos anidados (recursivo).
//   3) `resolverLlamadas` -> segunda pasada: convierte acciones en llamadas
//                          (hexágonos) cuando tienen forma de llamada.
//
// Cómo se detecta la unidad de sangría (sección 4.1): a partir del primer
// renglón indentado. Si usa tab, cada tab = 1 nivel. Si usa espacios, 4 si el
// ancho es múltiplo de 4, 2 si es múltiplo de 2; si no, 4 (default).

import type { CasoSwitch, ErrorParseo, Funcion, Nodo, NodoBase, Programa } from '../types';
import { clasificarLinea, extraerLlamada } from './clasificarLinea';
import type { LineaClasificada } from './clasificarLinea';

// Un renglón ya clasificado + su número de línea y su nivel de anidamiento.
interface LineaProcesada extends LineaClasificada {
  numero: number;  // número de línea del textarea, empieza en 1
  nivel: number;   // 0 = raíz (definiciones de función)
}

// ---------------------------------------------------------------------------
// 1) Leer líneas
// ---------------------------------------------------------------------------

function leerLineas(texto: string): LineaProcesada[] {
  // split normaliza \r\n y \n (también sobrevive a Windows).
  const crudas = texto.split(/\r?\n/);
  const lineas: LineaProcesada[] = [];

  for (let idx = 0; idx < crudas.length; idx++) {
    const c = clasificarLinea(crudas[idx]);
    if (c.texto === '') continue; // línea vacía: se ignora (sección 4.1)
    lineas.push({ ...c, numero: idx + 1, nivel: 0 });
  }

  // Detectar la unidad de sangría a partir de la primera línea indentada.
  let unidad = 4;
  let usaTab = false;
  for (const l of lineas) {
    if (l.indent === 0) continue;
    if (l.esTab) {
      usaTab = true;
      unidad = 1;
    } else if (l.indent % 4 === 0) {
      unidad = 4;
    } else if (l.indent % 2 === 0) {
      unidad = 2;
    } else {
      unidad = 4;
    }
    break;
  }

  // Asignar nivel a cada línea según la unidad detectada.
  for (const l of lineas) {
    l.nivel = usaTab ? l.indent : Math.floor(l.indent / unidad);
  }

  return lineas;
}

// ---------------------------------------------------------------------------
// 2) Armar nodos (recursivo)
// ---------------------------------------------------------------------------

// Crea el "tronco" común a todo nodo: id estable + línea + texto (sección 5).
function baseDe(linea: LineaProcesada): NodoBase {
  return { id: `n${linea.numero}`, linea: linea.numero, texto: linea.texto };
}

// Parsea UNA secuencia de hermanos, todos al mismo `nivel`. Devuelve los nodos
// y el índice del primer renglón que ya no pertenece a esta secuencia.
function parsearSecuencia(
  lineas: LineaProcesada[],
  i: number,
  nivel: number,
  errores: ErrorParseo[],
): { nodos: Nodo[]; siguiente: number } {
  const nodos: Nodo[] = [];

  while (i < lineas.length) {
    const linea = lineas[i];

    if (linea.nivel < nivel) {
      // Volvió a un nivel superior: este bloque terminó.
      break;
    }

    if (linea.nivel > nivel) {
      // Indentación que salta uno o más niveles (Etapa 1).
      errores.push({ linea: linea.numero, mensaje: 'Indentación que salta niveles' });
      // Recuperación: salteamos este renglón y todos los que estén aún más
      // indentados, para no repetir el mismo error por cada renglón huérfano.
      i++;
      while (i < lineas.length && lineas[i].nivel > nivel) i++;
      continue;
    }

    const r = parsearNodo(lineas, i, nivel, errores);
    if (r.nodo) nodos.push(r.nodo);
    i = r.siguiente;
  }

  return { nodos, siguiente: i };
}

// Parsea UN nodo a partir del renglón en `i` (que está en `nivel`).
function parsearNodo(
  lineas: LineaProcesada[],
  i: number,
  nivel: number,
  errores: ErrorParseo[],
): { nodo: Nodo | null; siguiente: number } {
  const linea = lineas[i];
  const base = baseDe(linea);

  switch (linea.tipo) {
    case 'entrada':
      return { nodo: { ...base, tipo: 'entrada' }, siguiente: i + 1 };

    case 'salida':
      return { nodo: { ...base, tipo: 'salida' }, siguiente: i + 1 };

    case 'accion':
    case 'funcion':
      // A nivel > 0 una firma "nombre(...)" o una línea "var <- nombre(...)"
      // todavía no se distingue de una acción: la segunda pasada lo decide.
      return { nodo: { ...base, tipo: 'accion' }, siguiente: i + 1 };

    case 'si': {
      const entoncesR = parsearSecuencia(lineas, i + 1, nivel + 1, errores);
      let siguiente = entoncesR.siguiente;
      let sino: Nodo[] | null = null;

      // Un "Sino" válido está al MISMO nivel que su "Si" (sección 4.3).
      const sig = lineas[siguiente];
      if (sig && sig.nivel === nivel && sig.tipo === 'sino') {
        const sinoR = parsearSecuencia(lineas, siguiente + 1, nivel + 1, errores);
        sino = sinoR.nodos;
        siguiente = sinoR.siguiente;
      }

      return {
        nodo: {
          ...base,
          tipo: 'si',
          condicion: linea.condicion ?? '',
          entonces: entoncesR.nodos,
          sino,
        },
        siguiente,
      };
    }

    case 'switch': {
      // Las etiquetas de caso están un nivel más adentro; su cuerpo, dos
      // niveles más adentro (sección 4.5).
      const casos: CasoSwitch[] = [];
      let j = i + 1;
      while (j < lineas.length && lineas[j].nivel === nivel + 1) {
        const etiqueta = lineas[j].texto;
        const cuerpoR = parsearSecuencia(lineas, j + 1, nivel + 2, errores);
        casos.push({ etiqueta, cuerpo: cuerpoR.nodos });
        j = cuerpoR.siguiente;
      }
      return {
        nodo: { ...base, tipo: 'switch', variable: linea.variable ?? '', casos },
        siguiente: j,
      };
    }

    case 'mientras': {
      const cuerpoR = parsearSecuencia(lineas, i + 1, nivel + 1, errores);
      return {
        nodo: { ...base, tipo: 'mientras', condicion: linea.condicion ?? '', cuerpo: cuerpoR.nodos },
        siguiente: cuerpoR.siguiente,
      };
    }

    case 'para': {
      const cuerpoR = parsearSecuencia(lineas, i + 1, nivel + 1, errores);
      return {
        nodo: { ...base, tipo: 'para', condicion: linea.condicion ?? '', cuerpo: cuerpoR.nodos },
        siguiente: cuerpoR.siguiente,
      };
    }

    case 'sino': {
      // "Sino" sin un "Si" previo (solo lo consume el parser de "Si").
      errores.push({ linea: linea.numero, mensaje: '"Sino" sin un "Si" previo' });
      // Recuperación: salteamos su bloque (los renglones más indentados).
      let j = i + 1;
      while (j < lineas.length && lineas[j].nivel > nivel) j++;
      return { nodo: null, siguiente: j };
    }
  }
}

// Parsea UNA función: el renglón de nivel 0 con forma de firma + su cuerpo.
function parsearFuncion(
  lineas: LineaProcesada[],
  i: number,
  errores: ErrorParseo[],
): { funcion: Funcion; siguiente: number } {
  const linea = lineas[i];
  const llamada = linea.llamada;

  if (llamada && !llamada.parentesisCerrado) {
    errores.push({
      linea: linea.numero,
      mensaje: 'Paréntesis sin cerrar en la firma de la función',
    });
  }

  const nombre = llamada?.nombre ?? linea.texto;
  const parametros = llamada?.parametros ?? [];
  const esMain = nombre.toLowerCase() === 'main';

  // El cuerpo de una función siempre vive en el nivel 1.
  const cuerpoR = parsearSecuencia(lineas, i + 1, 1, errores);

  return {
    funcion: {
      nombre,
      esMain,
      parametros,
      cuerpo: cuerpoR.nodos,
      linea: linea.numero,
    },
    siguiente: cuerpoR.siguiente,
  };
}

// ---------------------------------------------------------------------------
// 3) Segunda pasada: resolver llamadas
// ---------------------------------------------------------------------------

// Convierte un nodo "acción" en "llamada" (hexágono) si su texto tiene forma
// "[var <-] nombre(args)" con los paréntesis cerrados (sección 4.4 y 13.8).
// NO se exige que la función esté definida: alcanza con que se escriba la
// llamada (pedido explícito del usuario). Recorre el árbol recursivamente.
function resolverNodo(nodo: Nodo): Nodo {
  switch (nodo.tipo) {
    case 'accion': {
      const forma = extraerLlamada(nodo.texto);
      if (forma && forma.parentesisCerrado) {
        return {
          tipo: 'llamada',
          id: nodo.id,
          linea: nodo.linea,
          texto: nodo.texto,
          nombre: forma.nombre,
          argumentos: forma.parametros,
          asignaA: forma.asignaA,
        };
      }
      return nodo; // es una acción común (rectángulo)
    }

    case 'si':
      return {
        ...nodo,
        entonces: nodo.entonces.map(resolverNodo),
        sino: nodo.sino ? nodo.sino.map(resolverNodo) : null,
      };

    case 'switch':
      return {
        ...nodo,
        casos: nodo.casos.map((c) => ({
          etiqueta: c.etiqueta,
          cuerpo: c.cuerpo.map(resolverNodo),
        })),
      };

    case 'mientras':
      return { ...nodo, cuerpo: nodo.cuerpo.map(resolverNodo) };

    case 'para':
      return { ...nodo, cuerpo: nodo.cuerpo.map(resolverNodo) };

    default:
      return nodo; // entrada, salida y llamada no tienen hijos
  }
}

// Recalcula `cuerpo` de cada función convirtiendo las llamadas escritas.
function resolverLlamadas(programa: Programa): Programa {
  return {
    funciones: programa.funciones.map((f) => ({
      ...f,
      cuerpo: f.cuerpo.map(resolverNodo),
    })),
    errores: programa.errores,
  };
}

// ---------------------------------------------------------------------------
// Punto de entrada
// ---------------------------------------------------------------------------

export function parsear(texto: string): Programa {
  const lineas = leerLineas(texto);
  const errores: ErrorParseo[] = [];
  const funciones: Funcion[] = [];

  let i = 0;
  while (i < lineas.length) {
    const linea = lineas[i];

    if (linea.nivel !== 0) {
      // Texto indentado que no cuelga de ninguna función (sección 13.11).
      errores.push({ linea: linea.numero, mensaje: 'Línea fuera de función' });
      i++;
      while (i < lineas.length && lineas[i].nivel > 0) i++;
      continue;
    }

    if (linea.tipo === 'funcion') {
      const r = parsearFuncion(lineas, i, errores);
      funciones.push(r.funcion);
      i = r.siguiente;
      continue;
    }

    if (linea.tipo === 'sino') {
      errores.push({ linea: linea.numero, mensaje: '"Sino" sin un "Si" previo' });
      i++;
      while (i < lineas.length && lineas[i].nivel > 0) i++;
      continue;
    }

    // Nivel 0 y no es una firma: texto fuera de función.
    errores.push({ linea: linea.numero, mensaje: 'Línea fuera de función' });
    i++;
  }

  return resolverLlamadas({ funciones, errores });
}
