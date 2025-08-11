// pages/api/occupations/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const occupations = await prisma.occupation.findMany({
      orderBy: [{ occupationId: "asc" }],
      select: {
        id: true,
        occupationId: true,
        name: true,
        anzscoCode: true,
        skillAssessmentBody: true,
        mltsslFlag: true,
        stsolFlag: true,
        rolFlag: true,
        subclass190: true,
        subclass189Pt: true,
        subclass186: true,
        subclass491St: true,
        subclass491F: true,
        subclass494: true,
        subclass482: true,
        subclass407: true,
        subclass485: true,
        skillLevelRequired: true,
      },
    });

    return res.status(200).json(occupations);
  } catch (err) {
    console.error("GET /api/occupations error:", err);
    return res.status(500).json({ error: "Error cargando ocupaciones" });
  }
}
