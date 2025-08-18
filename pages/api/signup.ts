import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { name, username, password } = req.body;

  // 1. Validaciones básicas
  if (
    typeof name !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({ error: "Campos inválidos" });
  }
  if (name.trim().length === 0) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }
  if (username.length < 4) {
    return res
      .status(400)
      .json({ error: "El nombre de usuario debe tener al menos 4 caracteres" });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }

  try {
    // 2. Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Crear el usuario en la base de datos
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        username: true,
        createdAt: true,
      },
    });

    // 4. Respuesta
    return res.status(201).json({ message: "Usuario creado", user });
  } catch (error) {
    // 5. Manejo de errores
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Unique constraint failed
      return res.status(409).json({ error: "El nombre de usuario ya existe" });
    }
    console.error("Error creando usuario:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
