// config.ts
// Configuración del diagrama (sección 8 de la especificación).
//
// `Config` es un objeto plano con los valores que controlan cómo se dibuja
// todo: cuánto padding tienen las formas, cuánta separación hay entre bloques,
// el ancho fijo del diagrama, etc. Son datos puros, sin lógica de React.

export interface Config {
  anchoDiagrama: number;   // ancho fijo del diagrama (unidades del viewBox)
  paddingForma: number;    // espacio entre el texto y el borde de cada forma
  separacionAnidado: number; // espacio entre un contenedor y sus hijos
  separacionBloques: number; // espacio vertical entre bloques del nivel principal
  margenDiagrama: number;    // margen exterior del diagrama (no pega al borde)
  tamanoFuente: number;      // 14 por defecto, no editable en v1
  diametroCirculo: number;   // 36 por defecto, no editable en v1
}

// Valores por defecto (sección 8). Son los que usa el panel de configuración
// como punto de partida y a los que vuelve el botón "Restablecer".
export const configPorDefecto: Config = {
  anchoDiagrama: 400,
  paddingForma: 15,
  separacionAnidado: 15,
  separacionBloques: 25,
  margenDiagrama: 20,
  tamanoFuente: 16,
  diametroCirculo: 36,
};
