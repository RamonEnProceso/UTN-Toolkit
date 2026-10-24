// Diagram.tsx
// Componente principal del diagramador: cablea el texto -> parser -> layout ->
// canvas y los paneles. Mantiene el estado (texto, config, función activa), lo
// persiste en localStorage (con try/catch) y dispara los exportes PNG/PDF.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  configPorDefecto,
  detectarUnidad,
  exportarPdf,
  exportarPng,
  insertarPlantilla,
  layoutDiagrama,
  parsear,
} from './core';
import type { Config, DiagramaParaExportar, Plantilla } from './core';
import DiagramaCanvas from './DiagramaCanvas';
import EditorTexto from './EditorTexto';
import type { EditorTextoHandle } from './EditorTexto';
import PanelConfig from './PanelConfig';
import PanelFormas from './PanelFormas';
import Pestanas from './Pestanas';
import { medidaEnNavegador } from './medida';

const CLAVE_TEXTO = 'diagrama-lindsay:texto';
const CLAVE_CONFIG = 'diagrama-lindsay:config';

// Ejemplo inicial para que la app abra con algo visible.
const TEXTO_INICIAL = [
  '- main()',
  '    - Leer nota',
  '    - Si nota >= 4',
  '        - Imprimir "Aprobado"',
  '    - Sino',
  '        - Imprimir "Desaprobado"',
].join('\n');

function cargarTexto(): string {
  try {
    return localStorage.getItem(CLAVE_TEXTO) ?? TEXTO_INICIAL;
  } catch {
    return TEXTO_INICIAL;
  }
}

function cargarConfig(): Config {
  try {
    const crudo = localStorage.getItem(CLAVE_CONFIG);
    if (!crudo) return configPorDefecto;
    return { ...configPorDefecto, ...(JSON.parse(crudo) as Partial<Config>) };
  } catch {
    return configPorDefecto;
  }
}

function nombreSeguro(nombre: string): string {
  const limpio = nombre.replace(/[^A-Za-z0-9_-]/g, '_').trim();
  return limpio || 'diagrama';
}

// Hook simple de debounce para no parsear ni guardar en cada tecla.
function useDebounced<T>(valor: T, retraso: number): T {
  const [debounced, setDebounced] = useState(valor);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(valor), retraso);
    return () => window.clearTimeout(t);
  }, [valor, retraso]);
  return debounced;
}

export default function Diagram() {
  const [texto, setTexto] = useState(cargarTexto);
  const [config, setConfig] = useState<Config>(cargarConfig);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);

  const editorRef = useRef<EditorTextoHandle>(null);
  const svgRefs = useRef(new Map<number, SVGSVGElement>());

  const textoDebounced = useDebounced(texto, 150);

  // Persistencia (try/catch: si localStorage falla, la app sigue andando).
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_TEXTO, textoDebounced);
    } catch {
      /* sin espacio o bloqueado: ignorar */
    }
  }, [textoDebounced]);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_CONFIG, JSON.stringify(config));
    } catch {
      /* ignorar */
    }
  }, [config]);

  // Aviso temporal (éxito/error de export).
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 4000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const programa = useMemo(() => parsear(textoDebounced), [textoDebounced]);
  const diagramas = useMemo(
    () => programa.funciones.map((f) => layoutDiagrama(f, config, medidaEnNavegador)),
    [programa, config],
  );

  // Limpiar referencias a SVG que ya no correspondan si disminuye la cantidad de funciones
  useEffect(() => {
    for (const key of Array.from(svgRefs.current.keys())) {
      if (key >= diagramas.length) {
        svgRefs.current.delete(key);
      }
    }
  }, [diagramas.length]);

  // Índice seguro para renderizar: se acota solo acá, sin tocar el estado.
  const indiceSeguro = diagramas.length === 0 ? 0 : Math.min(indiceActivo, diagramas.length - 1);
  const funcionesTab = programa.funciones.map((f) => ({ nombre: f.nombre, esMain: f.esMain }));

  function onInsertarPlantilla(plantilla: Plantilla): void {
    const cursor = editorRef.current?.posicionCursor() ?? texto.length;
    const unidad = detectarUnidad(texto);
    const insercion = insertarPlantilla(texto, cursor, plantilla, unidad);
    editorRef.current?.insertar(insercion);
  }

  async function onExportarPng(): Promise<void> {
    const d = diagramas[indiceSeguro];
    const svg = svgRefs.current.get(indiceSeguro);
    if (!d || !svg) return;
    try {
      await exportarPng(svg, nombreSeguro(d.funcion.nombre), d.ancho, d.alto);
      setAviso('PNG exportado.');
    } catch {
      setAviso('No se pudo exportar el PNG.');
    }
  }

  async function onExportarPdf(): Promise<void> {
    const datos = diagramas
      .map((d, i): DiagramaParaExportar | null => {
        const svg = svgRefs.current.get(i);
        return svg
          ? {
              nombre: d.funcion.nombre,
              svg,
              ancho: d.ancho,
              alto: d.alto,
              cortesPosibles: d.cortesPosibles,
            }
          : null;
      })
      .filter((x): x is DiagramaParaExportar => x !== null);
    if (datos.length === 0) return;
    try {
      await exportarPdf(datos);
      setAviso('PDF exportado.');
    } catch {
      setAviso('No se pudo exportar el PDF.');
    }
  }

  return (
    <div className="app-diagrama">
      <header className="encabezado">
        <h1>Diagramador de Pseudocódigo</h1>
        <div className="acciones">
          <button type="button" onClick={onExportarPng} disabled={diagramas.length === 0}>
            Exportar PNG
          </button>
          <button type="button" onClick={onExportarPdf} disabled={diagramas.length === 0}>
            Exportar PDF
          </button>
        </div>
      </header>

      <div className="contenido">
        <aside className="panel-izq">
          <EditorTexto ref={editorRef} value={texto} onChange={setTexto} />
          {programa.errores.length > 0 && (
            <ul className="lista-errores" role="alert">
              {programa.errores.map((e) => (
                <li key={e.linea}>
                  Línea {e.linea}: {e.mensaje}
                </li>
              ))}
            </ul>
          )}
          <PanelFormas onInsertar={onInsertarPlantilla} />
          <PanelConfig
            config={config}
            onCambio={(patch) => setConfig((c) => ({ ...c, ...patch }))}
            onRestablecer={() => setConfig(configPorDefecto)}
          />
          <a href="https://github.com/RamonEnProceso/UTN-Toolkit/issues/new" target="_blank" rel="noopener noreferrer" style={{marginLeft: '8px'}}>
            <button className="reportar-errores">Reportar errores</button>
          </a>
        </aside>

        <main className="panel-canvas">
          <Pestanas
            funciones={funcionesTab}
            activa={indiceSeguro}
            errores={programa.errores.length}
            onSeleccionar={setIndiceActivo}
          />
          {diagramas.length === 0 ? (
            <p className="vacio">
              Escribí pseudocódigo (una función por renglón, como «- main()») para ver el diagrama.
            </p>
          ) : (
            <div className="lienzo">
              {diagramas.map((d, i) => (
                <div key={i} hidden={i !== indiceSeguro}>
                  <DiagramaCanvas
                    ref={(el) => {
                      if (el) svgRefs.current.set(i, el);
                      else svgRefs.current.delete(i);
                    }}
                    layout={d}
                    config={config}
                  />
                </div>
              ))}
            </div>
          )}
          {aviso && (
            <p className="aviso" role="status">
              {aviso}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
