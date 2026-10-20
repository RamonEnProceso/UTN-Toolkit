// Accion.tsx
// Forma de acción: rectángulo (sección 6.2).

import type { PropsForma } from './tipos';
import { RELLENO, TRAZO, GROSOR } from './texto';
import TextoCentrado from './TextoCentrado';

export default function Accion({ caja, renglones, tamanoFuente }: PropsForma) {
  return (
    <g>
      <rect x={caja.x} y={caja.y} width={caja.ancho} height={caja.alto} fill={RELLENO} stroke={TRAZO} strokeWidth={GROSOR} />
      <TextoCentrado caja={caja} renglones={renglones} tamanoFuente={tamanoFuente} />
    </g>
  );
}
