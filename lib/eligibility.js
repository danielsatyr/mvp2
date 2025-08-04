// lib/eligibility.js
export function calculatePathways(data, occupations) {
  const { edad, ingles, occupation: selectedId, overseasExp, australianExp } = data;

  // Cálculo detallado de puntos
  const breakdown = {
    age: 0,
    english: 0,
    overseas: 0,
    australian: 0
  };

  const ageNum = Number(edad);
  if (ageNum >= 18 && ageNum < 25) breakdown.age = 25;
  else if (ageNum >= 25 && ageNum < 33) breakdown.age = 30;
  else if (ageNum >= 33 && ageNum < 40) breakdown.age = 25;
  else if (ageNum >= 40 && ageNum < 45) breakdown.age = 15;

  if (ingles === 'Superior') breakdown.english = 20;
  else if (ingles === 'Proficient') breakdown.english = 10;
  // Competent → 0

  const overYears = Number(overseasExp);
  if (overYears >= 8) breakdown.overseas = 15;
  else if (overYears >= 5) breakdown.overseas = 10;
  else if (overYears >= 3) breakdown.overseas = 5;
  // <3 → 0

  const ausYears = Number(australianExp);
  if (ausYears >= 8) breakdown.australian = 20;
  else if (ausYears >=5 && ausYears <8) breakdown.australian = 15;
  else if (ausYears >= 3) breakdown.australian = 10;
  else if (ausYears >= 1) breakdown.australian = 5;
  // <1 → 0

  // Total de puntos
  const points = breakdown.age + breakdown.english + breakdown.overseas + breakdown.australian;

  // Umbrales y flags para visas
  const thresholds = { '190':65, '189 (PT)':60, '186':60, '491(S/T)':65, '491 (F)':65 };
  const flagProps = { '190':'subclass190','189 (PT)':'subclass189Pt','186':'subclass186','491(S/T)':'subclass491St','491 (F)':'subclass491F' };

  const occ = occupations.find(o => o.occupationId === selectedId);
  const pathways = [];
  if (occ) {
    for (const [code, prop] of Object.entries(flagProps)) {
      if (occ[prop] && points >= thresholds[code]) {
        pathways.push({ code, description:`${code} visa – ${occ.name}`, requiredPoints: thresholds[code] });
      }
    }
  }

  return { points, breakdown, pathways };
}