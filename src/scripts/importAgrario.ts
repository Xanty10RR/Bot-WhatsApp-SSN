import XLSX from "xlsx";
import { pool } from "../provider/database";
import { importarLote } from "../utils/importarLote";

// Leer archivo excel agrario
const workbook = XLSX.readFile("./excels/AGRARIO.xlsx");

// Primera hoja
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Leer datos
const rows = XLSX.utils.sheet_to_json(sheet, {
    range: 1,
    raw: false,
});

console.log(`Total registros: ${rows.length}`);

// Limpiar encabezados
const datos = (rows as any[]).map((row) => {
    const limpio: any = {};

    Object.keys(row).forEach((key) => {
        const nuevaKey = key
            .replace(/\u00A0/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        limpio[nuevaKey] = row[key];
    });

    return {
        codigo_convenio: limpio["CODIGO"],
        nombre_convenio: limpio["Nombre Convenio"],
        nit_convenio: limpio["Nit Convenio"],
        referencia: limpio["Referencia"],
        tipo_referencia: limpio["Tipo Referencia"],
        longitud_referencia: limpio["Longitud Referencia"],
        codigo_barras: limpio["Codigo Barras"],
        valida_fecha: limpio["Valida Fecha"],
        manual: limpio["Manual"],
    };
});

async function importar() {
    await importarLote(
        pool,
        "agrario",
        [
            "codigo_convenio",
            "nombre_convenio",
            "nit_convenio",
            "referencia",
            "tipo_referencia",
            "longitud_referencia",
            "codigo_barras",
            "valida_fecha",
            "manual",
        ],
        datos,
        200
    );

    await pool.end();
}

importar().catch(console.error);