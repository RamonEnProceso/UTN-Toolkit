// layout.test.ts
// Tests de la Etapa 2 (layout). Usan una medición falsa de 8px por carácter
// (sección 12) para no depender del navegador: el ancho de un texto es
// `8 * texto.length` y así los números se pueden predecir a mano.
//
// Criterios de aceptación de la Etapa 2 (sección 12):
//   - el ancho total es siempre config.anchoDiagrama;
//   - ningún hijo se sale de su contenedor;
//   - el alto crece al agregar nodos;
//   - las cajas hermanas no se solapan.

import { describe, expect, it } from 'vitest';
import { parsear } from '../parser/parsear';
import { configPorDefecto } from '../config';
import { fuenteDe, medirTexto } from './medirTexto';
import type { Medida } from './medirTexto';
import { layoutBloques, layoutDiagrama } from './layoutBloques';
import type { Caja, NodoLayout } from '../types';

// Cada carácter mide 8px, sin importar la fuente (sección 12).
const medida8: Medida = (texto) => texto.length * 8;

describe('medirTexto', () => {
  const fuente = fuenteDe(configPorDefecto);

  it('parte por palabras las que entran en el ancho (8px por carácter)', () => {
    // anchoMax 40 = 5 caracteres por renglón.
    const r = medirTexto('hola mundo', 40, fuente, medida8);
    expect(r.renglones).toEqual(['hola', 'mundo']);
  });

  it('corta por caracteres una palabra más ancha que el ancho', () => {
    // "abcdef" mide 48px; con anchoMax 40 entra de a 5.
    const r = medirTexto('abcdef', 40, fuente, medida8);
    expect(r.renglones).toEqual(['abcde', 'f']);
  });

  it('el alto crece con la cantidad de renglones', () => {
    const una = medirTexto('abc', 200, fuente, medida8);
    const dos = medirTexto('abc def', 40, fuente, medida8);
    expect(una.renglones).toHaveLength(1);
    expect(dos.renglones).toHaveLength(2);
    expect(dos.alto).toBeGreaterThan(una.alto);
  });
});

describe('layoutBloques', () => {
  it('apila hermanos sin solaparse y con un conector entre cada par', () => {
    const p = parsear('- main()\n    - Leer a\n    - Imprimir a\n    - Leer b');
    const cuerpo = p.funciones[0].cuerpo;
    const r = layoutBloques(
      cuerpo,
      0,
      0,
      configPorDefecto.anchoDiagrama,
      configPorDefecto.separacionBloques,
      configPorDefecto,
      medida8,
    );

    expect(r.items).toHaveLength(3);
    // 3 bloques -> 2 conectores.
    expect(r.conectores).toHaveLength(2);

    // Cada bloque ocupa todo el ancho.
    for (const item of r.items) {
      expect(item.caja.ancho).toBe(configPorDefecto.anchoDiagrama);
    }

    // Los hermanos no se solapan y el conector queda en el hueco entre ellos.
    for (let i = 1; i < r.items.length; i++) {
      const prev = r.items[i - 1].caja;
      const curr = r.items[i].caja;
      expect(curr.y).toBeGreaterThanOrEqual(prev.y + prev.alto);

      const c = r.conectores[i - 1];
      expect(c.x).toBe(configPorDefecto.anchoDiagrama / 2);
      expect(c.y1).toBe(prev.y + prev.alto);
      expect(c.y2).toBe(prev.y + prev.alto + configPorDefecto.separacionBloques);
    }
  });
});

