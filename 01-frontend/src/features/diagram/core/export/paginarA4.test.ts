// paginarA4.test.ts
// Tests de la Etapa 8 para el corte de páginas (función pura).

import { describe, expect, it } from 'vitest';
import { paginarA4 } from './paginarA4';

describe('paginarA4', () => {
  it('usa una sola página si todo entra', () => {
    expect(paginarA4(100, [30, 60], 200)).toEqual([{ yInicio: 0, yFin: 100 }]);
  });

  it('corta en el corte válido más lejano', () => {
    expect(paginarA4(500, [150, 350], 200)).toEqual([
      { yInicio: 0, yFin: 150 },
      { yInicio: 150, yFin: 350 },
      { yInicio: 350, yFin: 500 },
    ]);
  });

  it('corta duro si no hay corte válido (bloque más alto que la página)', () => {
    expect(paginarA4(250, [], 100)).toEqual([
      { yInicio: 0, yFin: 100 },
      { yInicio: 100, yFin: 200 },
      { yInicio: 200, yFin: 250 },
    ]);
  });

  it('ignora cortes que caen fuera de la página actual', () => {
    expect(paginarA4(250, [150], 100)).toEqual([
      { yInicio: 0, yFin: 100 },
      { yInicio: 100, yFin: 150 },
      { yInicio: 150, yFin: 250 },
    ]);
  });
});
