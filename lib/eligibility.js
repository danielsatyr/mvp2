// lib/eligibility.js

/**
 * data: objeto con los campos del formulario
 * occupations: lista de códigos y requisitos de la DB
 */
export function calculatePathways(data, occupations) {
  const { edad, ingles /*, …*/ } = data;

  // Ejemplo muy simplificado
  let points = 0;
  if (Number(edad) >= 25 && Number(edad) <= 32) points += 30;
  if (ingles === 'Superior')              points += 20;
  else if (ingles === 'Proficient')       points += 10;

  // Encontrar ocupaciones elegibles según puntos
  const eligible = occupations.filter(o => points >= o.minPoints);

  // Devuelve un array de pathways sugeridos
  return eligible.map(o => ({
    code: o.code,
    description: o.description,
    requiredPoints: o.minPoints
  }));
}