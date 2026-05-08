const XLSX = require('xlsx');
const workbook = XLSX.readFile('Products_Export_30-04-2026==.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);
console.log(JSON.stringify(data.slice(0, 3), null, 2));
