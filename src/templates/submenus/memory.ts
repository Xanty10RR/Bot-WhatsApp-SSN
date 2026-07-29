export interface ConvenioSeleccion {
  banco: string;
  id: string;
  nombre: string;
}

export interface MemoryData {
  texto: string;
  sugerencia?: string;
  resultados: ConvenioSeleccion[];
}

export const memory: Record<string, MemoryData> = {};

export const sugerencias: Record<string, string> = {};