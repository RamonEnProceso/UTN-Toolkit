// parsear.test.ts
// Tests de la Etapa 1 (parser). Cubren los casos 1 a 5 de la sección 14 de la
// especificación, más algunos extras: texto vacío, mayúsculas/tildes y
// tolerancia al guion que falta.
//
// Criterio central (Etapa 1): el parser NUNCA lanza excepciones; los problemas
// se devuelven dentro de `errores`.

import { describe, expect, it } from 'vitest';
import { parsear } from './parsear';
import type { NodoLlamada, NodoMientras, NodoSi, NodoSwitch } from '../types';

describe('parsear — casos de la sección 14', () => {
  it('1. ejemplo mínimo: main con una entrada y una salida', () => {
    const p = parsear('- main():\n    - Leer numero\n    - Imprimir numero');

    expect(p.errores).toEqual([]);
    expect(p.funciones).toHaveLength(1);

    const main = p.funciones[0];
    expect(main.nombre).toBe('main');
    expect(main.esMain).toBe(true);
    expect(main.linea).toBe(1);
    expect(main.parametros).toEqual([]);
    expect(main.cuerpo).toHaveLength(2);
    expect(main.cuerpo[0].tipo).toBe('entrada');
    expect(main.cuerpo[0].texto).toBe('Leer numero');
    expect(main.cuerpo[0].id).toBe('n2');
    expect(main.cuerpo[1].tipo).toBe('salida');
    expect(main.cuerpo[1].texto).toBe('Imprimir numero');
  });

  it('2. condicional con y sin Sino', () => {
    const p = parsear(
      '- main()\n' +
        '    - Si x = 0\n' +
        '        - Devolver 1\n' +
        '    - Sino\n' +
        '        - Devolver -1\n' +
        '    - Si y = 5\n' +
        '        - Imprimir y',
    );

    expect(p.errores).toEqual([]);
    const main = p.funciones[0];
    expect(main.cuerpo).toHaveLength(2);

    const si1 = main.cuerpo[0] as NodoSi;
    expect(si1.tipo).toBe('si');
    expect(si1.condicion).toBe('x = 0');
    expect(si1.entonces).toHaveLength(1);
    expect(si1.entonces[0].texto).toBe('Devolver 1');
    expect(si1.sino).not.toBeNull();
    expect(si1.sino).toHaveLength(1);
    expect(si1.sino![0].texto).toBe('Devolver -1');

    const si2 = main.cuerpo[1] as NodoSi;
    expect(si2.tipo).toBe('si');
    expect(si2.condicion).toBe('y = 5');
    expect(si2.entonces).toHaveLength(1);
    expect(si2.sino).toBeNull();
  });

  it('3. switch con dos casos', () => {
    const p = parsear(
      '- main()\n' +
        '    - Cuando mes sea\n' +
        '        - 1-3\n' +
        '            - Devolver "Verano"\n' +
        '        - 4-6\n' +
        '            - Devolver "Otoño"',
    );

    expect(p.errores).toEqual([]);
    const sw = p.funciones[0].cuerpo[0] as NodoSwitch;
    expect(sw.tipo).toBe('switch');
    expect(sw.variable).toBe('mes');
    expect(sw.casos).toHaveLength(2);

    expect(sw.casos[0].etiqueta).toBe('1-3');
    expect(sw.casos[0].cuerpo).toHaveLength(1);
    expect(sw.casos[0].cuerpo[0].texto).toBe('Devolver "Verano"');

    expect(sw.casos[1].etiqueta).toBe('4-6');
    expect(sw.casos[1].cuerpo).toHaveLength(1);
    expect(sw.casos[1].cuerpo[0].texto).toBe('Devolver "Otoño"');
  });

  it('4. funciones y llamadas: orden de texto + hexágonos en main', () => {
    const p = parsear(
      '- imprimirTexto(texto v)\n' +
        '    - Imprimir texto\n' +
        '\n' +
        '- devolverSuma(num1 v, num2 v, suma ^)\n' +
        '    - Devolver num1 + num2\n' +
        '\n' +
        '- main()\n' +
        '    - suma <- devolverSuma(1 v, 2 v)\n' +
        '    - imprimirTexto(suma v)',
    );

    expect(p.errores).toEqual([]);
    // Orden de aparición en el texto (el reordenamiento "main primero" es de
    // la UI / pestañas, no del parser).
    expect(p.funciones.map((f) => f.nombre)).toEqual([
      'imprimirTexto',
      'devolverSuma',
      'main',
    ]);

    expect(p.funciones[0].parametros).toEqual([
      { nombre: 'texto', direccion: 'entrada' },
    ]);
    expect(p.funciones[1].parametros).toEqual([
      { nombre: 'num1', direccion: 'entrada' },
      { nombre: 'num2', direccion: 'entrada' },
      { nombre: 'suma', direccion: 'salida' },
    ]);

    const main = p.funciones[2];
    expect(main.esMain).toBe(true);
    expect(main.cuerpo).toHaveLength(2);
    expect(main.cuerpo[0].tipo).toBe('llamada');
    expect(main.cuerpo[1].tipo).toBe('llamada');

    const llamada1 = main.cuerpo[0] as NodoLlamada;
    expect(llamada1.nombre).toBe('devolverSuma');
    expect(llamada1.asignaA).toBe('suma');
    expect(llamada1.argumentos).toHaveLength(2);

    const llamada2 = main.cuerpo[1] as NodoLlamada;
    expect(llamada2.nombre).toBe('imprimirTexto');
    expect(llamada2.asignaA).toBeNull();
  });

  it('5. errores: Sino sin Si, línea fuera de función e indentación que salta', () => {
    const p = parsear(
      '- Sino\n' +
        '- x <- 1\n' +
        '- main()\n' +
        '            - Imprimir x',
    );

    // Las tres marcas en orden, con su número de línea.
    expect(p.errores.map((e) => e.linea)).toEqual([1, 2, 4]);
    expect(p.errores[0].mensaje).toContain('Sino');
    expect(p.errores[1].mensaje).toContain('función');
    expect(p.errores[2].mensaje).toContain('Indentación');

    // A pesar de los errores, main se parsea igual (se dibuja lo posible).
    expect(p.funciones).toHaveLength(1);
    expect(p.funciones[0].nombre).toBe('main');
  });
});

