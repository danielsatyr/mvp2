// pages/api/occupations/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  // Tabla: Occupation
  // Columnas: occupationId (o id), name
  const occupations = await prisma.occupation.findMany({
    select: {
      occupationId: true,
      name: true
    }
  });
  res.status(200).json(occupations);
}