// File: pages/api/occupations/[id].ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type VisaFlags = {
  code: string;
  enabled: boolean;
};

type StateFactor = {
  state: string;
  pathway: string | null;
  requisito: string;
  valor: string;
};

type EligibilityResponse = {
  occupationId: number;
  name: string;
  skillLevelRequired: string;
  skillAssessmentBody: string;
  visas: VisaFlags[];
  stateFactors: StateFactor[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EligibilityResponse | { error: string }>
) {
  const id = parseInt(req.query.id as string, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID de ocupación inválido' });
  }

  // 1) Traer occupation + eligibilityFactors
  const occ = await prisma.occupation.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      skillLevelRequired: true,
      skillAssessmentBody: true,
      subclass190: true,
      subclass189Pt: true,
      subclass186: true,
      subclass491St: true,
      subclass491F: true,
      subclass494: true,
      subclass482: true,
      subclass407: true,
      subclass485: true,
      eligibilityFactors: {
        select: {
          state: true,
          pathway: true,
          requisito: true,
          valor: true,
        },
      },
    },
  });

  if (!occ) {
    return res.status(404).json({ error: 'Occupation no encontrada' });
  }

  // 2) Mapear flags de visa a array
  const visaFields: Array<[keyof typeof occ, string]> = [
    ['subclass190', '190'],
    ['subclass189Pt', '189 (PT)'],
    ['subclass186', '186'],
    ['subclass491St', '491 (S/T)'],
    ['subclass491F', '491 (F)'],
    ['subclass494', '494'],
    ['subclass482', '482'],
    ['subclass407', '407'],
    ['subclass485', '485'],
  ];

  const visas: VisaFlags[] = visaFields.map(([field, code]) => ({
    code,
    enabled: Boolean(occ[field]),
  }));

  // 3) Construir respuesta
  const response: EligibilityResponse = {
    occupationId: occ.id,
    name: occ.name,
    skillLevelRequired: occ.skillLevelRequired,
    skillAssessmentBody: occ.skillAssessmentBody,
    visas,
    stateFactors: occ.eligibilityFactors,
  };

  return res.status(200).json(response);
}
