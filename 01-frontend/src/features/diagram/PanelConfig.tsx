// PanelConfig.tsx
// Etapa 5 — panel de configuración: 4 valores numéricos editables y el botón
// "Restablecer". Los valores se acotan a un rango razonable (default asumido,
// sección 13). Cada campo mantiene su texto local mientras está enfocado, para
// que tipear un valor intermedio (ej. "400") no lo pise la validación en vivo.

import { useState } from 'react';
import type { Config } from './core';

interface Props {
  config: Config;
  onCambio: (patch: Partial<Config>) => void;
  onRestablecer: () => void;
}

type ClaveConfigurable = 'anchoDiagrama' | 'paddingForma' | 'separacionAnidado' | 'separacionBloques' | 'margenDiagrama';

const CAMPOS: { clave: ClaveConfigurable; etiqueta: string; min: number; max: number }[] = [
  { clave: 'anchoDiagrama', etiqueta: 'Ancho del diagrama', min: 200, max: 5000 },
  { clave: 'paddingForma', etiqueta: 'Padding de las formas', min: 4, max: 40 },
  { clave: 'separacionAnidado', etiqueta: 'Separación anidada', min: 2, max: 32 },
  { clave: 'separacionBloques', etiqueta: 'Separación de bloques', min: 4, max: 80 },
  { clave: 'margenDiagrama', etiqueta: 'Margen del diagrama', min: 0, max: 80 },
];

function acotar(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

interface PropsCampo {
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  onChange: (valor: number) => void;
}

function CampoNumero({ etiqueta, valor, min, max, onChange }: PropsCampo) {
  const [texto, setTexto] = useState(String(valor));
  const [enfocado, setEnfocado] = useState(false);
  const [prevValor, setPrevValor] = useState(valor);

  // Sincroniza el texto desde `valor` cuando el campo no está enfocado. Es el
  // patrón de React para "derivar estado de props" sin un efecto: si la prop
  // cambió y el campo no se está editando, ajustamos el texto durante el render.
  if (valor !== prevValor) {
    setPrevValor(valor);
    if (!enfocado) setTexto(String(valor));
  }

  function manejarCambio(t: string): void {
    setTexto(t);
    const n = Number(t);
    if (t.trim() !== '' && Number.isFinite(n)) {
      onChange(acotar(n, min, max));
    }
  }

  function manejarBlur(): void {
    setEnfocado(false);
    const n = Number(texto);
    if (texto.trim() === '' || !Number.isFinite(n)) {
      setTexto(String(valor));
    } else {
      const c = acotar(n, min, max);
      setTexto(String(c));
      onChange(c);
    }
  }

  return (
    <label className="campo-config">
      <span>{etiqueta}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={texto}
        onFocus={() => setEnfocado(true)}
        onBlur={manejarBlur}
        onChange={(e) => manejarCambio(e.target.value)}
      />
    </label>
  );
}

export default function PanelConfig({ config, onCambio, onRestablecer }: Props) {
  return (
    <fieldset className="panel panel-config">
      <legend>Configuración</legend>
      <div className="campos-config">
        {CAMPOS.map((campo) => (
          <CampoNumero
            key={campo.clave}
            etiqueta={campo.etiqueta}
            valor={config[campo.clave]}
            min={campo.min}
            max={campo.max}
            onChange={(n) => onCambio({ [campo.clave]: n } as Partial<Config>)}
          />
        ))}
      </div>
      <button type="button" className="boton-restablecer" onClick={onRestablecer}>
        Restablecer
      </button>
    </fieldset>
  );
}
