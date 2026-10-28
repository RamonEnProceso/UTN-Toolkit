// clasificarLinea.ts
// Etapa 1 — Parser (parte 1).
//
// Responsabilidad: dada UNA línea cruda de pseudocódigo, decir qué es.
// Es una función PURA: recibe un string y devuelve datos. No importa React,
// no toca el DOM, no usa el nivel de anidamiento global (eso lo decide parsear).
//
// Cómo se lee el resultado: `tipo` es la categoría sintáctica de la línea
// (entrada, salida, si, etc.). Los campos extra (`condicion`, `variable`,
// `llamada`) ya vienen "cortados" para que parsear no tenga que rehacer el
// análisis del texto.

import type { Direccion, Parametro } from '../types';

// ---- Tipos que produce esta etapa ----

export type TipoLinea =
  | 'funcion'    // "nombre(...)" -> definición de función (nivel 0) o llamada (nivel > 0)
  | 'entrada'    // Leer / Ingresar / Abrir
  | 'salida'     // Imprimir / Mostrar / Escribir
  | 'si'
  | 'sino'
  | 'switch'     // "Cuando X sea"
  | 'mientras'
  | 'para'
  | 'accion';    // cualquier otra cosa

// La "forma de llamada": cuando el texto tiene pinta de "nombre(...)" o de
// "var <- nombre(...)". Se usa en dos momentos: acá (para detectar firmas) y en
// la segunda pasada de parsear (para resolver qué es realmente una llamada).
export interface FormaLlamada {
  nombre: string;
  parametros: Parametro[];      // en una firma son params; en una llamada son args
  asignaA: string | null;       // "suma" en "suma <- f(...)"; null si no hay "<-"
  parentesisCerrado: boolean;   // false si abrió "(" y nunca cerró
}

export interface LineaClasificada {
  indent: number;                // ancho de la sangría (el tabulador cuenta como 1)
  esTab: boolean;                // true si la sangría usa tabulador
  texto: string;                 // contenido sin el "- " y sin la sangría
  tipo: TipoLinea;
  condicion: string | null;      // si / mientras / para
  variable: string | null;       // switch
  llamada: FormaLlamada | null;  // si el texto tiene forma de firma/llamada
}

// ---- Helpers puros (no se exportan: son detalles internos) ----

// Normaliza una palabra para comparar palabras clave: minúsculas y sin tildes.
// Así "Sí", "si" y "SI" se reconocen igual (sección 4.1).
//
// Cómo funciona: normalize("NFD") separa "é" en "e" + una tilde flotante
// (una "marca de combinación", código 0x0300 a 0x036f). Después filtramos esas
// marcas para quedarnos solo con la letra base.
function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .split('')
    .filter((ch) => {
      const codigo = ch.codePointAt(0) ?? 0;
      return codigo < 0x0300 || codigo > 0x036f;
    })
    .join('');
}

// Traduce la marca de dirección ("v", "^", "v^") al tipo `Direccion`.
function direccionDe(marca: string): Direccion {
  if (marca === '^') return 'salida';
  if (marca === 'v^' || marca === '^v') return 'ambas';
  return 'entrada';
}

// Parsea UN parámetro: "texto v" -> { nombre: "texto", direccion: "entrada" }.
// Si no trae marca de dirección, asumimos "entrada" (default, sección 13).
function parsearParametro(crudo: string): Parametro {
  const limpio = crudo.trim();
  // La marca va al final. Buscamos "v^" antes que "^" y "v" porque los contiene.
  const m = limpio.match(/^(.+?)\s+(v\^|\^v|\^|v)$/);
  if (m) {
    return { nombre: m[1].trim(), direccion: direccionDe(m[2]) };
  }
  return { nombre: limpio, direccion: 'entrada' };
}

// Parsea la lista entre paréntesis: "num1 v, suma ^" -> Parametro[].
function parsearParametros(crudo: string): Parametro[] {
  const limpio = crudo.trim();
  if (limpio === '') return [];
  return limpio
    .split(',')
    .map((p) => parsearParametro(p))
    .filter((p) => p.nombre !== '');
}

