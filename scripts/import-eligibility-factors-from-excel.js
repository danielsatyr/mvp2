// scripts/import-eligibility-factors-from-excel.js
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
 * Convierte strings a números (enteros o decimales). Si no es numérico, devuelve null.
 */
function toNumber(v) {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  if (!s || s === '-') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
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
  // columnas base
  'state_occ_id': 'stateOccId',
  'state_id': 'state',
  'ANZSCO Code': 'anzscoCode', // también se usará para occupationId
  'Occupation': 'occupationName',
  'Attribute': 'visa',
  'Value': 'valueRaw',
  'Prefix': 'pathway',

  // Streams
  'Streams.min_points_state': 'minPointsState',
  'Streams.stream': 'streamName',
  'Streams.visa_190_flag': 'visa190Flag',
  'Streams.visa_491_flag': 'visa491Flag',
  'Streams.work_experience_state': 'workExperienceState',
  'Streams.work_experience_state_years': 'workExperienceStateYears',
  'Streams.work_experience_overseas_years': 'workExperienceOverseasYears',
  'Streams.work_experience_description': 'workExperienceDescription',
  'Streams.study_in_state_required': 'studyInStateRequired',
  'Streams.study_time_state_required': 'studyTimeStateRequired',
  'Streams.study_in_state_level': 'studyInStateLevel',
  'Streams.job_offer_required': 'jobOfferRequired',
  'Streams.english_level_required': 'englishLevelRequired',
  'Streams.regional_study_bonus': 'regionalStudyBonus',
  'Streams.family_sponsorship': 'familySponsorship',
  'Streams.family_sponsorship_state_location': 'familySponsorshipStateLoc',
  'Streams.residency_requirement': 'residencyRequirement',
  'Streams.offshore_condition': 'offshoreCondition',
  'Streams.sector_critical': 'sectorCritical',
  'Streams.finantial_capacity': 'financialCapacity',
  'Streams.finantial_capacity_value': 'financialCapacityValue',
  'Streams.other_requirement': 'otherRequirement',

  // otros
  offshore: 'offshore',
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
        'studyInStateRequired',
        'visa190Flag',
        'visa491Flag',
        'workExperienceState',
        'jobOfferRequired',
        'regionalStudyBonus',
        'familySponsorship',
        'sectorCritical',
        'financialCapacity',
        'offshore',
      ].includes(prismaField)
    ) {
      payload[prismaField] = toBool(v);
      continue;
    }

    // números
    if (
      [
        'minPointsState',
        'workExperienceStateYears',
        'workExperienceOverseasYears',
        'studyTimeStateRequired',
      ].includes(prismaField)
    ) {
      payload[prismaField] = toNumber(v);
      continue;
    }

    // strings
    if (v == null) {
      payload[prismaField] = null;
    } else {
      payload[prismaField] = String(v).trim();
    }
  }

  // occupationId = ANZSCO Code
  const code = row['ANZSCO Code'];
  payload.occupationId = code == null ? '' : String(code).trim();
  payload.anzscoCode = payload.occupationId;

  return payload;
}

/**
 * Insert/update por (occupationId, visa, state)
 */
async function upsertRow(payload, dryRun = true) {
  const { occupationId, visa, state, ...data } = payload;
  if (!occupationId || !visa || !state) {
    console.warn('Fila sin occupationId/visa/state — se omite');
    return { skipped: true };
  }

  if (dryRun) {
    console.log('[dry-run] upsert', occupationId, visa, state, data);
    return { dryRun: true };
  }

  await prisma.eligibilityFactors.deleteMany({ where: { occupationId, visa, state } });
  const result = await prisma.eligibilityFactors.create({
    data: { occupationId, visa, state, ...data },
  });
  return { id: result.id, occupationId: result.occupationId };
}

async function main() {
  const fileArg = process.argv[2];
  const sheetArg = process.argv.find((a) => a.startsWith('--sheet='))?.split('=')[1];
  const dryArg = process.argv.find((a) => a.startsWith('--dry='))?.split('=')[1];

  if (!fileArg) {
    console.error('Uso: node scripts/import-eligibility-factors-from-excel.js <ruta.xlsx> [--sheet=Eligibility_Factors] [--dry=true|false]');
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
  const required = ['state_occ_id', 'state_id', 'ANZSCO Code', 'Attribute'];
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
