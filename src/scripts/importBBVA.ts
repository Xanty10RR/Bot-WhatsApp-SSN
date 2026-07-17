import XLSX from 'xlsx';
import { pool } from '../provider/database';

const workbook = XLSX.readFile('./excels/BBVA.xlsx');

const sheet = workbook.Sheets[workbook.SheetNames[0]];

const data = XLSX.utils.sheet_to_json(sheet, {
    range: 1
});

console.log(`Total registros: ${data.length}`);
console.log(data[0]);

const datos = rows.map((row: any) => {
    const limpio: any = {};

    Object.keys(row).forEach((key) => {
        limpio[key.trim()] = row[key];
    });

    return limpio;
});