// Detecta si un texto tiene forma de firma/llamada y extrae sus partes.
// Devuelve null si no tiene esa forma. Se exporta porque parsear la reutiliza
// en la segunda pasada.
export function extraerLlamada(texto: string): FormaLlamada | null {
  // Caso 1: "var <- nombre(args)" (asignación a una variable o campo de registro).
  // Tolera "<-" y "←", identificadores con puntos (ej. "registro.variable") y ";" opcional.
  const conAsignacion = texto.match(
    /^([A-Za-z_][A-Za-z0-9_.]*)\s*(?:<-|←)\s*([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*;?$/,
  );
  if (conAsignacion) {
    return {
      nombre: conAsignacion[2],
      asignaA: conAsignacion[1],
      parametros: parsearParametros(conAsignacion[3]),
      parentesisCerrado: true,
    };
  }

  // Caso 2: "nombre(args)" con ":" o ";" final opcional, como "main():" o "funcion();".
  const simple = texto.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*[:;]?$/);
  if (simple) {
    return {
      nombre: simple[1],
      asignaA: null,
      parametros: parsearParametros(simple[2]),
      parentesisCerrado: true,
    };
  }

  // Caso 3: empezó como firma pero nunca cerró el paréntesis -> "nombre(...".
  const sinCerrar = texto.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)$/);
  if (sinCerrar) {
    return {
      nombre: sinCerrar[1],
      asignaA: null,
      parametros: [],
      parentesisCerrado: false,
    };
  }

  return null;
}

// ---- La clasificación en sí ----

export function clasificarLinea(crudo: string): LineaClasificada {
  // 1. Sangría: todo el espacio en blanco inicial (espacios o tabs).
  const mIndent = crudo.match(/^([ \t]*)/);
  const indentStr = mIndent ? mIndent[1] : '';
  const indent = indentStr.length;
  const esTab = indentStr.includes('\t');

  // 2. Quitamos la sangría y el "- " inicial. Toleramos que falte el espacio
  //    ("-Si x = 0") y que falte el guion directamente ("Leer x") (sección 4.1).
  let resto = crudo.slice(indentStr.length);
  resto = resto.replace(/^-\s*/, '').replace(/<-/g, '←').replace(/->/g, '→').replace(/!=/g, '≠').replace(/>=/g, '≥').replace(/<=/g, '≤').trim();
  const texto = resto;

  const base: LineaClasificada = {
    indent,
    esTab,
    texto,
    tipo: 'accion',
    condicion: null,
    variable: null,
    llamada: null,
  };

  // 3. Miramos la primera palabra para decidir el tipo, sin importar
  //    mayúsculas ni tildes. Primero la palabra clave (sección 4.2), después
  //    la forma de firma/llamada.
  const primera = normalizar((texto.match(/^\S+/) ?? [''])[0]);

  if (primera === 'leer' || primera === 'ingresar' || primera === 'abrir') {
    return { ...base, tipo: 'entrada' };
  }
  if (primera === 'imprimir' || primera === 'mostrar' || primera === 'escribir') {
    return { ...base, tipo: 'salida' };
  }
  if (primera === 'si') {
    return { ...base, tipo: 'si', condicion: texto.replace(/^Si\s*/i, '') };
  }
  if (primera === 'sino') {
    return { ...base, tipo: 'sino' };
  }
  if (primera === 'mientras') {
    // "Mientras" se mantiene en el rectangulo del bucle: no debe eliminarse
    // al escribir (pedido explicito del usuario).
    return { ...base, tipo: 'mientras', condicion: texto };
  }
  if (primera === 'para') {
    return { ...base, tipo: 'para', condicion: texto };
  }
  if (primera === 'cuando') {
    // "Cuando X sea": la variable es lo que está entre "Cuando" y "sea".
    const mVar = texto.match(/^Cuando\s+(.+?)\s+sea\b/i);
    const variable = mVar ? mVar[1] : texto.replace(/^Cuando\s*/i, '');
    return { ...base, tipo: 'switch', variable };
  }

  // 4. Si no es palabra clave, vemos si tiene forma de firma/llamada.
  const llamada = extraerLlamada(texto);
  if (llamada && llamada.asignaA === null) {
    // "nombre(...)" sin asignación: en nivel 0 es una función; en nivel > 0
    // parsear decidirá (en la segunda pasada) si es llamada o acción.
    return { ...base, tipo: 'funcion', llamada };
  }

  // "var <- nombre(...)" u otra cosa: queda como acción. La segunda pasada de
  // parsear la convierte en llamada si el nombre está definido como función.
  return { ...base, tipo: 'accion', llamada };
}
