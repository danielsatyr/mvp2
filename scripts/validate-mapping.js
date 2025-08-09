// scripts/validate-mapping.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function mustBeBoolean(v) {
  return typeof v === 'boolean';
}

(async () => {
  const sample = await prisma.occupation.findMany({ take: 50 });
  const problems = [];

  for (const o of sample) {
    if (!o.occupationId || typeof o.occupationId !== 'string') {
      problems.push(`occupationId inválido en id=${o.id}`);
    }

    [
      ['subclass190', o.subclass190],
      ['subclass189Pt', o.subclass189Pt],
      ['subclass186', o.subclass186],
      ['subclass491St', o.subclass491St],
      ['subclass491F', o.subclass491F],
      ['subclass494', o.subclass494],
      ['subclass482', o.subclass482],
      ['subclass407', o.subclass407],
      ['subclass485', o.subclass485],
      ['mltsslFlag', o.mltsslFlag],
      ['stsolFlag', o.stsolFlag],
      ['rolFlag', o.rolFlag],
    ].forEach(([k, v]) => {
      if (!mustBeBoolean(v)) problems.push(`${k} no es boolean en id=${o.id} (valor=${String(v)})`);
    });

    if (o.skillLevelRequired != null && typeof o.skillLevelRequired !== 'string') {
      problems.push(`skillLevelRequired no es string|null en id=${o.id}`);
    }
  }

  if (problems.length) {
    console.error('❌ Inconsistencias detectadas:');
    for (const p of problems) console.error(' -', p);
    process.exit(1);
  } else {
    console.log('✅ Datos OK: mapeos y tipos coherentes en la muestra.');
  }

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
