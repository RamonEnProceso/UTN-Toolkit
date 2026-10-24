// serializarSvg.ts
// Etapa 7 — convertir un <svg> del DOM en un string SVG autocontenido para
// exportar. Clona el nodo (para no tocar el que está en pantalla), fija el
// ancho/alto desde el viewBox o los parámetros provistos y agrega el namespace.

export function serializarSvg(svg: SVGSVGElement, ancho?: number, alto?: number): string {
  const clon = svg.cloneNode(true) as SVGSVGElement;
  const width = ancho ?? (svg.viewBox?.baseVal?.width || Number(svg.getAttribute('width')) || 400);
  const height = alto ?? (svg.viewBox?.baseVal?.height || Number(svg.getAttribute('height')) || 400);
  clon.setAttribute('viewBox', `0 0 ${width} ${height}`);
  clon.setAttribute('width', String(width));
  clon.setAttribute('height', String(height));
  clon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return new XMLSerializer().serializeToString(clon);
}

