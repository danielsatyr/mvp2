// pages/api/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as cookie from "cookie";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type JwtPayload = { userId: number };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const raw = req.headers.cookie || "";
    const { token } = cookie.parse(raw);
    if (!token) return res.status(401).json({ error: "No autenticado" });

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const userId = payload.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true },
    });

    if (!user) return res.status(401).json({ error: "No autenticado" });

    return res.status(200).json({ user });
  } catch (err) {
    return res.status(401).json({ error: "No autenticado" });
  }
}
