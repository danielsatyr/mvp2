// pages/api/profile.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import * as cookie from "cookie";
import jwt from "jsonwebtoken";
import { parse } from "url";

const prisma = new PrismaClient();

// Payload form keys
interface ProfilePayload {
  visaSubclass: "491" | "190" | "189";
  age: number;
  englishLevel: "Competent" | "Proficient" | "Superior";
  workExperience_out: number;
  workExperience_in: number;
  occupation: string;
  nationality?: string;
  education_qualification:
    | "doctorate"
    | "bachelor"
    | "diploma"
    | "assessed"
    | "none";
  specialistQualification?: "master_research" | "doctoral_research" | "none";
  study_requirement: "yes" | "no";
  natti: "yes" | "no";
  regional_study: "yes" | "no";
  professional_year: "yes" | "no";
  partnerSkill: "meets_all" | "competent_english" | "single_or_au_partner";
  nominationType: "state" | "family" | "none";
}

// CamelCase for score calculations
interface ScoreData {
  visaSubclass: ProfilePayload["visaSubclass"];
  age: number;
  englishLevel: ProfilePayload["englishLevel"];
  workExperience_out: number;
  workExperience_in: number;
  education_qualification: ProfilePayload["education_qualification"];
  specialistQualification?: ProfilePayload["specialistQualification"];
  australianStudy: ProfilePayload["study_requirement"];
  communityLanguage: ProfilePayload["natti"];
  regionalStudy: ProfilePayload["regional_study"];
  professionalYear: ProfilePayload["professional_year"];
  partnerSkill: ProfilePayload["partnerSkill"];
  nominationType: ProfilePayload["nominationType"];
}

function calculateScore(data: ScoreData): number {
  let score = 0;
  // Visa Subclass
  switch (data.visaSubclass) {
    case "491":
      score += 15;
      break;
    case "190":
      score += 5;
      break;
    case "189":
      score += 0;
      break;
  }
  // Edad
  if (data.age < 25) score += 25;
  else if (data.age < 33) score += 30;
  else if (data.age < 40) score += 25;
  else if (data.age < 45) score += 15;
  // Inglés
  if (data.englishLevel === "Proficient") score += 10;
  else if (data.englishLevel === "Superior") score += 20;
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
    case "doctorate":
      score += 20;
      break;
    case "bachelor":
      score += 15;
      break;
    case "diploma":
      score += 10;
      break;
    case "assessed":
      score += 10;
      break;
    default:
      break;
  }
  // Especialista
  if (data.specialistQualification && data.specialistQualification !== "none")
    score += 10;
  // Australian study requirement
  if (data.australianStudy === "yes") score += 5;
  // Credentialed community language
  if (data.communityLanguage === "yes") score += 5;
  // Study in regional Australia
  if (data.regionalStudy === "yes") score += 5;
  // Professional Year
  if (data.professionalYear === "yes") score += 5;
  // Partner skills
  if (
    data.partnerSkill === "meets_all" ||
    data.partnerSkill === "single_or_au_partner"
  )
    score += 10;
  else if (data.partnerSkill === "competent_english") score += 5;
  // Nomination or sponsorship
  if (data.nominationType === "state" || data.nominationType === "family")
    score += 15;
  return score;
}

