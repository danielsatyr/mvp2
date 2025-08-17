// File: pages/api/occupations/[id].ts

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import type { OccupationDetailResponse } from '@/types/occupation';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OccupationDetailResponse | { error: string }>
) {
  const id = parseInt(req.query.id as string, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID de ocupación inválido" });
  }

  // 1) Traer occupation + eligibilityFactors
const occ = await prisma.occupation.findUnique({
  where: { id: Number(id) },
  select: {
    id: true,
    occupationId: true,
    name: true,
    anzscoCode: true,
    skillAssessmentBody: true,
    mltsslFlag: true,
    stsolFlag: true,
    rolFlag: true,
    subclass190: true,
    subclass189Pt: true,
   //  subclass186: true,
    subclass491St: true,
    subclass491F: true,
     // subclass494: true,
     // subclass482: true,
     // subclass407: true,
     // subclass485: true,
     skillLevelRequired: true,
  },
});

if (!occ) {
  return res.status(404).json({ error: 'Not found' });
}

// Lista de subclases disponibles
const flags = [
  ['subclass190', '190'],
  ['subclass189Pt', '189 (PT)'],
//   ['subclass186', '186'],
  ['subclass491St', '491(S/T)'],
  ['subclass491F', '491 (F)'],
//   ['subclass494', '494'],
//   ['subclass482', '482'],
//   ['subclass407', '407'],
//   ['subclass485', '485'],
] as const;

const available = flags
  .filter(([key]) => (occ as any)[key])
  .map(([, label]) => label);

 return res.status(200).json({
    id: occ.id,
    occupationId: occ.occupationId,
    name: occ.name,
    anzscoCode: occ.anzscoCode,
    skillAssessmentBody: occ.skillAssessmentBody,
    skillLevelRequired: occ.skillLevelRequired ?? null,
    lists: {
      mltssl: occ.mltsslFlag,
      stsol: occ.stsolFlag,
      rol: occ.rolFlag,
    },
    eligibleSubclasses: available,
  });
}
