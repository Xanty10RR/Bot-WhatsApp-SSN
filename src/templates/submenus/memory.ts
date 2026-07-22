export interface MemoryData {
    texto: string;
    coincidencias: any[];
    sugerencia?: string;
}

export const memory: Record<string, MemoryData> = {};