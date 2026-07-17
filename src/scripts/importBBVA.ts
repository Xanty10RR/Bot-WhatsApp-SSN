import XLSX from "xlsx";
import { pool } from "../provider/database";

// Leer archivo excel bbva
const workbook = XLSX.readFile("./excels/BBVA.xlsx");

// Primera hoja
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Leer desde la fila 2
const rows = XLSX.utils.sheet_to_json(sheet, {
  range: 1,
});

console.log(`Total registros: ${rows.length}`);

// Limpiar espacios de los encabezados
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
      codigo_convenio: row["codigo convenio"],
      nombre_convenio: row["Nombre"],
      nit: row["NIT"],
      que_se_recauda: row["Que se recauda"],
      categoria: row["Categoria"],
      tipo_captura: row["Tipo de Captura"],
      ubicacion: row["UBICACIÓN"],
      referencias: row["REFERENCIAS"],
      forma_consulta:
        row[
          "FORMA CONSULTA DATOS (WEB SERVICE (W) BASE DE DATOS (S) O NO CONSULTA (N)"
        ],
    };

    await pool.query(
      `
      INSERT INTO bbva (
        codigo_convenio,
        nombre_convenio,
        nit,
        que_se_recauda,
        categoria,
        tipo_captura,
        ubicacion,
        referencias,
        forma_consulta
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)

      ON CONFLICT (codigo_convenio)
      DO NOTHING;
      `,
      [
        registro.codigo_convenio,
        registro.nombre_convenio,
        registro.nit,
        registro.que_se_recauda,
        registro.categoria,
        registro.tipo_captura,
        registro.ubicacion,
        registro.referencias,
        registro.forma_consulta,
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