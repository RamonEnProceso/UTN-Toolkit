// Circulo.tsx
// Círculo de inicio (I) y fin (F) del diagrama (sección 6.1).

import { FUENTE, RELLENO, TRAZO, GROSOR } from './texto';

interface Props {
  cx: number;
  cy: number;
  diametro: number;
  texto: string;
  tamanoFuente: number;
}

export default function Circulo({ cx, cy, diametro, texto, tamanoFuente }: Props) {
  return (
    <>
      <circle cx={cx} cy={cy} r={diametro / 2} fill={RELLENO} stroke={TRAZO} strokeWidth={GROSOR} />
      <text
        x={cx}
        y={cy + tamanoFuente * 0.35}
        fontFamily={FUENTE}
        fontSize={tamanoFuente}
        fill={TRAZO}
        textAnchor="middle"
      >
        {texto}
      </text>
    </>
  );
}
