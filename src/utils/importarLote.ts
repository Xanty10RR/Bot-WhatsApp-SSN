import { Pool } from "pg";

export async function importarLote(
    pool: Pool,
    tabla: string,
    columnas: string[],
    datos: any[],
    tamanoLote = 200
) {
    let total = 0;

    for (let i = 0; i < datos.length; i += tamanoLote) {

        const lote = datos.slice(i, i + tamanoLote);

        const values: any[] = [];
        const placeholders: string[] = [];

        lote.forEach((fila, filaIndex) => {

            const params = columnas.map((_, colIndex) => {
                return `$${filaIndex * columnas.length + colIndex + 1}`;
            });

            placeholders.push(`(${params.join(",")})`);

            columnas.forEach((col) => {
                values.push(fila[col]);
            });
        });

        await pool.query(
            `
            INSERT INTO ${tabla} (${columnas.join(",")})
            VALUES ${placeholders.join(",")}

            ON CONFLICT (codigo_convenio)
            DO NOTHING;
            `,
            values
        );

        total += lote.length;

        console.log(`✅ ${total}/${datos.length} registros procesados`);
    }

    console.log(`🎉 Importación finalizada (${total} registros)`);
}