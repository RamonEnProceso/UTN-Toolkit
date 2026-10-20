// Condicional.tsx
// Contenedor de una condición "Si" (sección 6.5): marco con la franja de la
// condición arriba y, debajo, las columnas SI / SINO separadas por una línea
// vertical. Los hijos ya llegan posicionados.

import type { PropsColumnas } from './tipos';
import { RELLENO, TRAZO, GROSOR, franjaAlto } from './texto';
import TextoCentrado from './TextoCentrado';

export default function Condicional({ caja, renglones, tamanoFuente, padding, separadoresX, children }: PropsColumnas) {
  const fa = franjaAlto(renglones.length, tamanoFuente, padding);
  return (
    <g>
      <rect x={caja.x} y={caja.y} width={caja.ancho} height={caja.alto} fill={RELLENO} stroke={TRAZO} strokeWidth={GROSOR} />
      <line x1={caja.x} y1={caja.y + fa} x2={caja.x + caja.ancho} y2={caja.y + fa} stroke={TRAZO} strokeWidth={GROSOR} />
      {separadoresX.map((x) => (
        <line key={x} x1={x} y1={caja.y + fa} x2={x} y2={caja.y + caja.alto} stroke={TRAZO} strokeWidth={GROSOR} />
      ))}
      <TextoCentrado caja={{ x: caja.x, y: caja.y, ancho: caja.ancho, alto: fa }} renglones={renglones} tamanoFuente={tamanoFuente} />
      {children}
    </g>
  );
}
