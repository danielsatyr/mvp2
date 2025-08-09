// scripts/compare-excel-vs-db.js
// Uso:
//   node scripts/compare-excel-vs-db.js data/occupations.xlsx --sheet=Occupations --csv=diffs.csv
//
// Compara Excel vs SQLite (Prisma) por occupationId y reporta:
// - faltantes en BD
// - sobrantes en BD
// - diferencias de campos
//
// Salida no-cero si encuentra diferencias.

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const COLMAP = {
  // Excel -> Prisma
  'occupation_id': 'occupationId',
  'name': 'name',
  'anzsco_code': 'anzscoCode',
  'skill_assessment_body': 'skillAssessmentBody',

  'mltssl_flag': 'mltsslFlag',
  'stsol_flag': 'stsolFlag',
  'rol_flag': 'rolFlag',

  '190': 'subclass190',
  '189 (PT)': 'subclass189Pt',
  '186': 'subclass186',
  '491(S/T)': 'subclass491St',
  '491 (F)': 'subclass491F',
  '494': 'subclass494',
  '482': 'subclass482',
  '407': 'subclass407',
  '485': 'subclass485',

  'Skill_Level_Required': 'skillLevelRequired',
};

// Campos a comparar (ajusta si quieres comparar menos/más)
const FIELDS_STRING = [
  'occupationId',
  'name',
  'anzscoCode',
  'skillAssessmentBody',
  'skillLevelRequired',
];

const FIELDS_BOOLEAN = [
  'mltsslFlag',
  'stsolFlag',
  'rolFlag',
  'subclass190',
  'subclass189Pt',
  'subclass186',
  'subclass491St',
  'subclass491F',
  'subclass494',
  'subclass482',
  'subclass407',
  'subclass485',
];

function toBool(v) {
  if (v === true || v === false) return v;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ['1', 'y', 'yes', 'true', 't', 'x', '✔', 'si', 'sí'].includes(s);
}

function readSheet(filePath, sheetName) {
  const wb = xlsx.readFile(filePath);
  const name = sheetName || wb.SheetNames[0];
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`Hoja "${name}" no encontrada. Hojas: ${wb.SheetNames.join(', ')}`);
  const rows = xlsx.utils.sheet_to_json(ws, { defval: null });
  return rows;
}

// Normaliza una fila de Excel a la forma Prisma (solo campos mapeados)
function normalizeExcelRow(row) {
  const out = {};
  for (const [excelCol, prismaField] of Object.entries(COLMAP)) {
    const v = row[excelCol];

    if (FIELDS_BOOLEAN.includes(prismaField)) {
      out[prismaField] = toBool(v);
    } else if (prismaField === 'occupationId') {
      out[prismaField] = v == null ? '' : String(v).trim(); // clave
    } else if (prismaField === 'skillLevelRequired') {
      out[prismaField] = v == null ? null : String(v).trim();
    } else {
      out[prismaField] = v == null ? '' : String(v).trim();
    }
  }
  return out;
}

function toMapByOccupationId(list) {
  const map = new Map();
  for (const item of list) {
    if (!item.occupationId) continue;
    map.set(item.occupationId, item);
  }
  return map;
}

function diffRecord(excelObj, dbObj) {
  const diffs = [];
  for (const f of FIELDS_STRING) {
    const e = excelObj[f] ?? null;
    const d = dbObj[f] ?? null;
    if (e !== d) diffs.push({ field: f, excel: e, db: d });
  }
  for (const f of FIELDS_BOOLEAN) {
    const e = !!excelObj[f];
    const d = !!dbObj[f];
    if (e !== d) diffs.push({ field: f, excel: e, db: d });
  }
  return diffs;
}

async function main() {
  try {
    const fileArg = process.argv[2];
    const sheetArg = process.argv.find((a) => a.startsWith('--sheet='))?.split('=')[1];
    const csvArg = process.argv.find((a) => a.startsWith('--csv='))?.split('=')[1];

    if (!fileArg) {
      console.error('Uso: node scripts/compare-excel-vs-db.js <ruta.xlsx> [--sheet=Occupations] [--csv=diffs.csv]');
      process.exit(1);
    }

    const filePath = path.resolve(process.cwd(), fileArg);
    if (!fs.existsSync(filePath)) {
      console.error(`Archivo no encontrado: ${filePath}`);
      process.exit(1);
    }

    // Leer Excel
    const rawRows = readSheet(filePath, sheetArg);
    const excelRows = rawRows.map(normalizeExcelRow);
    const excelMap = toMapByOccupationId(excelRows);

    // Leer BD
    const dbRows = await prisma.occupation.findMany({
      select: Object.fromEntries(
        [...FIELDS_STRING, ...FIELDS_BOOLEAN].map((k) => [k, true])
      ),
    });
    const dbMap = toMapByOccupationId(dbRows);

    // Comparar claves
    const missingInDb = [];
    const extraInDb = [];
    const diffs = [];

    for (const id of excelMap.keys()) {
      if (!dbMap.has(id)) missingInDb.push(id);
    }
    for (const id of dbMap.keys()) {
      if (!excelMap.has(id)) extraInDb.push(id);
    }

    // Comparar campos
    for (const [id, ex] of excelMap.entries()) {
      if (!dbMap.has(id)) continue;
      const db = dbMap.get(id);
      const d = diffRecord(ex, db);
      if (d.length) diffs.push({ occupationId: id, differences: d });
    }

    // Reporte
    console.log('--- Comparación Excel vs BD ---');
    console.log(`Excel filas: ${excelRows.length}`);
    console.log(`BD filas:    ${dbRows.length}`);
    console.log(`Faltan en BD: ${missingInDb.length}`);
    console.log(`Sobrantes en BD: ${extraInDb.length}`);
    console.log(`Registros con diferencias: ${diffs.length}`);

    if (missingInDb.length) {
      console.log('\nFALTAN EN BD (primeros 20):');
      console.log(missingInDb.slice(0, 20));
    }
    if (extraInDb.length) {
      console.log('\nSOBRAN EN BD (primeros 20):');
      console.log(extraInDb.slice(0, 20));
    }

    if (diffs.length) {
      console.log('\nDIFERENCIAS (primeros 3 registros):');
      for (const item of diffs.slice(0, 3)) {
        console.log(`- ${item.occupationId}`);
        for (const f of item.differences) {
          console.log(`   • ${f.field}: Excel=${f.excel} | DB=${f.db}`);
        }
      }
    }

    // Exportar CSV opcional
    if (csvArg) {
      const lines = ['occupationId,field,excel,db'];
      for (const item of diffs) {
        for (const f of item.differences) {
          const esc = (x) =>
            x === null || x === undefined
              ? ''
              : String(x).replace(/"/g, '""');
          lines.push(
            `"${item.occupationId}","${f.field}","${esc(f.excel)}","${esc(f.db)}"`
          );
        }
      }
      fs.writeFileSync(path.resolve(process.cwd(), csvArg), lines.join('\n'), 'utf8');
      console.log(`\nCSV de diferencias generado: ${csvArg}`);
    }

    // Exit code
    const hasIssues = missingInDb.length || extraInDb.length || diffs.length;
    await prisma.$disconnect();
    process.exit(hasIssues ? 2 : 0);
  } catch (e) {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
