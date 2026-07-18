import { Pool } from "pg";

export async function importarLote(
    pool: Pool,
    tabla: string,
    columnas: string[],
    datos: any[],
    tamanoLote = 200,
    columnaConflicto?: string
) {
    let total = 0;

    for (let i = 0; i < datos.length; i += tamanoLote) {

        const lote = datos.slice(i, i + tamanoLote);

        const values: any[] = [];
        const placeholders: string[] = [];

        lote.forEach((fila, filaIndex) => {

            const params = columnas.map((_, colIndex) =>
                `$${filaIndex * columnas.length + colIndex + 1}`
            );

            placeholders.push(`(${params.join(",")})`);

            columnas.forEach((col) => {
                values.push(fila[col]);
            });
        });

        let sql = `
            INSERT INTO ${tabla} (${columnas.join(",")})
            VALUES ${placeholders.join(",")}
        `;

        if (columnaConflicto) {
            sql += `
                ON CONFLICT (${columnaConflicto})
                DO NOTHING
            `;
        }

        await pool.query(sql, values);

        total += lote.length;

        console.log(`✅ ${total}/${datos.length} registros procesados`);
    }

    console.log(`🎉 Importación finalizada (${total} registros)`);
}