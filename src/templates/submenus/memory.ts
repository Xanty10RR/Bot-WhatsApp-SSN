export interface UserMemory {
  texto?: string;
  sugerencia?: string;
  resultados?: any[];
}

export const memory: Record<string, UserMemory> = {};