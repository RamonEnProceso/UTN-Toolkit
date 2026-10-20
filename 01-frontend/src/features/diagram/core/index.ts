// index.ts
// Punto de entrada del core: re-exporta todo lo público para que la UI importe
// desde `./core` en un solo lugar.
export * from './types';
export * from './config';
export { clasificarLinea, extraerLlamada } from './parser/clasificarLinea';
export type { TipoLinea, FormaLlamada, LineaClasificada } from './parser/clasificarLinea';
export { parsear } from './parser/parsear';
export { medirTexto, fuenteDe, ALTURA_LINEA } from './layout/medirTexto';
export type { Medida, TextoMedido } from './layout/medirTexto';
export { layoutNodo } from './layout/layoutNodo';
export { layoutBloques, layoutDiagrama } from './layout/layoutBloques';
export type { Bloques } from './layout/layoutBloques';
export { layoutItemsHexagono, geometriaFlecha, flechaAncho } from './layout/flecha';
export type { GeometriaFlecha } from './layout/flecha';
export { plantillas, insertarPlantilla, detectarUnidad, nivelDe, abreBloque } from './plantillas';
export type { Plantilla, TipoForma, Insercion } from './plantillas';
export { paginarA4 } from './export/paginarA4';
export type { TramoPagina } from './export/paginarA4';
export { serializarSvg } from './export/serializarSvg';
export { exportarPng } from './export/exportarPng';
export { exportarPdf } from './export/exportarPdf';
export type { DiagramaParaExportar } from './export/exportarPdf';
