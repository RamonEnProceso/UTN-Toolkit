// serializarSvg.ts
// Etapa 7 — convertir un <svg> del DOM en un string SVG autocontenido para
// exportar. Clona el nodo (para no tocar el que está en pantalla), fija el
// ancho/alto desde el viewBox y agrega el namespace.

export function serializarSvg(svg: SVGSVGElement): string {
  const clon = svg.cloneNode(true) as SVGSVGElement;
  const { width, height } = svg.viewBox.baseVal;
  clon.setAttribute('width', String(width));
  clon.setAttribute('height', String(height));
  clon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return new XMLSerializer().serializeToString(clon);
}
