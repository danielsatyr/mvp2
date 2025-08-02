// pages/api/occupations.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const occupations = await prisma.occupation.findMany({
      select: { occupationId: true, name: true }
    });
    res.status(200).json(occupations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error retrieving occupations' });
  }
}
