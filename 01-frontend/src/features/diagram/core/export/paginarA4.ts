// paginarA4.ts
// Etapa 8 — corte de páginas (sección 11.2). Función PURA: no toca el DOM.

// Un tramo vertical del diagrama que entra en una página (coordenadas Y del viewBox).
export interface TramoPagina {
  yInicio: number;
  yFin: number;
}

// Parte el alto del diagrama en tramos que caben en `altoPaginaPx`, cortando
// SIEMPRE que sea posible en un `cortesPosibles` (el medio de un conector,
// sección 7.5) para no partir una forma. Si ningún corte cae dentro de la
// página (un bloque más alto que la página), corta duro al final de la página.
export function paginarA4(
  altoDiagramaPx: number,
  cortesPosibles: number[],
  altoPaginaPx: number,
): TramoPagina[] {
  const cortes = [...cortesPosibles].sort((a, b) => a - b);
  const tramos: TramoPagina[] = [];
  let yInicio = 0;

  while (yInicio < altoDiagramaPx) {
    const limite = yInicio + altoPaginaPx;

    // Si lo que queda entra entero en esta página, no hay que cortar.
    if (limite >= altoDiagramaPx) {
      tramos.push({ yInicio, yFin: altoDiagramaPx });
      break;
    }

    // Hay que cortar: elegimos el corte válido más lejano dentro de la página
    // (la lista está ordenada, así que el último que entre es el mejor). Si
    // ninguno entra (bloque más alto que la página), cortamos duro en `limite`.
    let yFin = limite;
    for (const c of cortes) {
      if (c > yInicio && c < limite) yFin = c;
    }

    tramos.push({ yInicio, yFin });
    yInicio = yFin;
  }

  return tramos;
}
