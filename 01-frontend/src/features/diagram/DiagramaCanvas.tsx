// DiagramaCanvas.tsx
// Etapa 3 — el lienzo SVG. Recorre un DiagramaLayout y dibuja cada forma con su
// componente. Es el único lugar que "sabe" cómo se compone un diagrama a partir
// del layout; las formas de abajo son presentacionales.
//
// Está claramente separado de EditorTexto (el input de texto), tal como pidió
// el usuario: el canvas solo recibe datos y se puede hacer responsive aparte.

import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import type { Columna, Config, Conector as ConectorTipo, DiagramaLayout, NodoLayout } from './core';
import Accion from './formas/Accion';
import Bucle from './formas/Bucle';
import Circulo from './formas/Circulo';
import Condicional from './formas/Condicional';
import Conector from './formas/Conector';
import Entrada from './formas/Entrada';
import Hexagono from './formas/Hexagono';
import Salida from './formas/Salida';
import Switch from './formas/Switch';
import TextoCentrado from './formas/TextoCentrado';
import { altoLinea, franjaAlto } from './formas/texto';

interface Props {
  layout: DiagramaLayout;
  config: Config;
}

const DiagramaCanvas = forwardRef<SVGSVGElement, Props>(function DiagramaCanvas({ layout, config }, ref) {
  const { funcion, ancho, alto, raiz, conectores } = layout;
  const fs = config.tamanoFuente;
  const padding = config.paddingForma;
  const diametro = config.diametroCirculo;
  const margen = config.margenDiagrama;
  const contenidoAncho = ancho - 2 * margen;

  // Alto del hexágono de firma (su contenido ya viene en layout.firma).
  const firmaAlto = 2 * altoLinea(fs) + 2 * padding;

  function renderBloques(items: NodoLayout[], bloquesConectores: ConectorTipo[]): ReactNode {
    return (
      <g>
        {bloquesConectores.map((c, i) => (
          <Conector key={`c${i}`} x={c.x} y1={c.y1} y2={c.y2} />
        ))}
        {items.map((n) => renderNodo(n))}
      </g>
    );
  }

  function renderColumna(col: Columna, indice: number): ReactNode {
    const etqAlto = franjaAlto(col.renglones.length, fs, padding);
    return (
      <g key={indice}>
        <TextoCentrado
          caja={{ x: col.caja.x, y: col.caja.y, ancho: col.caja.ancho, alto: etqAlto }}
          renglones={col.renglones}
          tamanoFuente={fs}
        />
        {renderBloques(col.hijos, col.conectores)}
      </g>
    );
  }

  function renderNodo(nodo: NodoLayout): ReactNode {
    const { caja, renglones } = nodo;
    switch (nodo.nodo.tipo) {
      case 'accion':
        return <Accion key={nodo.nodo.id} caja={caja} renglones={renglones} tamanoFuente={fs} />;
      case 'entrada':
        return <Entrada key={nodo.nodo.id} caja={caja} renglones={renglones} tamanoFuente={fs} />;
      case 'salida':
        return <Salida key={nodo.nodo.id} caja={caja} renglones={renglones} tamanoFuente={fs} />;
      case 'llamada':
        return (
          <Hexagono
            key={nodo.nodo.id}
            caja={caja}
            contenido={nodo.hexagono ?? { arriba: '', items: [] }}
            tamanoFuente={fs}
          />
        );

      case 'mientras':
      case 'para':
        return (
          <Bucle key={nodo.nodo.id} caja={caja} renglones={renglones} tamanoFuente={fs} padding={padding}>
            {renderBloques(nodo.hijos, nodo.conectores)}
          </Bucle>
        );

      case 'si':
      case 'switch': {
        const columnas = nodo.columnas ?? [];
        const separadoresX = columnas.slice(0, -1).map((c) => c.caja.x + c.caja.ancho);
        const Contenedor = nodo.nodo.tipo === 'si' ? Condicional : Switch;
        // En el Switch, las etiquetas de los casos son encabezados: una línea
        // debajo las separa de sus acciones y los separadores verticales arrancan
        // ahí (sección 6.6), igual que hace la franja superior del contenedor.
        const lineaEtiquetasY =
          nodo.nodo.tipo === 'switch' && columnas.length > 0
            ? Math.max(...columnas.map((c) => c.caja.y + franjaAlto(c.renglones.length, fs, padding)))
            : undefined;
        return (
          <Contenedor
            key={nodo.nodo.id}
            caja={caja}
            renglones={renglones}
            tamanoFuente={fs}
            padding={padding}
            separadoresX={separadoresX}
            lineaEtiquetasY={lineaEtiquetasY}
          >
            {columnas.map((col, i) => renderColumna(col, i))}
          </Contenedor>
        );
      }
    }
  }

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${ancho} ${alto}`}
      width={ancho}
      height={alto}
      role="img"
      aria-label={`Diagrama de la función ${funcion.nombre}`}
    >
      {/* fondo blanco para que el export salga opaco */}
      <rect x={0} y={0} width={ancho} height={alto} fill="#ffffff" />

      {/* conectores del nivel principal (detrás de las formas) */}
      {conectores.map((c, i) => (
        <Conector key={`top${i}`} x={c.x} y1={c.y1} y2={c.y2} />
      ))}

      {/* elemento superior: círculo I (main) o hexágono de firma */}
      {funcion.esMain ? (
        <Circulo cx={ancho / 2} cy={margen + diametro / 2} diametro={diametro} texto="I" tamanoFuente={fs} />
      ) : (
        <Hexagono
          caja={{ x: margen, y: margen, ancho: contenidoAncho, alto: firmaAlto }}
          contenido={layout.firma ?? { arriba: funcion.nombre, items: [] }}
          tamanoFuente={fs}
        />
      )}

      {/* cuerpo */}
      {renderBloques(raiz, [])}

      {/* círculo final F */}
      <Circulo cx={ancho / 2} cy={alto - margen - diametro / 2} diametro={diametro} texto="F" tamanoFuente={fs} />
    </svg>
  );
});

export default DiagramaCanvas;
