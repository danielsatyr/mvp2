// pages/api/logout.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Sobrescribimos la cookie con max-age 0 para borrarla
  res.setHeader(
    'Set-Cookie',
    `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`
  );
  return res.status(200).json({ message: 'Sesión cerrada' });
}