// lib/eligibility.js

/**
 * data: { nombre, edad, ingles, occupation }
 * occupations: array de { occupationId, name, skillAssessmentBody, mltsslFlag, stsolFlag,
 *                        rolFlag, subclass190, subclass189Pt, subclass186, subclass491St, subclass491F }
 */
export function calculatePathways(data, occupations) {
  const { edad, ingles, occupation: selectedId } = data;

  // 1) Calcular puntos base
  let points = 0;
  const age = Number(edad);
  if (age >= 25 && age <= 32) points += 30;
  if (ingles === 'Superior') points += 20;
  else if (ingles === 'Proficient') points += 10;

  // 2) Umbrales mínimos para cada visa
  const thresholds = {
    '190': 65,
    '189 (PT)': 60,
    '186': 60,
    '491(S/T)': 65,
    '491 (F)': 65
  };

  // 3) Nombre del campo booleano correspondiente
  const flagProps = {
    '190':          'subclass190',
    '189 (PT)':     'subclass189Pt',
    '186':          'subclass186',
    '491(S/T)':     'subclass491St',
    '491 (F)':      'subclass491F'
  };

  // 4) Buscar la ocupación seleccionada
  const occ = occupations.find(o => o.occupationId === selectedId);
  if (!occ) {
    // Si no existe, devolvemos vacío para no romper la API
    return [];
  }

  // 5) Generar pathways según flags y puntos
  const pathways = [];
  for (const [code, prop] of Object.entries(flagProps)) {
    // Si la ocupación está en esa lista Y cumple los puntos mínimos
    if (occ[prop] && points >= thresholds[code]) {
      pathways.push({
        code,                                 // e.g. '190'
        description: `${code} visa – ${occ.name}`,
        requiredPoints: thresholds[code]      // e.g. 65
      });
    }
  }

  return pathways;
}
