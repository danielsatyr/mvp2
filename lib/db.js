// lib/db.js
// Ejemplo con Prisma; si usas otro cliente, ajústalo aquí.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Recupera todas las ocupaciones y sus puntos mínimos
 */
export async function getAllOccupations() {
  return prisma.occupation.findMany({
    select: { code: true, description: true, minPoints: true }
  });
}

/**
 * Guarda la elección o historial del usuario (opcional)
 */
export async function saveUserChoice(userId, data) {
  return prisma.userChoice.create({
    data: {
      userId,
      ...data
    }
  });
}