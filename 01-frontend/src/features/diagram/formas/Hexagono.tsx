// Hexagono.tsx
// Forma de llamada a función y de firma de función no main (hexágono, sección
// 6.8). Tiene dos mitades separadas por una línea horizontal: arriba el nombre
// (o "var <- nombre") y abajo los parámetros/argumentos, cada uno con su flecha
// de dirección (v = entrada, ^ = salida, v^ = ambas) dibujada como path SVG (no
// texto, para que el PDF no dependa de fuentes).
//
// El hexágono queda DENTRO de su caja (los "picos" están en los bordes laterales,
// no sobresalen), para que no se recorte cuando la caja empieza en x = 0.

import type { Caja, ContenidoHexagono, Direccion } from '../core';
import { geometriaFlecha } from '../core';
import { FUENTE, RELLENO, TRAZO, GROSOR, altoLinea } from './texto';

interface Props {
  caja: Caja;
  contenido: ContenidoHexagono;
  tamanoFuente: number;
}

// Path de una flecha centrada en (cx, cy). `a` es el semiancho de la punta y
// `h2` el semialto total (asta + punta). Entrada apunta abajo, salida arriba.
function flechaD(direccion: Direccion, cx: number, cy: number, a: number, h2: number): string {
  const n = (v: number) => v.toFixed(2);
  const astaCompleta = `M ${n(cx)} ${n(cy - 1.2*h2)} L ${n(cx)} ${n(cy + 1.2*h2)}`;
  const puntaArriba = `M ${n(cx - a)} ${n(cy - 1.2*h2 + a)} L ${n(cx)} ${n(cy - 1.2*h2)} L ${n(cx + a)} ${n(cy - 1.2*h2 + a)}`;
  const puntaAbajo = `M ${n(cx - a)} ${n(cy + 1.2*h2 - a)} L ${n(cx)} ${n(cy + 1.2*h2)} L ${n(cx + a)} ${n(cy + 1.2*h2 - a)}`;

  if (direccion === 'entrada') {
    return `M ${n(cx)} ${n(cy - h2)} L ${n(cx)} ${n(cy + 1.6*h2 - a)} ${puntaAbajo}`;
  }
  if (direccion === 'salida') {
    return `M ${n(cx)} ${n(cy + h2)} L ${n(cx)} ${n(cy - 1.6*h2 + a)} ${puntaArriba}`;
  }
  return `${astaCompleta} ${puntaArriba} ${puntaAbajo}`;
}

export default function Hexagono({ caja, contenido, tamanoFuente }: Props) {
  const s = Math.min(caja.ancho * 0.2, caja.alto * 0.6);
  const midY = caja.y + caja.alto / 2;
  const puntos = [
    caja.x + s, caja.y,
    caja.x + caja.ancho - s, caja.y,
    caja.x + caja.ancho, midY,
    caja.x + caja.ancho - s, caja.y + caja.alto,
    caja.x + s, caja.y + caja.alto,
    caja.x, midY,
  ]
    .map((v) => v.toFixed(2))
    .join(' ');

  const linea = altoLinea(tamanoFuente);
  const centroX = caja.x + caja.ancho / 2;
  const mitadAlto = caja.alto / 2;
  // Cada renglón se centra dentro de su mitad (arriba / abajo).
  const baselineDe = (mitadTop: number) => mitadTop + (mitadAlto - linea) / 2 + linea * 0.8;
  const baselineAbajo = baselineDe(midY);

  const { a, h2 } = geometriaFlecha(tamanoFuente);
  const cyFlecha = midY + mitadAlto / 2;

  return (
    <g>
      <polygon points={puntos} fill={RELLENO} stroke={TRAZO} strokeWidth={GROSOR} />
      <line x1={caja.x} y1={midY} x2={caja.x + caja.ancho} y2={midY} stroke={TRAZO} strokeWidth={GROSOR} />

      <text
        x={centroX}
        y={baselineDe(caja.y)}
        fontFamily={FUENTE}
        fontSize={tamanoFuente}
        fill={TRAZO}
        textAnchor="middle"
      >
        {contenido.arriba}
      </text>

      {contenido.items.map((item, i) => (
        <g key={i}>
          <text
            x={caja.x + item.centroNombre}
            y={baselineAbajo}
            fontFamily={FUENTE}
            fontSize={tamanoFuente}
            fill={TRAZO}
            textAnchor="middle"
          >
            {item.nombre}
          </text>
          <path
            d={flechaD(item.direccion, caja.x + item.centroFlecha, cyFlecha, a, h2)}
            fill="none"
            stroke={TRAZO}
            strokeWidth={GROSOR}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </g>
  );
}
