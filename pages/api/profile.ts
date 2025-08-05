// pages/api/profile.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import * as cookie from 'cookie';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Claves exactas que envía el formulario
type ProfilePayload = {
  visaSubclass: '491' | '190' | '189';
  age: number;
  englishLevel: 'Competent' | 'Proficient' | 'Superior';
  workExperience_out: number;
  workExperience_in: number;
  occupation: string;
  nationality?: string;
  education_qualification: 'doctorate' | 'bachelor' | 'diploma' | 'assessed' | 'none';
  specialistQualification?: 'master_research' | 'doctoral_research' | 'none';
  study_requirement: 'yes' | 'no';           // Australian study requirement
  natti: 'yes' | 'no';                       // Credentialed community language
  regional_study: 'yes' | 'no';              // Study in regional Australia
  professional_year: 'yes' | 'no';           // Professional Year
  partner: 'meets_all' | 'competent_english' | 'single_or_au_partner';
  nomination_sponsorship: 'state' | 'family' | 'none';
};

// Estructura para calcular score (camelCase)
interface ScoreData {
  visaSubclass: '491' | '190' | '189';
  age: number;
  englishLevel: 'Competent' | 'Proficient' | 'Superior';
  workExperience_out: number;
  workExperience_in: number;
  education_qualification: 'doctorate' | 'bachelor' | 'diploma' | 'assessed' | 'none';
  specialistQualification?: 'master_research' | 'doctoral_research' | 'none';
  australianStudy: 'yes' | 'no';
  communityLanguage: 'yes' | 'no';
  regionalStudy: 'yes' | 'no';
  professionalYear: 'yes' | 'no';
  partner: 'meets_all' | 'competent_english' | 'single_or_au_partner';
  nominationSponsorship: 'state' | 'family' | 'none';
}

function calculateScore(data: ScoreData): number {
  let score = 0;
  // Visa Subclass
  switch (data.visaSubclass) {
    case '491': score += 15; break;
    case '190': score += 5;  break;
    case '189': score += 0;  break;
  }
  // Edad
  if (data.age < 25) score += 25;
  else if (data.age < 33) score += 30;
  else if (data.age < 40) score += 25;
  else if (data.age < 45) score += 15;
  // Inglés
  if (data.englishLevel === 'Proficient') score += 10;
  else if (data.englishLevel === 'Superior') score += 20;
  // Experiencia fuera AU
  if (data.workExperience_out >= 8) score += 15;
  else if (data.workExperience_out >= 5) score += 10;
  else if (data.workExperience_out >= 3) score += 5;
  // Experiencia en AU
  if (data.workExperience_in >= 8) score += 20;
  else if (data.workExperience_in >= 5) score += 15;
  else if (data.workExperience_in >= 3) score += 10;
  else if (data.workExperience_in >= 1) score += 5;
  // Educación
  switch (data.education_qualification) {
    case 'doctorate': score += 20; break;
    case 'bachelor': score += 15; break;
    case 'diploma':   score += 10; break;
    case 'assessed':  score += 10; break;
    default: break;
  }
  // Especialista
  if (data.specialistQualification && data.specialistQualification !== 'none') score += 10;
  // Australian study requirement
  if (data.australianStudy === 'yes') score += 5;
  // Credentialed community language
  if (data.communityLanguage === 'yes') score += 5;
  // Study in regional Australia
  if (data.regionalStudy === 'yes') score += 5;
  // Professional Year
  if (data.professionalYear === 'yes') score += 5;
  // Partner skills
  if (data.partner === 'meets_all' || data.partner === 'single_or_au_partner') score += 10;
  else if (data.partner === 'competent_english') score += 5;
  // Nomination or sponsorship
  if (data.nominationSponsorship === 'state' || data.nominationSponsorship === 'family') score += 15;
  return score;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const raw = req.headers.cookie || '';
  const { token } = cookie.parse(raw);
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  let payload: any;
  try { payload = jwt.verify(token, process.env.JWT_SECRET!); }
  catch { return res.status(401).json({ error: 'Token inválido' }); }

  const userId = payload.userId as number;

  if (req.method === 'GET') {
    const profileRaw = await prisma.profile.findUnique({ where: { userId } });
    if (!profileRaw) return res.status(404).json({ error: 'Perfil no encontrado' });
    return res.status(200).json({ profile: profileRaw });
  }

  if (req.method === 'POST') {
    const body = req.body as ProfilePayload;
    // Datos para calcular
    const scoreData: ScoreData = {
      visaSubclass: body.visaSubclass,
      age: body.age,
      englishLevel: body.englishLevel,
      workExperience_out: body.workExperience_out,
      workExperience_in: body.workExperience_in,
      education_qualification: body.education_qualification,
      specialistQualification: body.specialistQualification,
      australianStudy: body.study_requirement,
      communityLanguage: body.natti,
      regionalStudy: body.regional_study,
      professionalYear: body.professional_year,
      partner: body.partner,
      nominationSponsorship: body.nomination_sponsorship
    };
    const score = calculateScore(scoreData);

    // Payload DB (usando claves snake_case)
    const dbPayload = {
      age: body.age,
      occupation: body.occupation,
      englishLevel: body.englishLevel,
      workExperience_in: body.workExperience_in,
      workExperience_out: body.workExperience_out,
      nationality: body.nationality ?? '',
      education_qualification: body.education_qualification,
      study_requirement: body.study_requirement,
      regional_study: body.regional_study,
      professional_year: body.professional_year,
      natti: body.natti,
      partner: body.partner,
      nomination_sponsorship: body.nomination_sponsorship
    };

    const profile = await prisma.profile.upsert({
      where: { userId },
      create: { userId, ...dbPayload, score },
      update: { ...dbPayload, score }
    });
    return res.status(200).json({ profile });
  }

  res.setHeader('Allow', ['GET','POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
