// Conector.tsx
// Línea vertical que une dos bloques consecutivos (sección 6.1).

import { TRAZO, GROSOR } from './texto';

interface Props {
  x: number;   // centro horizontal
  y1: number;  // extremo superior
  y2: number;  // extremo inferior
}

export default function Conector({ x, y1, y2 }: Props) {
  return <line x1={x} y1={y1} x2={x} y2={y2} stroke={TRAZO} strokeWidth={GROSOR} />;
}
