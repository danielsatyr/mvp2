import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function normalizeQueryParam(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

const ALLOWED_VISAS = new Set(["189", "190", "491"]);

/**
 * GET /api/eligibility/states?visa=190&occupationId=... | &anzscoCode=...
 * Responde: ["VIC","QLD", ...]
 * - 400 si faltan parámetros o visa inválida
 * - 404 si la ocupación no existe
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const visa = normalizeQueryParam(req.query.visa);
  const qOccupationId = normalizeQueryParam(req.query.occupationId);
  const qAnzscoCode = normalizeQueryParam(req.query.anzscoCode);

  if (!visa || (!qOccupationId && !qAnzscoCode)) {
    return res.status(400).json({
      error: "Debes enviar visa y (occupationId o anzscoCode)",
    });
  }
  if (!ALLOWED_VISAS.has(visa)) {
    return res.status(400).json({ error: "Visa inválida. Usa 189, 190 o 491" });
  }

  try {
    // 1) Resolver ocupación (igual patrón que Paso 1)
    const whereOcc: Prisma.OccupationWhereInput = qOccupationId
      ? { occupationId: String(qOccupationId) } // occupationId es String en tu schema
      : { anzscoCode: String(qAnzscoCode) };

    const occ = await prisma.occupation.findFirst({
      where: whereOcc,
      select: {
        occupationId: true,
        anzscoCode: true,
      },
    });

    if (!occ) {
      return res.status(404).json({ error: "Ocupación no encontrada" });
    }

    // 2) Buscar estados en EligibilityFactors para esa ocupación y visa
    // IMPORTANTE: Ajusta estos nombres de campos si difieren en tu schema:
    // - occupationId  (FK a Occupation)
    // - visa          (string: "189" | "190" | "491")
    // - state         (string: "VIC", "QLD", etc.)
    const rows = await prisma.eligibilityFactors.findMany({
      where: {
        occupationId: occ.occupationId,
        visa: visa, // <-- si tu campo se llama distinto (p.ej. visaSubclass), cámbialo aquí
      },
      select: { state: true },
      orderBy: { state: "asc" },
    });

    // 3) Quitar nulos/duplicados y devolver array plano
    const uniq = Array.from(
      new Set(rows.map(r => r.state).filter((s): s is string => !!s && s.length > 0))
    );

    return res.status(200).json(uniq);
  } catch (err) {
    console.error("GET /api/eligibility/states error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
