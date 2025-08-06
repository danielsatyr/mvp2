// pages/api/profile/breakdown.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import * as cookie from 'cookie';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Repite la definición de ScoreData y calculateBreakdown de tu perfil API
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
  partnerSkill: 'meets_all' | 'competent_english' | 'single_or_au_partner';
  nominationType: 'state' | 'family' | 'none';
}

function calculateBreakdown(data: ScoreData): Record<string, number> {
  return {
    visa: data.visaSubclass === '491' ? 15 : data.visaSubclass === '190' ? 5 : 0,
    age: data.age < 25 ? 25 : data.age < 33 ? 30 : data.age < 40 ? 25 : data.age < 45 ? 15 : 0,
    english: data.englishLevel === 'Superior' ? 20 : data.englishLevel === 'Proficient' ? 10 : 0,
    workOutside:
      data.workExperience_out >= 8 ? 15 :
      data.workExperience_out >= 5 ? 10 :
      data.workExperience_out >= 3 ? 5 : 0,
    workInside:
      data.workExperience_in >= 8 ? 20 :
      data.workExperience_in >= 5 ? 15 :
      data.workExperience_in >= 3 ? 10 :
      data.workExperience_in >= 1 ? 5 : 0,
    education:
      data.education_qualification === 'doctorate' ? 20 :
      data.education_qualification === 'bachelor' ? 15 :
      data.education_qualification === 'diploma' ? 10 :
      data.education_qualification === 'assessed' ? 10 : 0,
    specialist: data.specialistQualification && data.specialistQualification !== 'none' ? 10 : 0,
    australianStudy: data.australianStudy === 'yes' ? 5 : 0,
    communityLanguage: data.communityLanguage === 'yes' ? 5 : 0,
    regionalStudy: data.regionalStudy === 'yes' ? 5 : 0,
    professionalYear: data.professionalYear === 'yes' ? 5 : 0,
    partner: data.partnerSkill === 'meets_all' || data.partnerSkill === 'single_or_au_partner' ? 10 :
             data.partnerSkill === 'competent_english' ? 5 : 0,
    nomination: data.nominationType === 'state' || data.nominationType === 'family' ? 15 : 0,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Autenticar igual que en profile.ts
  const raw = req.headers.cookie || '';
  const { token } = cookie.parse(raw);
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  let payload: any;
  try { payload = jwt.verify(token, process.env.JWT_SECRET!); }
  catch  { return res.status(401).json({ error: 'Token inválido' }); }
  const userId = payload.userId as number;

  // 2) Leer perfil
  const profileRaw = await prisma.profile.findUnique({ where: { userId } });
  if (!profileRaw) return res.status(404).json({ error: 'Perfil no encontrado' });

  // 3) Mapear a ScoreData
  const scoreData: ScoreData = {
    visaSubclass: profileRaw.visaSubclass as any,
    age: profileRaw.age,
    englishLevel: profileRaw.englishLevel as any,
    workExperience_out: profileRaw.workExperience_out,
    workExperience_in: profileRaw.workExperience_in,
    education_qualification: profileRaw.education_qualification as any,
    specialistQualification: profileRaw.specialistQualification as any,
    australianStudy: profileRaw.study_requirement as any,
    communityLanguage: profileRaw.natti as any,
    regionalStudy: profileRaw.regional_study as any,
    professionalYear: profileRaw.professional_year as any,
    partnerSkill: profileRaw.partner as any,
    nominationType: profileRaw.nomination_sponsorship as any,
  };

  // 4) Calcular y devolver breakdown
  const breakdown = calculateBreakdown(scoreData);
  return res.status(200).json({ breakdown });
}