// plantillas.ts
// Plantillas de texto del panel de formas (sección 10) y la función pura de
// inserción. Se completan en la Etapa 6.

// Tipo de cada forma que puede insertar el panel (para dibujar la mini-forma).
export type TipoForma =
  | 'entrada'
  | 'salida'
  | 'accion'
  | 'si'
  | 'switch'
  | 'mientras'
  | 'para'
  | 'funcion';

export interface Plantilla {
  nombre: string;        // etiqueta del botón (ej. "Entrada")
  forma: TipoForma;      // qué mini-forma dibuja el botón
  texto: string;         // texto que inserta, con sangrías relativas (4 espacios por nivel)
  placeholder: string;   // fragmento que queda seleccionado para escribir encima
  funcion?: boolean;     // true solo en "Función": se inserta al final, nivel 0
}

// La sangría relativa dentro de `texto` va con 4 espacios por nivel. El
// placeholder va marcado como [[placeholder]] para poder ubicarlo sin chocar
// con palabras que repitan el mismo texto (p. ej. la "n" de "Para").
export const plantillas: Plantilla[] = [
  { nombre: 'Entrada', forma: 'entrada', texto: '- Leer [[variable]]', placeholder: 'variable' },
  { nombre: 'Salida', forma: 'salida', texto: '- Imprimir [[variable]]', placeholder: 'variable' },
  { nombre: 'Acción', forma: 'accion', texto: '- [[accion]]', placeholder: 'accion' },
  { nombre: 'Condicional', forma: 'si', texto: '- Si [[condicion]]\n    - accion\n- Sino\n    - accion', placeholder: 'condicion' },
  { nombre: 'Switch', forma: 'switch', texto: '- Cuando [[variable]] sea\n    - 1\n        - accion\n    - 2\n        - accion', placeholder: 'variable' },
  { nombre: 'Mientras', forma: 'mientras', texto: '- Mientras [[condicion]]\n    - accion', placeholder: 'condicion' },
  { nombre: 'Para', forma: 'para', texto: '- Para i -> 0 mientras i < [[n]]\n    - accion', placeholder: 'n' },
  { nombre: 'Función', forma: 'funcion', funcion: true, texto: '- [[nombre]](parametro v, resultado ^)\n    - accion', placeholder: 'nombre' },
];

// Resultado de insertar: el texto nuevo y el rango que queda seleccionado.
export interface Insercion {
  texto: string;
  seleccionInicio: number;
  seleccionFin: number;
}

// Detecta la unidad de sangría del texto (la misma regla que el parser,
// sección 4.1): '    ' (4 espacios), '  ' (2 espacios) o '\t'.
export function detectarUnidad(texto: string): string {
  for (const linea of texto.split(/\r?\n/)) {
    const indent = (linea.match(/^[ \t]*/) ?? [''])[0];
    if (indent.length === 0) continue;
    if (indent.includes('\t')) return '\t';
    if (indent.length % 4 === 0) return '    ';
    if (indent.length % 2 === 0) return '  ';
    return '    ';
  }
  return '    ';
}

// Nivel de sangría de una línea según la unidad detectada.
export function nivelDe(linea: string, unidad: string): number {
  const indent = (linea.match(/^[ \t]*/) ?? [''])[0];
  if (unidad === '\t') return (indent.match(/\t/g) ?? []).length;
  if (indent.length === 0) return 0;
  return Math.floor(indent.length / unidad.length);
}