describe('layoutDiagrama — criterios de aceptación', () => {
  it('el ancho total es siempre config.anchoDiagrama', () => {
    const p = parsear(
      '- main()\n' +
        '    - Si x = 0\n' +
        '        - Leer a\n' +
        '    - Mientras x < 5\n' +
        '        - Imprimir x',
    );
    const d = layoutDiagrama(p.funciones[0], configPorDefecto, medida8);
    expect(d.ancho).toBe(configPorDefecto.anchoDiagrama);
  });

  it('ningún hijo se sale de su contenedor', () => {
    const p = parsear(
      '- main()\n' +
        '    - Si x = 0\n' +
        '        - Leer a\n' +
        '        - Imprimir a\n' +
        '    - Sino\n' +
        '        - Leer b\n' +
        '    - Mientras seguir\n' +
        '        - Leer c',
    );
    const d = layoutDiagrama(p.funciones[0], configPorDefecto, medida8);

    // Recorre el árbol y verifica que cada hijo quepa dentro de su padre.
    const verificar = (l: NodoLayout, padre?: Caja): void => {
      if (padre) {
        expect(l.caja.x).toBeGreaterThanOrEqual(padre.x);
        expect(l.caja.y).toBeGreaterThanOrEqual(padre.y);
        expect(l.caja.x + l.caja.ancho).toBeLessThanOrEqual(padre.x + padre.ancho);
        expect(l.caja.y + l.caja.alto).toBeLessThanOrEqual(padre.y + padre.alto);
      }
      for (const h of l.hijos) verificar(h, l.caja);
      for (const col of l.columnas ?? []) {
        for (const h of col.hijos) verificar(h, col.caja);
      }
    };

    for (const raiz of d.raiz) verificar(raiz);
  });

  it('el alto crece al agregar nodos', () => {
    const uno = layoutDiagrama(parsear('- main()\n    - Leer a').funciones[0], configPorDefecto, medida8);
    const dos = layoutDiagrama(parsear('- main()\n    - Leer a\n    - Leer b').funciones[0], configPorDefecto, medida8);
    expect(dos.alto).toBeGreaterThan(uno.alto);
  });

  it('los cortes posibles son el medio de cada conector del nivel principal', () => {
    const p = parsear('- main()\n    - Leer a\n    - Imprimir a\n    - Leer b');
    const d = layoutDiagrama(p.funciones[0], configPorDefecto, medida8);

    expect(d.cortesPosibles).toHaveLength(d.conectores.length);
    d.conectores.forEach((c, i) => {
      expect(d.cortesPosibles[i]).toBe((c.y1 + c.y2) / 2);
    });
  });

  it('un Si con Sino reparte el área 50/50; sin Sino deja el 90/10', () => {
    const p = parsear(
      '- main()\n' +
        '    - Si x = 0\n' +
        '        - Leer a\n' +
        '    - Sino\n' +
        '        - Leer b\n' +
        '    - Si y = 0\n' +
        '        - Leer c',
    );
    const d = layoutDiagrama(p.funciones[0], configPorDefecto, medida8);

    const colCon = d.raiz[0].columnas!;
    expect(colCon[0].caja.ancho).toBeCloseTo(colCon[1].caja.ancho, 5);

    const colSin = d.raiz[1].columnas!;
    expect(colSin[0].caja.ancho).toBeGreaterThan(colSin[1].caja.ancho);
  });

  it('respeta el margen: los bloques no arrancan en el borde', () => {
    const p = parsear('- main()\n    - Leer a');
    const d = layoutDiagrama(p.funciones[0], configPorDefecto, medida8);
    const m = configPorDefecto.margenDiagrama;
    expect(d.raiz[0].caja.x).toBe(m);
    expect(d.raiz[0].caja.ancho).toBe(configPorDefecto.anchoDiagrama - 2 * m);
  });
});

describe('layoutDiagrama — hexágonos (firma y llamada)', () => {
  it('la firma de una función no main lleva nombre arriba y parámetros con flecha', () => {
    const p = parsear('- sumar(a v, b v, r ^)\n    - Devolver r');
    const d = layoutDiagrama(p.funciones[0], configPorDefecto, medida8);

    expect(d.firma).toBeDefined();
    expect(d.firma!.arriba).toBe('sumar');
    expect(d.firma!.items.map((i) => [i.nombre, i.direccion])).toEqual([
      ['a', 'entrada'],
      ['b', 'entrada'],
      ['r', 'salida'],
    ]);
  });

  it('una llamada se dibuja como hexágono con argumentos posicionados', () => {
    const p = parsear('- main()\n    - suma <- sumar(1 v, 2 v)');
    const d = layoutDiagrama(p.funciones[0], configPorDefecto, medida8);
    const llamada = d.raiz[0];

    expect(llamada.nodo.tipo).toBe('llamada');
    expect(llamada.hexagono).toBeDefined();
    expect(llamada.hexagono!.arriba).toBe('suma <- sumar');
    expect(llamada.hexagono!.items.map((i) => i.nombre)).toEqual(['1', '2']);
    // La flecha queda a la derecha de su nombre.
    for (const item of llamada.hexagono!.items) {
      expect(item.centroFlecha).toBeGreaterThan(item.centroNombre);
    }
  });
});
