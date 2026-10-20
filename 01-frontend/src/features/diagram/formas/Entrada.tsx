// Entrada.tsx
// Forma de entrada (Leer / Ingresar / Abrir): trapecio con la base mayor arriba
// y las dos aristas laterales en diagonal (sección 6.3).

import type { PropsForma } from './tipos';
import { RELLENO, TRAZO, GROSOR } from './texto';
import TextoCentrado from './TextoCentrado';

export default function Entrada({ caja, renglones, tamanoFuente }: PropsForma) {
  const s = Math.min(caja.ancho * 0.18, caja.alto * 0.6);
  const puntos = [
    caja.x, caja.y,
    caja.x + caja.ancho, caja.y,
    caja.x + caja.ancho - s, caja.y + caja.alto,
    caja.x + s, caja.y + caja.alto,
  ]
    .map((v) => v.toFixed(2))
    .join(' ');

  return (
    <g>
      <polygon points={puntos} fill={RELLENO} stroke={TRAZO} strokeWidth={GROSOR} />
      <TextoCentrado caja={caja} renglones={renglones} tamanoFuente={tamanoFuente} />
    </g>
  );
}
