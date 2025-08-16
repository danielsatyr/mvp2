import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function truthyFlag(v: any): boolean {
  if (v === true || v === 1 || v === "1") return true;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "yes" || s === "true" || s === "y";
  }
  return false;
}

function yesNo(v: any): "Yes" | "No" {
  return truthyFlag(v) ? "Yes" : "No";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Sin select para ser tolerantes (legacy vs nuevo)
    const rows: any[] = await prisma.occupation.findMany();

    const mapped = rows.map((r) => {
      // IDs/Names con tolerancia
      const occupation_id =
        String(r.occupation_id ?? r.occupationId ?? r.id ?? "");

      const name =
        r.name ?? r.occupationName ?? r.title ?? "";

      const Skill_Level_Required =
        r.Skill_Level_Required ?? r.skillLevel ?? r.skill_level_required ?? null;

      const skill_assessment_body =
        r.skill_assessment_body ?? r.skillAssessmentBody ?? r.assessment_body ?? null;

      // Flags: soporta ambos esquemas
      const v189 = yesNo(r.visa_189 ?? r.subclass189Pt ?? r["189 (PT)"]);
      const v190 = yesNo(r.visa_190 ?? r.subclass190 ?? r["190"]);
      const v491 = yesNo(r.visa_491 ?? r.subclass491St ?? r["491(S/T)"]);

      const anzscoCode =
        r.anzscoCode ?? r.anzsco_code ?? r.anzsco ?? null;

      return {
        occupation_id,
        name,
        Skill_Level_Required,
        skill_assessment_body,
        visa_189: v189,
        visa_190: v190,
        visa_491: v491,
        anzscoCode,
      };
    });

    return res.status(200).json(mapped);
  } catch (err) {
    console.error("GET /api/occupations error:", err);
    return res.status(500).json({ error: "Error cargando ocupaciones" });
  }
}
