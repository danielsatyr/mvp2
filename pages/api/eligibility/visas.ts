import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Normaliza flags que vienen como 0/1, boolean o string "0"/"1"
function toBool(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true";
}

/**
 * GET /api/eligibility/visas?occupationId=... | &anzscoCode=...
 * Responde: ["189","190","491"]
 * - 400 si faltan parámetros
 * - 404 si no existe la ocupación
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Next.js puede enviar arrays si el query se repite (?x=1&x=2)
  const qOccupationId = Array.isArray(req.query.occupationId)
    ? req.query.occupationId[0]
    : req.query.occupationId;

  const qAnzscoCode = Array.isArray(req.query.anzscoCode)
    ? req.query.anzscoCode[0]
    : req.query.anzscoCode;

  if (!qOccupationId && !qAnzscoCode) {
    return res.status(400).json({ error: "Debes enviar occupationId o anzscoCode" });
  }

  try {
    // Preferimos occupationId si viene; si no, usamos anzscoCode
    const where: Prisma.OccupationWhereInput = qOccupationId
      ? { occupationId: String(qOccupationId) } // <-- String (en tu schema es String)
      : { anzscoCode: String(qAnzscoCode) };

    const occ = await prisma.occupation.findFirst({
      where,
      select: {
        occupationId: true,
        name: true,
        anzscoCode: true,
        // Asegúrate que estos nombres coincidan con tu schema Prisma
        subclass189Pt: true, // @map("189 (PT)")
        subclass190: true,   // @map("190")
        subclass491St: true, // @map("491(S/T)")
      },
    });

    if (!occ) {
      return res.status(404).json({ error: "Ocupación no encontrada" });
    }

    const visas: string[] = [];
    if (toBool(occ.subclass189Pt)) visas.push("189");
    if (toBool(occ.subclass190)) visas.push("190");
    if (toBool(occ.subclass491St)) visas.push("491");

    return res.status(200).json(visas);
  } catch (err) {
    console.error("GET /api/eligibility/visas error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
