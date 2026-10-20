// EditorTexto.tsx
// Etapa 4 — el componente del INPUT de texto, deliberadamente separado del
// canvas (DiagramaCanvas) para poder hacer el canvas responsive por separado.
//
// Expone por ref:
//   - insertar(insercion): aplica un Insercion (texto + selección) desde el panel.
//   - posicionCursor():    devuelve dónde está el cursor, para el panel de formas.
//   - enfocar():           pone el foco en el textarea.
//
// Atajos: Tab inserta la unidad de sangría, Shift+Tab la quita de la línea
// actual y Enter auto-indenta la línea siguiente si la actual abre un bloque.

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { abreBloque, detectarUnidad } from './core';
import type { Insercion } from './core';

export interface EditorTextoHandle {
  insertar: (insercion: Insercion) => void;
  posicionCursor: () => number;
  enfocar: () => void;
}

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}

const EditorTexto = forwardRef<EditorTextoHandle, Props>(function EditorTexto({ id, value, onChange }, ref) {
  const areaRef = useRef<HTMLTextAreaElement>(null);

  // Cambia el texto y deja el cursor en `inicio..fin` tras el render.
  function aplicar(texto: string, inicio: number, fin: number): void {
    onChange(texto);
    requestAnimationFrame(() => {
      const a = areaRef.current;
      if (a) {
        a.focus();
        a.setSelectionRange(inicio, fin);
      }
    });
  }

  useImperativeHandle(ref, () => ({
    insertar(insercion) {
      aplicar(insercion.texto, insercion.seleccionInicio, insercion.seleccionFin);
    },
    posicionCursor() {
      return areaRef.current?.selectionStart ?? value.length;
    },
    enfocar() {
      areaRef.current?.focus();
    },
  }));

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    const a = areaRef.current;
    if (!a) return;
    const unidad = detectarUnidad(value);
    const inicio = a.selectionStart;
    const fin = a.selectionEnd;

    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Dedenitar: quitar una unidad de sangría del inicio de la línea actual.
        const inicioLinea = value.lastIndexOf('\n', inicio - 1) + 1;
        const linea = value.slice(inicioLinea).match(/^[^\r\n]*/)?.[0] ?? '';
        const indent = linea.match(/^[ \t]*/)?.[0] ?? '';
        if (indent === '') return;
        const quitar = indent.startsWith('\t') ? 1 : Math.min(indent.length, unidad.length);
        const nuevaLinea = linea.slice(quitar);
        const texto = value.slice(0, inicioLinea) + nuevaLinea + value.slice(inicioLinea + linea.length);
        const cursorNuevo = Math.max(inicioLinea, inicio - quitar);
        aplicar(texto, cursorNuevo, cursorNuevo);
      } else {
        const texto = value.slice(0, inicio) + unidad + value.slice(fin);
        aplicar(texto, inicio + unidad.length, inicio + unidad.length);
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const inicioLinea = value.lastIndexOf('\n', inicio - 1) + 1;
      const linea = value.slice(inicioLinea).match(/^[^\r\n]*/)?.[0] ?? '';
      const indent = linea.match(/^[ \t]*/)?.[0] ?? '';
      const extra = abreBloque(linea) ? unidad : '';
      const nuevaLinea = '\n' + indent + extra;
      const texto = value.slice(0, inicio) + nuevaLinea + value.slice(inicio);
      aplicar(texto, inicio + nuevaLinea.length, inicio + nuevaLinea.length);
    }
  }

  return (
    <textarea
      id={id}
      ref={areaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      wrap="off"
      className="editor-texto"
      aria-label="Pseudocódigo"
    />
  );
});

export default EditorTexto;