describe('parsear — casos extra', () => {
  it('texto vacío no produce errores ni funciones', () => {
    expect(parsear('')).toEqual({ funciones: [], errores: [] });
    expect(parsear('   \n\n  \n')).toEqual({ funciones: [], errores: [] });
  });

  it('reconoce palabras clave sin importar mayúsculas ni tildes', () => {
    const p = parsear(
      '- MAIN()\n' +
        '    - SI x = 0\n' +
        '        - Devolver 1\n' +
        '    - SINO\n' +
        '        - Devolver 2\n' +
        '    - MIENTRAS siga\n' +
        '        - Leer x',
    );

    expect(p.errores).toEqual([]);
    const main = p.funciones[0];
    expect(main.esMain).toBe(true);

    const si = main.cuerpo[0] as NodoSi;
    expect(si.tipo).toBe('si');
    expect(si.condicion).toBe('x = 0');
    expect(si.sino).toHaveLength(1);

    const mientras = main.cuerpo[1] as NodoMientras;
    expect(mientras.tipo).toBe('mientras');
    // El encabezado del bucle conserva la palabra "Mientras" (no se recorta).
    expect(mientras.condicion).toBe('MIENTRAS siga');
  });

  it('tolera que falte el guion y el espacio ("- Si" sin espacio)', () => {
    const p = parsear('main()\n    Leer numero\n    -Imprimir numero');
    expect(p.errores).toEqual([]);
    expect(p.funciones[0].cuerpo.map((n) => n.tipo)).toEqual(['entrada', 'salida']);
    expect(p.funciones[0].cuerpo[0].texto).toBe('Leer numero');
    expect(p.funciones[0].cuerpo[1].texto).toBe('Imprimir numero');
  });

  it('convierte en llamada (hexágono) aunque la función no esté definida', () => {
    const p = parsear('- main()\n    - resultado <- calcular(1 v)');
    // Ya no se exige que "calcular" esté definida: alcanza con escribir la
    // llamada para que aparezca como hexágono (pedido explícito del usuario).
    expect(p.errores).toEqual([]);
    const llamada = p.funciones[0].cuerpo[0] as NodoLlamada;
    expect(llamada.tipo).toBe('llamada');
    expect(llamada.nombre).toBe('calcular');
    expect(llamada.asignaA).toBe('resultado');
    expect(llamada.argumentos).toEqual([{ nombre: '1', direccion: 'entrada' }]);
  });

  it('reporta paréntesis sin cerrar en una firma', () => {
    const p = parsear('- imprimirTexto(texto v\n    - Imprimir texto');
    expect(p.errores).toHaveLength(1);
    expect(p.errores[0].linea).toBe(1);
    expect(p.errores[0].mensaje).toContain('Paréntesis');
    expect(p.funciones).toHaveLength(1);
    expect(p.funciones[0].nombre).toBe('imprimirTexto');
  });
});
