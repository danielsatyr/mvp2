// pages/api/profile/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as cookie from "cookie";
import jwt from "jsonwebtoken";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  workExperience_out: number; // años fuera de AU
  workExperience_in: number;  // años en AU
  education_qualification: string; // ej. Bachelor/Master/PhD
  specialistQualification?: string; // CPA/ACS etc.
  australianStudy?: boolean;
  communityLanguage?: boolean;
  regionalStudy?: boolean;
  professionalYear?: boolean;
  partnerSkill?: string; // "", "skill+english", "competentEnglish", "singleOrCitizenPR"
  nominationType?: string; // "", "state", "family"
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

  const score = Object.values(b).reduce((acc, n) => acc + n, 0);
  return { breakdown: b, score };
}

function toBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["1","true","yes","si","sí","on"].includes(v.toLowerCase());
  return !!v;
}

function normalizeBody(body: any) {
  return {
    visaSubclass: body.visaSubclass ?? body.visa_subclass ?? body.visa ?? "189",
    age: Number(body.age ?? body.edad ?? 0),
    englishLevel: body.englishLevel ?? body.english_level ?? "Competent",

    workExperience_out: Number(body.workExperience_out ?? body.work_experience_out ?? 0),
    workExperience_in: Number(body.workExperience_in ?? body.work_experience_in ?? 0),

    education_qualification:
      body.education_qualification ?? body.educationQualification ?? "",

    specialistQualification:
      body.specialistQualification ?? body.specialist_qualification ?? "",

    australianStudy: toBool(body.australianStudy ?? body.study_requirement ?? false),
    regionalStudy: toBool(body.regionalStudy ?? body.regional_study ?? false),
    communityLanguage: toBool(body.communityLanguage ?? body.natti ?? false),
    professionalYear: toBool(body.professionalYear ?? body.professional_year ?? false),

    partnerSkill: body.partnerSkill ?? body.partner ?? "",
    nominationType: body.nominationType ?? body.nomination_sponsorship ?? "",

    occupation: body.occupation ?? body.occupation_name ?? "",
    nationality: body.nationality ?? "",
  };
}

/** Defaults según tu modelo (strings "Yes"/"No" para flags) */
function getDefaultProfileCreate(userId: number): Prisma.ProfileUncheckedCreateInput {
  return {
    userId,
    visaSubclass: "189",
    age: 0,
    englishLevel: "Competent",
    workExperience_in: 0,
    workExperience_out: 0,
    education_qualification: "",
    specialistQualification: "",

    study_requirement: "No",
    regional_study: "No",
    professional_year: "No",
    natti: "No",

    partner: "",
    nomination_sponsorship: "",
    occupation: "",
    nationality: "",

    score: 0,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "POST") {
    try {
      const b = normalizeBody(req.body);

      const payload: ProfilePayload = {
        visaSubclass: b.visaSubclass,
        age: Number.isFinite(b.age) ? b.age : 0,
        englishLevel: b.englishLevel,
        workExperience_out: b.workExperience_out,
        workExperience_in: b.workExperience_in,
        education_qualification: b.education_qualification,
        specialistQualification: b.specialistQualification || "",
        australianStudy: !!b.australianStudy,
        communityLanguage: !!b.communityLanguage,
        regionalStudy: !!b.regionalStudy,
        professionalYear: !!b.professionalYear,
        partnerSkill: b.partnerSkill || "",
        nominationType: b.nominationType || "",
      };

      const { breakdown, score } = computeBreakdown(payload);

      const createData: Prisma.ProfileUncheckedCreateInput = {
        ...getDefaultProfileCreate(userId),
        userId,
        visaSubclass: payload.visaSubclass,
        age: payload.age,
        englishLevel: payload.englishLevel,
        workExperience_in: payload.workExperience_in,
        workExperience_out: payload.workExperience_out,
        education_qualification: payload.education_qualification,
        specialistQualification: payload.specialistQualification || "",

        // 👇 convertir booleans a strings esperados por tu modelo
        study_requirement: payload.australianStudy ? "Yes" : "No",
        regional_study: payload.regionalStudy ? "Yes" : "No",
        professional_year: payload.professionalYear ? "Yes" : "No",
        natti: payload.communityLanguage ? "Yes" : "No",

        partner: payload.partnerSkill || "",
        nomination_sponsorship: payload.nominationType || "",

        occupation: b.occupation || "",
        nationality: b.nationality || "",

        score,
      };

      const updateData = { ...createData } as Partial<Prisma.ProfileUncheckedCreateInput>;
      delete (updateData as any).userId;

      const profile = await prisma.profile.upsert({
        where: { userId },
        create: createData,
        update: updateData,
      });

      return res.status(200).json({ profile, breakdown, score });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  if (req.method === "GET") {
    try {
      const profile = await prisma.profile.findUnique({ where: { userId } });
      return res.status(200).json({ profile });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error reading profile" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
