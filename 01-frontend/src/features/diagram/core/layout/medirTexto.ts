// medirTexto.ts
// Etapa 2 — Layout (parte 1): medición de texto.
//
// Responsabilidad: dado un texto y un ancho máximo, partirlo en renglones que
// quepan y devolver cuánto miden. Es una función PURA: no usa `canvas` ni el
// DOM. La medición real del ancho de un string se INYECTA por parámetro (tipo
// `Medida`) para poder testear el layout sin navegador (sección 7.2).
//
// En el navegador, la medida real es `ctx.measureText(texto).width` con la
// misma fuente que usa el <svg>. Acá solo definimos el contrato.

// Una "medida" convierte un texto en su ancho (px) usando una fuente dada.
export type Medida = (texto: string, fuente: string) => number;

// Resultado de medir un texto: los renglones en que quedó partido y el alto
// total (cantidad de renglones × altura de línea).
export interface TextoMedido {
  renglones: string[];
  alto: number;
}

// Altura de cada renglón como múltiplo del tamaño de fuente. No la especifica
// la sección 8, así que elegimos 1.5 (con fuente de 14px → 21px por renglón),
// un valor cómodo de leer (default asumido, sección 13).
export const ALTURA_LINEA = 1.5;

// Arma el string de fuente CSS a partir del tamaño de la config. Se usa
// "monospace" porque el pseudocódigo se escribe en ancho fijo.
export function fuenteDe(config: { tamanoFuente: number }): string {
  return `${config.tamanoFuente}px monospace`;
}

// Extrae el tamaño en px de un string de fuente ("14px monospace" -> 14).
// Se usa para calcular el alto de cada renglón. Si no se puede leer, 14.
function tamanoDe(fuente: string): number {
  const m = fuente.match(/(\d+(?:\.\d+)?)px/);
  return m ? Number(m[1]) : 14;
}

// Parte un texto en renglones que entran en `anchoMax` (sección 7.2):
//   - primero por palabras: un renglón lleva tantas palabras como quepan;
//   - si UNA palabra sola es más ancha que `anchoMax`, se corta por caracteres.
// Es un detalle interno de `medirTexto`, por eso no se exporta.
function partirEnRenglones(
  texto: string,
  anchoMax: number,
  fuente: string,
  medida: Medida,
): string[] {
  const palabras = texto.trim().split(/\s+/).filter((p) => p !== '');
  if (palabras.length === 0) return [];

  const renglones: string[] = [];
  let linea = '';

  // Corta una palabra demasiado larga en pedazos que quepan, carácter a carácter.
  const cortarPalabra = (palabra: string): string[] => {
    const pedazos: string[] = [];
    let actual = '';
    for (const ch of palabra) {
      const candidato = actual + ch;
      // Sumamos mientras entre; el primer carácter siempre entra para no
      // trabarse nunca (incluso si anchoMax es ínfimo).
      if (medida(candidato, fuente) <= anchoMax || actual === '') {
        actual = candidato;
      } else {
        pedazos.push(actual);
        actual = ch;
      }
    }
    if (actual !== '') pedazos.push(actual);
    return pedazos;
  };

  for (const palabra of palabras) {
    if (linea === '') {
      if (medida(palabra, fuente) <= anchoMax) {
        linea = palabra;
      } else {
        renglones.push(...cortarPalabra(palabra));
      }
    } else {
      const candidato = `${linea} ${palabra}`;
      if (medida(candidato, fuente) <= anchoMax) {
        linea = candidato;
      } else {
        renglones.push(linea);
        linea = '';
        if (medida(palabra, fuente) <= anchoMax) {
          linea = palabra;
        } else {
          renglones.push(...cortarPalabra(palabra));
        }
      }
    }
  }

  if (linea !== '') renglones.push(linea);
  return renglones;
}

// La función principal: parte el texto y devuelve los renglones + el alto.
export function medirTexto(
  texto: string,
  anchoMax: number,
  fuente: string,
  medida: Medida,
): TextoMedido {
  const renglones = partirEnRenglones(texto, anchoMax, fuente, medida);
  const alto = renglones.length * tamanoDe(fuente) * ALTURA_LINEA;
  return { renglones, alto };
}
