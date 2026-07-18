import XLSX from "xlsx";

const workbook = XLSX.readFile("./excels/AGRARIO.xlsx");

const sheet = workbook.Sheets[workbook.SheetNames[0]];

const rows = XLSX.utils.sheet_to_json(sheet, {
    range: 1,
});

console.log(`Total registros: ${rows.length}`);
console.log(Object.keys(rows[0] as any));