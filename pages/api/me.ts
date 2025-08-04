// pages/api/me.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import * as cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Sólo GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  // Parsear cookie
  const raw = req.headers.cookie || '';
  const { token } = cookie.parse(raw);

  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  // Verificar JWT
  let payload: any;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  // Buscar usuario
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, username: true },
  });

  if (!user) {
    return res.status(401).json({ error: 'Usuario no encontrado' });
  }

  // Devolver datos de usuario
  return res.status(200).json({ user });
}