// Calculate breakdown per criterion
function calculateBreakdown(data: ScoreData): Record<string, number> {
  return {
    visa:
      data.visaSubclass === "491" ? 15 : data.visaSubclass === "190" ? 5 : 0,
    age:
      data.age < 25
        ? 25
        : data.age < 33
          ? 30
          : data.age < 40
            ? 25
            : data.age < 45
              ? 15
              : 0,
    english:
      data.englishLevel === "Superior"
        ? 20
        : data.englishLevel === "Proficient"
          ? 10
          : 0,
    workOutside:
      data.workExperience_out >= 8
        ? 15
        : data.workExperience_out >= 5
          ? 10
          : data.workExperience_out >= 3
            ? 5
            : 0,
    workInside:
      data.workExperience_in >= 8
        ? 20
        : data.workExperience_in >= 5
          ? 15
          : data.workExperience_in >= 3
            ? 10
            : data.workExperience_in >= 1
              ? 5
              : 0,
    education:
      data.education_qualification === "doctorate"
        ? 20
        : data.education_qualification === "bachelor"
          ? 15
          : data.education_qualification === "diploma"
            ? 10
            : data.education_qualification === "assessed"
              ? 10
              : 0,
    specialist:
      data.specialistQualification && data.specialistQualification !== "none"
        ? 10
        : 0,
    australianStudy: data.australianStudy === "yes" ? 5 : 0,
    communityLanguage: data.communityLanguage === "yes" ? 5 : 0,
    regionalStudy: data.regionalStudy === "yes" ? 5 : 0,
    professionalYear: data.professionalYear === "yes" ? 5 : 0,
    partner:
      data.partnerSkill === "meets_all" ||
      data.partnerSkill === "single_or_au_partner"
        ? 10
        : data.partnerSkill === "competent_english"
          ? 5
          : 0,
    nomination:
      data.nominationType === "state" || data.nominationType === "family"
        ? 15
        : 0,
  };
}

// Main handler: routes /api/profile and /api/profile/breakdown
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { pathname } = parse(req.url || "");
  const raw = req.headers.cookie || "";
  const { token } = cookie.parse(raw);
  if (!token) return res.status(401).json({ error: "No autenticado" });
  let payload: any;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
  const userId = payload.userId as number;

  // GET /api/profile/breakdown
  if (req.method === "GET" && pathname === "/api/profile/breakdown") {
    const profileRaw = await prisma.profile.findUnique({ where: { userId } });
    if (!profileRaw)
      return res.status(404).json({ error: "Perfil no encontrado" });
    const scoreData: ScoreData = {
      visaSubclass: profileRaw.visaSubclass as ScoreData["visaSubclass"],
      age: profileRaw.age,
      englishLevel: profileRaw.englishLevel as ScoreData["englishLevel"],
      workExperience_out: profileRaw.workExperience_out,
      workExperience_in: profileRaw.workExperience_in,
      education_qualification:
        profileRaw.education_qualification as ScoreData["education_qualification"],
      specialistQualification:
        profileRaw.specialistQualification as ScoreData["specialistQualification"],
      australianStudy:
        profileRaw.study_requirement as ScoreData["australianStudy"],
      communityLanguage: profileRaw.natti as ScoreData["communityLanguage"],
      regionalStudy: profileRaw.regional_study as ScoreData["regionalStudy"],
      professionalYear:
        profileRaw.professional_year as ScoreData["professionalYear"],
      partnerSkill: profileRaw.partner as ScoreData["partnerSkill"],
      nominationType:
        profileRaw.nomination_sponsorship as ScoreData["nominationType"],
    };
    const breakdown = calculateBreakdown(scoreData);
    return res.status(200).json({ breakdown });
  }

  // GET /api/profile
  if (req.method === "GET" && pathname === "/api/profile") {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile)
      return res.status(404).json({ error: "Perfil no encontrado" });
    return res.status(200).json({ profile });
  }

  // POST /api/profile
  if (req.method === "POST" && pathname === "/api/profile") {
    const body = req.body as ProfilePayload;
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
      partnerSkill: body.partnerSkill,
      nominationType: body.nominationType,
    };
    const score = calculateScore(scoreData);
    const dbPayload = {
      age: body.age,
      occupation: body.occupation,
      englishLevel: body.englishLevel,
      workExperience_in: body.workExperience_in,
      workExperience_out: body.workExperience_out,
      nationality: body.nationality ?? "",
      education_qualification: body.education_qualification,
      study_requirement: body.study_requirement,
      regional_study: body.regional_study,
      professional_year: body.professional_year,
      natti: body.natti,
      // Asegurar valores por defecto si faltan en el payload
      partner: body.partnerSkill ?? "",
      nomination_sponsorship: body.nominationType ?? "",
    };
    const profile = await prisma.profile.upsert({
      where: { userId },
      create: { userId, ...dbPayload, score },
      update: { ...dbPayload, score },
    });
    return res.status(200).json({ profile });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
