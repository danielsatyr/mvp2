// pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_EXPIRY = 60 * 60 * 24; // 1 día en segundos

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { username, password } = req.body;
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Campos inválidos" });
  }

  // 1. Buscar usuario
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  // 2. Verificar contraseña
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  // 3. Generar JWT y enviarlo en cookie HttpOnly
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
  const isProd = process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    `token=${token}; HttpOnly; Path=/; Max-Age=${TOKEN_EXPIRY}; SameSite=Strict${isProd ? "; Secure" : ""}`,
  );

  // 4. Responder OK
  return res.status(200).json({ message: "Autenticado" });
}
