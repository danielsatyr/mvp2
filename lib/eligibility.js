// lib/eligibility.js
export function calculatePathways(data, occupations) {
  const {
    edad,
    ingles,
    occupation: selectedId,
    overseasExp,
    australianExp,
    eduQualification,
    specialistQualification,
    australianStudy,
    regionalStudy,
    professionalYear,
    communityLanguage,
    partnerSkill,
    nominationType,
  } = data;

  // 1) Puntos por edad
  let points = 0;
  const ageNum = Number(edad);
  if (ageNum >= 18 && ageNum < 25) points += 25;
  else if (ageNum >= 25 && ageNum < 33) points += 30;
  else if (ageNum >= 33 && ageNum < 40) points += 25;
  else if (ageNum >= 40 && ageNum < 45) points += 15;

  // 2) Puntos por inglés
  if (ingles === "Superior") points += 20;
  else if (ingles === "Proficient") points += 10;

  // 3) Puntos por experiencia
  const ovExp = Number(overseasExp);
  if (ovExp >= 8) points += 15;
  else if (ovExp >= 5) points += 10;
  else if (ovExp >= 3) points += 5;

  const ausExp = Number(australianExp);
  if (ausExp >= 8) points += 20;
  else if (ausExp >= 5) points += 15;
  else if (ausExp >= 3) points += 10;
  else if (ausExp >= 1) points += 5;

  // 4) Puntos por estudios
  const eduPointsMap = {
    doctorate: 20,
    bachelor: 15,
    diploma: 10,
    assessed: 10,
    none: 0,
  };
  const eduPts = eduPointsMap[eduQualification] || 0;
  points += eduPts;

  // 5) Specialist education
  if (
    specialistQualification === "master_research" ||
    specialistQualification === "doctoral_research"
  ) {
    points += 10;
  }

  // 6) Australian study requirement
  if (australianStudy === "yes") points += 5;

  // 7) Regional Australia study
  if (regionalStudy === "yes") points += 5;

  // 8) Professional Year
  if (professionalYear === "yes") points += 5;

  // 9) Community language
  if (communityLanguage === "yes") points += 5;

  // 10) Partner skills
  const partnerMap = {
    meets_all: 10,
    competent_english: 5,
    single_or_au_partner: 10,
  };
  const partnerPts = partnerMap[partnerSkill] || 0;
  points += partnerPts;

  // 11) Nomination or sponsorship
  const nominationMap = {
    state: 15,
    family: 15,
    none: 0,
  };
  const nominationPts = nominationMap[nominationType] || 0;
  points += nominationPts;

  // 12) Crear breakdown
  const breakdown = {
    age:
      ageNum >= 18 && ageNum < 25
        ? 25
        : ageNum >= 25 && ageNum < 33
          ? 30
          : ageNum >= 33 && ageNum < 40
            ? 25
            : ageNum >= 40 && ageNum < 45
              ? 15
              : 0,
    english: ingles === "Superior" ? 20 : ingles === "Proficient" ? 10 : 0,
    overseas: ovExp >= 8 ? 15 : ovExp >= 5 ? 10 : ovExp >= 3 ? 5 : 0,
    australian:
      ausExp >= 8
        ? 20
        : ausExp >= 5
          ? 15
          : ausExp >= 3
            ? 10
            : ausExp >= 1
              ? 5
              : 0,
    education: eduPts,
    specialist:
      specialistQualification === "master_research" ||
      specialistQualification === "doctoral_research"
        ? 10
        : 0,
    study: australianStudy === "yes" ? 5 : 0,
    regionalStudy: regionalStudy === "yes" ? 5 : 0,
    professionalYear: professionalYear === "yes" ? 5 : 0,
    communityLanguage: communityLanguage === "yes" ? 5 : 0,
    partner: partnerPts,
    nomination: nominationPts,
  };

  // 13) Filtrar pathways como antes
  const thresholds = {
    190: 65,
    "189 (PT)": 60,
    186: 60,
    "491(S/T)": 65,
    "491 (F)": 65,
  };
  const flagProps = {
    190: "subclass190",
    "189 (PT)": "subclass189Pt",
    186: "subclass186",
    "491(S/T)": "subclass491St",
    "491 (F)": "subclass491F",
  };
  const occ = occupations.find((o) => o.occupationId === selectedId);
  const pathways = [];
  if (occ) {
    for (const [code, prop] of Object.entries(flagProps)) {
      if (occ[prop] && points >= thresholds[code]) {
        pathways.push({
          code,
          description: `${code} visa – ${occ.name}`,
          requiredPoints: thresholds[code],
        });
      }
    }
  }

  return { points, breakdown, pathways };
}
