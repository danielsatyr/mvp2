import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function truthyFlag(v: any): boolean {
  if (v === true || v === 1 || v === "1") return true;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "yes" || s === "true" || s === "y";
  }
  return false;
}

/**
 * GET /api/eligibility/visas?occupationId=... | &anzscoCode=...
 * Responde: ["189","190","491"]
 *
 * Lógica:
 * 1) Lee flags desde Occupation (soporta schema legacy y nuevo sin `select`).
 * 2) Suma 190/491 si hay filas en EligibilityFactors para esa ocupación.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const qOccupationId = Array.isArray(req.query.occupationId) ? req.query.occupationId[0] : req.query.occupationId;
  const qAnzscoCode = Array.isArray(req.query.anzscoCode) ? req.query.anzscoCode[0] : req.query.anzscoCode;

  if (!qOccupationId && !qAnzscoCode) {
    return res.status(400).json({ error: "Debes enviar occupationId o anzscoCode" });
  }

  try {
    const whereOcc: Prisma.OccupationWhereInput = qOccupationId
      ? { occupationId: String(qOccupationId) }
      : { anzscoCode: String(qAnzscoCode) };

    // ⚠️ Sin `select`: tolerante a nombres de columnas distintos entre backups
    const occ: any = await prisma.occupation.findFirst({ where: whereOcc });
    if (!occ) return res.status(404).json({ error: "Ocupación no encontrada" });

    // 1) Flags desde Occupation con alias comunes (nuevo y legacy)
    // 189
    const v189Flag = truthyFlag(
      occ.subclass189Pt ??
      occ["189 (PT)"] ??
      occ.visa_189 ??
      occ.subclass189 ??           // por si existe así en tu schema
      occ.subclass_189             // otro alias posible
    );

    // 190
    const v190Flag = truthyFlag(
      occ.subclass190 ??
      occ["190"] ??
      occ.visa_190 ??
      occ.subclass_190
    );

    // 491
    const v491Flag = truthyFlag(
      occ.subclass491St ??
      occ["491(S/T)"] ??
      occ.visa_491 ??
      occ.subclass491 ??
      occ.subclass_491
    );

    const visas = new Set<string>();
    if (v189Flag) visas.add("189");
    if (v190Flag) visas.add("190");
    if (v491Flag) visas.add("491");

    // 2) Sumar visas si hay filas en EligibilityFactors (aunque el flag esté en "No")
    const efWhere: any = occ.occupationId
      ? { occupationId: occ.occupationId }
      : occ.anzscoCode
      ? { anzscoCode: occ.anzscoCode }
      : null;

    if (efWhere) {
      const efRows = await prisma.eligibilityFactors.findMany({
        where: efWhere,
        select: { visa: true },
      });
      for (const r of efRows) {
        if (r?.visa === "189" || r?.visa === "190" || r?.visa === "491") {
          visas.add(r.visa);
        }
      }
    }

    return res.status(200).json(Array.from(visas));
  } catch (err) {
    console.error("GET /api/eligibility/visas error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