// ¿Una línea abre un bloque? Es decir, lo que le sigue va un nivel más adentro.
export function abreBloque(linea: string): boolean {
  const contenido = linea.trim().replace(/^-\s*/, '').trim();
  if (contenido === '') return false;
  const primera = normalizar(contenido.split(/\s+/)[0] ?? '');
  if (['si', 'sino', 'mientras', 'para', 'cuando'].includes(primera)) return true;
  // definición de función: nombre(...)
  return /^[A-Za-z_][A-Za-z0-9_]*\s*\(/.test(contenido);
}

// Quita tildes y pasa a minúsculas para comparar palabras clave sin importar
// mayúsculas ni acentos ("Sí" y "si" son lo mismo).
function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Re-indenta cada línea relativa de la plantilla (4 espacios por nivel) a su
// nivel absoluto (nivelBase + nivel relativo), usando la unidad detectada.
function armarBloque(plantilla: Plantilla, nivelBase: number, unidad: string): string {
  return plantilla.texto
    .split('\n')
    .map((linea) => {
      const m = linea.match(/^ */);
      const rel = Math.floor((m ? m[0].length : 0) / 4);
      return unidad.repeat(nivelBase + rel) + linea.replace(/^ */, '');
    })
    .join('\n');
}

// Devuelve la última línea no vacía que precede a `inicioLinea`.
function lineaAnteriorNoVacia(texto: string, inicioLinea: number): string | null {
  const lineas = texto.slice(0, inicioLinea).split(/\r?\n/);
  for (let i = lineas.length - 1; i >= 0; i--) {
    if (lineas[i].trim() !== '') return lineas[i];
  }
  return null;
}

// Arma el bloque ya re-indentado y localiza el placeholder (que en la plantilla
// viene marcado como [[placeholder]]).
function bloquear(plantilla: Plantilla, nivelBase: number, unidad: string): Insercion {
  const marcador = `[[${plantilla.placeholder}]]`;
  const crudo = armarBloque(plantilla, nivelBase, unidad);
  const pos = crudo.indexOf(marcador);
  const texto = pos === -1 ? crudo : crudo.replace(marcador, plantilla.placeholder);
  return {
    texto,
    seleccionInicio: pos === -1 ? 0 : pos,
    seleccionFin: pos === -1 ? 0 : pos + plantilla.placeholder.length,
  };
}

// Inserta una plantilla en `textoActual` cerca de `posicionCursor` y devuelve
// el texto nuevo + el rango del placeholder para seleccionarlo. Es PURA: no
// toca el DOM ni usa la selección real del textarea.
//
// Reglas (sección 10.3):
//   - "Función" se inserta SIEMPRE al final, nivel 0, con una línea en blanco.
//   - En una línea vacía, la plantilla la reemplaza.
//   - En una línea ocupada, se inserta una línea nueva debajo.
//   - El nivel sale de la línea de referencia (+1 si esa línea abre un bloque).
export function insertarPlantilla(
  textoActual: string,
  posicionCursor: number,
  plantilla: Plantilla,
  unidadIndent: string,
): Insercion {
  // Botón "Función": siempre al final, nivel 0.
  if (plantilla.funcion) {
    const b = bloquear(plantilla, 0, unidadIndent);
    const separador = textoActual.trim() === '' ? '' : '\n\n';
    const punto = textoActual.length + separador.length;
    return {
      texto: textoActual + separador + b.texto,
      seleccionInicio: punto + b.seleccionInicio,
      seleccionFin: punto + b.seleccionFin,
    };
  }

  const inicioLinea = textoActual.lastIndexOf('\n', posicionCursor - 1) + 1;
  let finLinea = textoActual.indexOf('\n', posicionCursor);
  if (finLinea === -1) finLinea = textoActual.length;

  const lineaActual = textoActual.slice(inicioLinea, finLinea);

  if (lineaActual.trim() === '') {
    // Línea vacía: la reemplazamos. El nivel sale de la línea anterior.
    const previa = lineaAnteriorNoVacia(textoActual, inicioLinea);
    const nivelBase = previa === null ? 0 : nivelDe(previa, unidadIndent) + (abreBloque(previa) ? 1 : 0);
    const b = bloquear(plantilla, nivelBase, unidadIndent);
    const nuevo = textoActual.slice(0, inicioLinea) + b.texto + textoActual.slice(finLinea);
    return { texto: nuevo, seleccionInicio: inicioLinea + b.seleccionInicio, seleccionFin: inicioLinea + b.seleccionFin };
  }

  // Línea ocupada: insertamos una línea debajo.
  const nivelBase = nivelDe(lineaActual, unidadIndent) + (abreBloque(lineaActual) ? 1 : 0);
  const b = bloquear(plantilla, nivelBase, unidadIndent);
  const base = finLinea + 1;
  const nuevo = textoActual.slice(0, finLinea) + '\n' + b.texto + textoActual.slice(finLinea);
  return { texto: nuevo, seleccionInicio: base + b.seleccionInicio, seleccionFin: base + b.seleccionFin };
}
