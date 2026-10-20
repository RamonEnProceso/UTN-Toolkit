// plantillas.test.ts
// Tests de la Etapa 6: detección de unidad e inserción de plantillas.

import { describe, expect, it } from 'vitest';
import { plantillas, insertarPlantilla, detectarUnidad } from './plantillas';

const porNombre = (n: string) => plantillas.find((p) => p.nombre === n)!;

describe('detectarUnidad', () => {
  it('usa 4 espacios si la primera línea indentada tiene 4', () => {
    expect(detectarUnidad('- main()\n    - Leer a')).toBe('    ');
  });

  it('usa tab si la primera línea indentada usa tab', () => {
    expect(detectarUnidad('- main()\n\t- Leer a')).toBe('\t');
  });
});

describe('insertarPlantilla', () => {
  it('reemplaza una línea vacía al nivel de la línea anterior', () => {
    const texto = '- main()\n    - Leer a\n';
    const r = insertarPlantilla(texto, texto.length, porNombre('Entrada'), '    ');
    expect(r.texto).toBe('- main()\n    - Leer a\n    - Leer variable');
    expect(r.texto.slice(r.seleccionInicio, r.seleccionFin)).toBe('variable');
  });

  it('anida un nivel más si la línea anterior abre un bloque', () => {
    const texto = '- main()\n    - Si x = 0\n';
    const r = insertarPlantilla(texto, texto.length, porNombre('Entrada'), '    ');
    expect(r.texto).toBe('- main()\n    - Si x = 0\n        - Leer variable');
  });

  it('inserta una línea debajo de una línea ocupada (sin anidar)', () => {
    const texto = '- main()\n    - Leer a';
    const r = insertarPlantilla(texto, texto.length, porNombre('Mientras'), '    ');
    expect(r.texto).toBe('- main()\n    - Leer a\n    - Mientras condicion\n        - accion');
    expect(r.texto.slice(r.seleccionInicio, r.seleccionFin)).toBe('condicion');
  });

  it('la plantilla "Función" se agrega al final, nivel 0, con línea en blanco', () => {
    const texto = '- main()\n    - Leer a';
    const r = insertarPlantilla(texto, 100, porNombre('Función'), '    ');
    expect(r.texto).toBe('- main()\n    - Leer a\n\n- nombre(parametro v, resultado ^)\n    - accion');
    expect(r.texto.slice(r.seleccionInicio, r.seleccionFin)).toBe('nombre');
  });

  it('conserva la sangría relativa de una plantilla de varias líneas', () => {
    const texto = '- main()\n';
    const r = insertarPlantilla(texto, texto.length, porNombre('Condicional'), '    ');
    expect(r.texto).toBe('- main()\n    - Si condicion\n        - accion\n    - Sino\n        - accion');
  });
});
