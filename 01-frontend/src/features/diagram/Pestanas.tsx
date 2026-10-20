// Pestanas.tsx
// Etapa 4 — pestañas para elegir qué función se muestra en el canvas. También
// avisa (junto al editor) cuántos errores de parseo hay.

interface Props {
  funciones: { nombre: string; esMain: boolean }[];
  activa: number;
  errores: number;
  onSeleccionar: (indice: number) => void;
}

export default function Pestanas({ funciones, activa, errores, onSeleccionar }: Props) {
  return (
    <div className="pestanas" role="tablist" aria-label="Funciones">
      {funciones.map((f, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === activa}
          className={i === activa ? 'pestana activa' : 'pestana'}
          onClick={() => onSeleccionar(i)}
        >
          {f.esMain ? `${f.nombre} (main)` : f.nombre}
        </button>
      ))}
      {errores > 0 && (
        <span className="aviso-errores" role="status">
          {errores} error{errores === 1 ? '' : 'es'}
        </span>
      )}
    </div>
  );
}
