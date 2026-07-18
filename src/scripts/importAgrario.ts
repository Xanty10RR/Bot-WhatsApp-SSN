import XLSX from "xlsx";
import { pool } from "../provider/database";

// Leer archivo
const workbook = XLSX.readFile("./excels/AGRARIO.xlsx");

// Primera hoja
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Leer desde la fila 2
const rows = XLSX.utils.sheet_to_json(sheet, {
    range: 1,
});

console.log(`Total registros: ${rows.length}`);

// Limpiar encabezados
const datos = (rows as any[]).map((row) => {
    const limpio: any = {};

    Object.keys(row).forEach((key) => {
        limpio[key.trim()] = row[key];
    });

    return limpio;
});

async function importar() {

    let contador = 0;

    for (const row of datos) {

        const registro = {
            codigo_convenio: row["CODIGO"],
            nombre_convenio: row["Nombre Convenio"],
            nit_convenio: row["Nit Convenio"],
            referencia: row["Referencia"],
            tipo_referencia: row["Tipo Referencia"],
            longitud_referencia: row["Longitud Referencia"],
            codigo_barras: row["Codigo Barras"],
            valida_fecha: row["Valida Fecha"],
            manual: row["Manual"],
        };

        await pool.query(
            `
            INSERT INTO agrario(
                codigo_convenio,
                nombre_convenio,
                nit_convenio,
                referencia,
                tipo_referencia,
                longitud_referencia,
                codigo_barras,
                valida_fecha,
                manual
            )

            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)

            ON CONFLICT (codigo_convenio)
            DO NOTHING;
            `,
            [
                registro.codigo_convenio,
                registro.nombre_convenio,
                registro.nit_convenio,
                registro.referencia,
                registro.tipo_referencia,
                registro.longitud_referencia,
                registro.codigo_barras,
                registro.valida_fecha,
                registro.manual,
            ]
        );

        contador++;

        if (contador % 500 === 0) {
            console.log(`✅ ${contador} registros procesados`);
        }
    }

    console.log(`🎉 Se procesaron ${contador} registros`);

    await pool.end();
}

importar().catch(console.error);