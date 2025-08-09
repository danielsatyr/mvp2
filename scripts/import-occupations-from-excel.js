// scripts/import-occupations-from-excel.js
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Normaliza valores "booleanos" que vienen de Excel como 1/0, Y/N, TRUE/FALSE, Yes/No, strings con espacios, etc.
 */
function toBool(v) {
  if (v === true || v === false) return v;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ['1', 'y', 'yes', 'true', 't', 'x', '✔', 'si', 'sí'].includes(s);
}

/**
 * Lee un Excel y devuelve filas como objetos JS
 */
function readSheet(filePath, sheetName) {
  const wb = xlsx.readFile(filePath);
  const name = sheetName || wb.SheetNames[0];
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`Hoja "${name}" no encontrada. Hojas: ${wb.SheetNames.join(', ')}`);
  const rows = xlsx.utils.sheet_to_json(ws, { defval: null });
  return rows;
}

/**
 * Mapeo de columnas de Excel -> campos Prisma (respetando tus @map del schema)
 * Ajusta los nombres de la izquierda EXACTAMENTE a como están en el Excel.
 */
const COLMAP = {
  // columnas "clave/base"
  'occupation_id': 'occupationId',
  'name': 'name',
  'anzsco_code': 'anzscoCode',
  'skill_assessment_body': 'skillAssessmentBody',

  // listas
  'mltssl_flag': 'mltsslFlag',
  'stsol_flag': 'stsolFlag',
  'rol_flag': 'rolFlag',

  // subclases (nombres EXACTOS del Excel)
  '190': 'subclass190',
  '189 (PT)': 'subclass189Pt',
  '186': 'subclass186',
  '491(S/T)': 'subclass491St',
  '491 (F)': 'subclass491F',
  '494': 'subclass494',
  '482': 'subclass482',
  '407': 'subclass407',
  '485': 'subclass485',

  // otros
  'Skill_Level_Required': 'skillLevelRequired',
};

/**
 * Convierte una fila del Excel en el payload para Prisma
 */
function mapRow(row) {
  const payload = {};

  for (const [excelCol, prismaField] of Object.entries(COLMAP)) {
    const v = row[excelCol];

    // booleans
    if (
      [
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
      ].includes(prismaField)
    ) {
      payload[prismaField] = toBool(v);
      continue;
    }

    // strings (occupationId, name, etc.)
    if (prismaField === 'occupationId') {
      // Asegura string (ANZSCO puede traer ceros a la izquierda)
      payload[prismaField] = v == null ? '' : String(v).trim();
      continue;
    }

    if (prismaField === 'skillLevelRequired') {
      payload[prismaField] = v == null ? null : String(v).trim();
      continue;
    }

    // por defecto, trata como string
    payload[prismaField] = v == null ? '' : String(v).trim();
  }

  return payload;
}

/**
 * Insert/update por occupationId (unique)
 */
async function upsertRow(payload, dryRun = true) {
  const { occupationId, ...data } = payload;
  if (!occupationId) {
    console.warn('Fila sin occupation_id — se omite');
    return { skipped: true };
  }

  if (dryRun) {
    console.log('[dry-run] upsert', occupationId, data);
    return { dryRun: true };
  }

  const result = await prisma.occupation.upsert({
    where: { occupationId },
    update: data,
    create: { occupationId, ...data },
  });
  return { id: result.id, occupationId: result.occupationId };
}

async function main() {
  const fileArg = process.argv[2];
  const sheetArg = process.argv.find((a) => a.startsWith('--sheet='))?.split('=')[1];
  const dryArg = process.argv.find((a) => a.startsWith('--dry='))?.split('=')[1];

  if (!fileArg) {
    console.error('Uso: node scripts/import-occupations-from-excel.js <ruta.xlsx> [--sheet=Occupations] [--dry=true|false]');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`Archivo no encontrado: ${filePath}`);
    process.exit(1);
  }

  const dryRun = dryArg ? dryArg.toLowerCase() !== 'false' : true;

  console.log(`Leyendo Excel: ${filePath} ${sheetArg ? `(sheet=${sheetArg})` : ''} dry-run=${dryRun}`);
  const rows = readSheet(filePath, sheetArg);

  // validación mínima de headers
  const required = ['occupation_id', 'name', 'anzsco_code', 'skill_assessment_body'];
  const missing = required.filter((k) => !(k in rows[0]));
  if (missing.length) {
    console.warn('Advertencia: faltan columnas esperadas en Excel:', missing);
  }

  // procesa en lotes
  let ok = 0,
    skip = 0;
  for (const row of rows) {
    const payload = mapRow(row);
    const res = await upsertRow(payload, dryRun);
    if (res?.skipped) skip++;
    else ok++;
  }

  console.log(`Listo. Procesadas: ${rows.length}, upserts: ${ok}, omitidas: ${skip}, dry-run=${dryRun}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });