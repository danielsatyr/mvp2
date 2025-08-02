// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';

const prisma = new PrismaClient();

// Convierte valores a booleano según tu Excel ("Y", "Yes", "TRUE", 1)
const toBoolean = (v) => {
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ['y','yes','true','1'].includes(s);
};

async function main() {
  // 1. Lee el fichero Excel
  const wb    = xlsx.readFile('data/occupations.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows  = xlsx.utils.sheet_to_json(sheet);

  console.log(`Sembrando ${rows.length} registros…`);
  
  // 2. Inserta o actualiza cada fila
  for (const row of rows) {
    await prisma.occupation.upsert({
      where: { occupationId: String(row.occupation_id) },
      update: {
        name:                String(row.name),
        anzscoCode:          String(row.anzsco_code),
        skillAssessmentBody: String(row.skill_assessment_body),
        mltsslFlag:          toBoolean(row.mltssl_flag),
        stsolFlag:           toBoolean(row.stsol_flag),
        rolFlag:             toBoolean(row.rol_flag),
        subclass190:         toBoolean(row['190']),
        subclass189Pt:       toBoolean(row['189 (PT)']),
        subclass186:         toBoolean(row['186']),
        subclass491St:       toBoolean(row['491(S/T)']),
        subclass491F:        toBoolean(row['491 (F)']),
      },
      create: {
        occupationId:        String(row.occupation_id),
        name:                String(row.name),
        anzscoCode:          String(row.anzsco_code),
        skillAssessmentBody: String(row.skill_assessment_body),
        mltsslFlag:          toBoolean(row.mltssl_flag),
        stsolFlag:           toBoolean(row.stsol_flag),
        rolFlag:             toBoolean(row.rol_flag),
        subclass190:         toBoolean(row['190']),
        subclass189Pt:       toBoolean(row['189 (PT)']),
        subclass186:         toBoolean(row['186']),
        subclass491St:       toBoolean(row['491(S/T)']),
        subclass491F:        toBoolean(row['491 (F)']),
      },
    });
  }

  console.log('✅ Seed completado');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });