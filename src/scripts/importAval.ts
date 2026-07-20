import XLSX from "xlsx";
import { pool } from "../provider/database";
import { importarLote } from "../utils/importarLote";

// Leer Excel
const workbook = XLSX.readFile("./excels/AVAL.xlsx");

// Primera hoja
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Leer desde la fila 2
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
    estado: limpio["ESTADO"],
    nura: limpio["NURA"],
    nit: limpio["NIT"],
    empresa: limpio["EMPRESA"],
    convenio: limpio["CONVENIO"],
    sigla: limpio["SIGLA"],
    categoria: limpio["CATEGORIA"],
    descripcion_recaudo:
      !limpio["DESCRIPCION RECAUDO"] || limpio["DESCRIPCION RECAUDO"] === "."
        ? "SIN DESCRIPCION"
        : limpio["DESCRIPCION RECAUDO"],
    dato_captura: limpio["DATO CAPTURA"],
    modalidad: limpio["MODALIDAD"],
    longitud_referencia: limpio["LONGITUD DE REFERENCIA"],
    ciudad: limpio["CIUDAD"],
    departamento: limpio["DEPARTAMENTO"],
    modalidad_captura: limpio["MODALIDAD CAPTURA"],
    valida_fecha_vencimiento: limpio["VALIDA FECHA VENCIMIENTO"],
    recibe_pagos_parciales: limpio["RECIBE PAGOS PARCIALES"],
    monto: limpio["MONTO"],
    banco_dueno: limpio["BANCO DUEÑO"],
  };
});

const columnas = [
  "estado",
  "nura",
  "nit",
  "empresa",
  "convenio",
  "sigla",
  "categoria",
  "descripcion_recaudo",
  "dato_captura",
  "modalidad",
  "longitud_referencia",
  "ciudad",
  "departamento",
  "modalidad_captura",
  "valida_fecha_vencimiento",
  "recibe_pagos_parciales",
  "monto",
  "banco_dueno",
];

console.log(datos[0]);

async function importar() {
  await importarLote(
    pool, 
    "aval", 
    columnas, 
    datos, 
    200
);
  await pool.end();
}

importar().catch(console.error);
