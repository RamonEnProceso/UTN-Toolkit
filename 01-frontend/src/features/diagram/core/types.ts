// Types shared between parser and layout for the diagram
// Copied from the specification (section 5)
export interface NodoBase {
  id: string; // identificador único, estable entre renders
  linea: number; // número de línea (empieza en 1)
  texto: string; // texto original del renglón, sin "- " ni la indentación
}

export type Direccion = 'entrada' | 'salida' | 'ambas'; // v, ^, v^

export interface Parametro {
  nombre: string;
  direccion: Direccion;
}

export interface NodoAccion extends NodoBase { tipo: 'accion' }
export interface NodoEntrada extends NodoBase { tipo: 'entrada' }   // Leer / Ingresar / Abrir
export interface NodoSalida extends NodoBase { tipo: 'salida' }    // Imprimir / Mostrar / Escribir

export interface NodoSi extends NodoBase {
  tipo: 'si';
  condicion: string;          // lo que va después de "Si"
  entonces: Nodo[];           // hijos de la rama SI
  sino: Nodo[] | null;        // null si no hay "Sino"
}

export interface CasoSwitch {
  etiqueta: string;           // "1-3", "Otro", etc.
  cuerpo: Nodo[];
}
export interface NodoSwitch extends NodoBase {
  tipo: 'switch';
  variable: string;           // lo que está entre "Cuando" y "sea"
  casos: CasoSwitch[];
}

export interface NodoMientras extends NodoBase { tipo: 'mientras'; condicion: string; cuerpo: Nodo[] }
export interface NodoPara extends NodoBase { tipo: 'para'; condicion: string; cuerpo: Nodo[] }

export interface NodoLlamada extends NodoBase {
  tipo: 'llamada';
  nombre: string;             // función llamada
  argumentos: Parametro[];
  asignaA: string | null;     // variable que recibe el resultado, si hay "<-"
}

// Contenido de la mitad de abajo de un hexágono (firma o llamada): cada
// parámetro/argumento con su flecha de dirección ya posicionada.
export interface ItemHexagono {
  nombre: string;
  direccion: Direccion;
  centroNombre: number;  // x del centro del texto (relativo a la caja)
  centroFlecha: number;  // x del centro de la flecha (relativo a la caja)
}

export interface ContenidoHexagono {
  arriba: string;          // nombre (o "var <- nombre") en la mitad de arriba
  items: ItemHexagono[];   // parámetros/argumentos con flecha en la mitad de abajo
}

export type Nodo =
  | NodoAccion
  | NodoEntrada
  | NodoSalida
  | NodoSi
  | NodoSwitch
  | NodoMientras
  | NodoPara
  | NodoLlamada;

export interface Funcion {
  nombre: string;
  esMain: boolean;
  parametros: Parametro[];
  cuerpo: Nodo[];
  linea: number;
}

export interface ErrorParseo {
  linea: number;
  mensaje: string; // en español, entendible por un estudiante
}

export interface Programa {
  funciones: Funcion[];       // en el orden en que aparecen en el texto
  errores: ErrorParseo[];
}

// ---- Tipos del layout (sección 5) ----
// Son la salida de la Etapa 2. Acá solo se declaran, para tener el contrato listo.

export interface Caja {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

// Una línea vertical que une dos bloques consecutivos (la "conexión" entre
// hermanos). `x` es el centro; como cada bloque ocupa todo el ancho que le da
// su padre, `x` coincide con el centro del padre.
export interface Conector {
  x: number;
  y1: number; // extremo superior
  y2: number; // extremo inferior
}

// Una columna de un Si/Switch: su etiqueta (SI / SINO / el valor del caso) y
// los hijos que contiene, ya posicionados. `conectores` guarda las líneas
// verticales entre los hijos de esta columna (el tipo de la sección 5 no las
// preveía; es una extensión mínima para que el render las pueda dibujar).
export interface Columna {
  etiqueta: string;
  renglones: string[];   // etiqueta ya partida en renglones que caben en el ancho
  caja: Caja;
  hijos: NodoLayout[];
  conectores: Conector[];
}

// Un nodo ya posicionado. "hijos" son sus sub-bloques posicionados (puede estar vacío).
export interface NodoLayout {
  nodo: Nodo;
  caja: Caja;
  renglones: string[];         // texto ya partido en renglones que entran en el ancho
  hijos: NodoLayout[];
  // Para Si/Switch: las columnas y sus cajas (ver sección 6)
  columnas?: Columna[];
  // Para llamadas: la mitad de arriba y los items con flecha (sección 6.8).
  hexagono?: ContenidoHexagono;
  conectores: Conector[];      // líneas verticales entre los hijos (contenedores)
}

export interface DiagramaLayout {
  funcion: Funcion;
  firma?: ContenidoHexagono;   // hexágono superior (funciones no main)
  ancho: number;
  alto: number;                // crece con el contenido
  raiz: NodoLayout[];          // bloques del nivel principal
  conectores: Conector[];      // líneas verticales del nivel principal (incluye I y F)
  cortesPosibles: number[];    // coordenadas Y válidas para cortar página en el PDF
}
