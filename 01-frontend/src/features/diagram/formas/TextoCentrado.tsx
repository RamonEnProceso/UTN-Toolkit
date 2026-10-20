// TextoCentrado.tsx
// Dibuja varios renglones de texto centrados (horizontal y verticalmente)
// dentro de una caja. Lo usan las formas hoja y las franjas de los contenedores.

import type { Caja } from '../core';
import { FUENTE, TRAZO, altoLinea } from './texto';

interface Props {
  caja: Caja;
  renglones: string[];
  tamanoFuente: number;
}

export default function TextoCentrado({ caja, renglones, tamanoFuente }: Props) {
  const linea = altoLinea(tamanoFuente);
  const altoTexto = renglones.length * linea;
  const top = caja.y + (caja.alto - altoTexto) / 2;
  const centroX = caja.x + caja.ancho / 2;
  // 0.8 de línea: la parte de "ascendente" del glifo, para que el texto quede
  // ópticamente centrado en su franja.
  const primerBaseline = top + linea * 0.8;

  return (
    <>
      {renglones.map((r, i) => (
        <text
          key={i}
          x={centroX}
          y={primerBaseline + i * linea}
          fontFamily={FUENTE}
          fontSize={tamanoFuente}
          fill={TRAZO}
          textAnchor="middle"
        >
          {r}
        </text>
      ))}
    </>
  );
}
