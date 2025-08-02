// lib/db.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getAllOccupations() {
  return prisma.occupation.findMany({
    select: {
      occupationId: true,
      name: true,
      subclass190: true,
      subclass189Pt: true,
      subclass186: true,
      subclass491St: true,
      subclass491F: true
    }
  });
}