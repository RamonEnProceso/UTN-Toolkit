// medida.ts
// Implementación de navegador de la medición de texto (sección 7.2). Usa un
// <canvas> fuera de pantalla para medir con `ctx.measureText`, con la misma
// fuente que usa el <svg> (monospace). Vive fuera del core porque toca el DOM;
// el core solo define el contrato `Medida`.

import type { Medida } from './core';

let contexto: CanvasRenderingContext2D | null = null;

function obtenerContexto(): CanvasRenderingContext2D | null {
  if (!contexto) {
    contexto = document.createElement('canvas').getContext('2d');
  }
  return contexto;
}

export const medidaEnNavegador: Medida = (texto, fuente) => {
  const ctx = obtenerContexto();
  if (!ctx) return texto.length * 8; // fallback aproximado si no hay canvas
  ctx.font = fuente;
  return ctx.measureText(texto).width;
};
