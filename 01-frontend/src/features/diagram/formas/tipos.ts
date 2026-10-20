// tipos.ts
// Tipos de props compartidos por las formas (Etapa 3).

import type { ReactNode } from 'react';
import type { Caja } from '../core';

// Props de una forma hoja (rectángulo, paralelogramo, hexágono): su caja ya
// calculada por el layout y el texto partido en renglones.
export interface PropsForma {
  caja: Caja;
  renglones: string[];
  tamanoFuente: number;
}

// Props de un contenedor de cuerpo simple (Mientras / Para): marco + franja
// superior con la condición + hijos ya posicionados.
export interface PropsBucle extends PropsForma {
  padding: number;
  children: ReactNode;
}

// Props de un contenedor con columnas (Si / Switch): además de la franja,
// una línea vertical por cada separación entre columnas.
export interface PropsColumnas extends PropsForma {
  padding: number;
  separadoresX: number[];
  // En el Switch, la y donde termina la franja de etiquetas de los casos: debajo
  // va una línea horizontal y los separadores verticales arrancan acá, igual que
  // la franja superior. Si no está definido (Si), no cambia nada.
  lineaEtiquetasY?: number;
  children: ReactNode;
}
