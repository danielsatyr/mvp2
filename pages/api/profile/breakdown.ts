// pages/api/profile/breakdown.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as cookie from "cookie";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type JwtPayload = { userId: number };

function getUserId(req: NextApiRequest): number | null {
  try {
    const raw = req.headers.cookie || "";
    const { token } = cookie.parse(raw);
    if (!token) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

type VisaSubclass = "491" | "190" | "189";
type EnglishLevel = "Competent" | "Proficient" | "Superior";

interface ProfilePayload {
  visaSubclass: VisaSubclass;
  age: number;
  englishLevel: EnglishLevel;
  workExperience_out: number;
  workExperience_in: number;
  education_qualification: string;
  specialistQualification?: string;
  australianStudy?: boolean;
  communityLanguage?: boolean;
  regionalStudy?: boolean;
  professionalYear?: boolean;
  partnerSkill?: string;
  nominationType?: string;
}

type Breakdown = {
  visa: number;
  age: number;
  english: number;
  workOutside: number;
  workInside: number;
  education: number;
  specialist: number;
  australianStudy: number;
  communityLanguage: number;
  regionalStudy: number;
  professionalYear: number;
  partner: number;
  nomination: number;
};

function computeBreakdown(p: ProfilePayload): { breakdown: Breakdown; score: number } {
  const b: Breakdown = {
    visa: 0, age: 0, english: 0, workOutside: 0, workInside: 0,
    education: 0, specialist: 0, australianStudy: 0, communityLanguage: 0,
    regionalStudy: 0, professionalYear: 0, partner: 0, nomination: 0,
  };

  if (p.visaSubclass === "491") b.visa = 15;
  if (p.visaSubclass === "190") b.visa = 5;

  if (p.age < 25) b.age = 25;
  else if (p.age < 33) b.age = 30;
  else if (p.age < 40) b.age = 25;
  else if (p.age < 45) b.age = 15;

  if (p.englishLevel === "Proficient") b.english = 10;
  else if (p.englishLevel === "Superior") b.english = 20;

  if (p.workExperience_out >= 8) b.workOutside = 15;
  else if (p.workExperience_out >= 5) b.workOutside = 10;
  else if (p.workExperience_out >= 3) b.workOutside = 5;

  if (p.workExperience_in >= 8) b.workInside = 20;
  else if (p.workExperience_in >= 5) b.workInside = 15;
  else if (p.workExperience_in >= 3) b.workInside = 10;
  else if (p.workExperience_in >= 1) b.workInside = 5;

  const edu = (p.education_qualification || "").toLowerCase();
  if (edu.includes("phd") || edu.includes("doctor")) b.education = 20;
  else if (edu.includes("master")) b.education = 15;
  else if (edu.includes("bachelor") || edu.includes("degree")) b.education = 15;

  if (p.australianStudy) b.australianStudy = 5;
  if (p.communityLanguage) b.communityLanguage = 5;
  if (p.regionalStudy) b.regionalStudy = 5;
  if (p.professionalYear) b.professionalYear = 5;

  switch (p.partnerSkill) {
    case "skill+english": b.partner = 10; break;
    case "competentEnglish": b.partner = 5; break;
    case "singleOrCitizenPR": b.partner = 10; break;
  }
  switch (p.nominationType) {
    case "state": b.nomination = 15; break;
    case "family": b.nomination = 15; break;
  }

  const score = Object.values(b).reduce((a, n) => a + n, 0);
  return { breakdown: b, score };
}

const toBool = (v: any) => v === true || v === "Yes" || v === "yes" || v === "1";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      // Devuelve todo en 0 si no hay perfil aún
      const empty: Breakdown = {
        visa: 0, age: 0, english: 0, workOutside: 0, workInside: 0,
        education: 0, specialist: 0, australianStudy: 0, communityLanguage: 0,
        regionalStudy: 0, professionalYear: 0, partner: 0, nomination: 0,
      };
      return res.status(200).json({ breakdown: empty, score: 0 });
    }

    // Mapeo DB → payload de cálculo
    const payload: ProfilePayload = {
      visaSubclass: (profile as any).visaSubclass ?? "189",
      age: Number((profile as any).age ?? 0),
      englishLevel: (profile as any).englishLevel ?? "Competent",
      workExperience_out: Number((profile as any).workExperience_out ?? 0),
      workExperience_in: Number((profile as any).workExperience_in ?? 0),
      education_qualification: (profile as any).education_qualification ?? "",
      specialistQualification: (profile as any).specialistQualification ?? "",
      australianStudy: toBool((profile as any).study_requirement),
      communityLanguage: toBool((profile as any).natti),
      regionalStudy: toBool((profile as any).regional_study),
      professionalYear: toBool((profile as any).professional_year),
      partnerSkill: (profile as any).partner ?? "",
      nominationType: (profile as any).nomination_sponsorship ?? "",
    };

    const { breakdown, score } = computeBreakdown(payload);
    return res.status(200).json({ breakdown, score });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
