// PanelFormas.tsx
// Etapa 6 — paleta de formas. Cada botón muestra una mini-forma SVG y, al
// hacer clic, llama a onInsertar con la plantilla correspondiente. La lógica de
// DÓNDE y CÓMO se inserta vive en el core (insertarPlantilla, función pura).

import type { ReactNode } from 'react';
import { plantillas } from './core';
import type { Plantilla, TipoForma } from './core';

interface Props {
  onInsertar: (plantilla: Plantilla) => void;
}

const ANCHO = 50;
const ALTO = 30;
const BORDE = '#1a1a1a';

// Dibuja una mini versión de cada forma (solo el contorno, sin texto).
function MiniForma({ forma }: { forma: TipoForma }): ReactNode {
  let cuerpo: ReactNode;
  switch (forma) {
    case 'entrada': {
      const s = 8;
      cuerpo = <polygon points={`2,2 ${ANCHO - 2},2 ${ANCHO -s- 2},${ALTO - 2} ${2 + s},${ALTO - 2}`} fill="none" stroke={BORDE} strokeWidth={1.5} />;
      break;
    }
    case 'salida': {
      const s = 8;
      cuerpo = <polygon points={`${s},2 ${ANCHO - 2 - s},2 ${ANCHO - 2},${ALTO - 2} 2, ${ALTO - 2}`} fill="none" stroke={BORDE} strokeWidth={1.5} />;
      break;
    }
    case 'accion':
      cuerpo = <rect x={2} y={2} width={ANCHO - 4} height={ALTO - 4} fill="none" stroke={BORDE} strokeWidth={1.5} />;
      break;
    case 'si':
      cuerpo = (
        <>
          <rect x={2} y={2} width={ANCHO - 4} height={ALTO - 4} fill="none" stroke={BORDE} strokeWidth={1.5} />
          <line x1={ANCHO / 2} y1={2} x2={ANCHO / 2} y2={ALTO - 2} stroke={BORDE} strokeWidth={1.5} />
        </>
      );
      break;
    case 'switch':
      cuerpo = (
        <>
          <rect x={2} y={2} width={ANCHO - 4} height={ALTO - 4} fill="none" stroke={BORDE} strokeWidth={1.5} />
          <line x1={ANCHO / 3} y1={2} x2={ANCHO / 3} y2={ALTO - 2} stroke={BORDE} strokeWidth={1.5} />
          <line x1={(2 * ANCHO) / 3} y1={2} x2={(2 * ANCHO) / 3} y2={ALTO - 2} stroke={BORDE} strokeWidth={1.5} />
        </>
      );
      break;
    case 'mientras':
    case 'para':
      cuerpo = (
        <>
          <rect x={2} y={2} width={ANCHO - 4} height={ALTO - 4} fill="none" stroke={BORDE} strokeWidth={1.5} />
          <line x1={2} y1={10} x2={ANCHO - 2} y2={10} stroke={BORDE} strokeWidth={1.5} />
        </>
      );
      break;
    case 'funcion': {
      const s = 6;
      cuerpo = (
        <polygon
          points={`${2 + s},2 ${ANCHO - 2 - s},2 ${ANCHO - 2},${ALTO / 2} ${ANCHO - 2 - s},${ALTO - 2} ${2 + s},${ALTO - 2} 2,${ALTO / 2}`}
          fill="none"
          stroke={BORDE}
          strokeWidth={1.5}
        />
      );
      break;
    }
  }

  return (
    <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} width={ANCHO} height={ALTO} aria-hidden="true">
      {cuerpo}
    </svg>
  );
}

export default function PanelFormas({ onInsertar }: Props) {
  return (
    <fieldset className="panel panel-formas">
      <legend>Insertar forma</legend>
      <div className="rejilla-formas">
        {plantillas.map((p) => (
          <button
            key={p.nombre}
            type="button"
            className="boton-forma"
            title={`Insertar ${p.nombre}`}
            onClick={() => onInsertar(p)}
          >
            <MiniForma forma={p.forma} />
            <span>{p.nombre}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
