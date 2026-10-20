// Bucle.tsx
// Contenedor de bucle (Mientras / Para, sección 6.7): marco con la franja de
// la condición arriba y, debajo, el cuerpo. Los hijos ya llegan posicionados.

import type { PropsBucle } from './tipos';
import { RELLENO, TRAZO, GROSOR, franjaAlto } from './texto';
import TextoCentrado from './TextoCentrado';

export default function Bucle({ caja, renglones, tamanoFuente, padding, children }: PropsBucle) {
  const fa = franjaAlto(renglones.length, tamanoFuente, padding);
  return (
    <g>
      <rect x={caja.x} y={caja.y} width={caja.ancho} height={caja.alto} fill={RELLENO} stroke={TRAZO} strokeWidth={GROSOR} />
      <line x1={caja.x} y1={caja.y + fa} x2={caja.x + caja.ancho} y2={caja.y + fa} stroke={TRAZO} strokeWidth={GROSOR} />
      <TextoCentrado caja={{ x: caja.x, y: caja.y, ancho: caja.ancho, alto: fa }} renglones={renglones} tamanoFuente={tamanoFuente} />
      {children}
    </g>
  );
}
