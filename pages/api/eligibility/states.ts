// pages/api/eligibility/states.ts
import type { NextApiRequest, NextApiResponse } from "next";

// ⚠️ TODO (próximo paso): reemplazar MOCKS por consultas Prisma reales.
// import { prisma } from "@/lib/prisma";

const VALID_VISAS = new Set(["189", "190", "491"]);

// Fallback mínimo para destrabar (mapea por ANZSCO + visa)
const MOCK_STATES_BY_CODE: Record<string, Record<string, string[]>> = {
  // ej: 263112 (ICT Project Manager)
  "263112": {
    "190": ["NSW", "VIC", "QLD"],
    "491": ["SA", "TAS", "WA"],
  },
  // agrega más ANZSCO si lo necesitas para pruebas
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const anzscoCode = String(req.query.anzscoCode ?? "").trim();
    const visa = String(req.query.visa ?? "").trim();

    // Validaciones simples
    if (!/^\d{6}$/.test(anzscoCode)) {
      return res.status(400).json({ error: "Invalid anzscoCode (need 6 digits)" });
    }
    if (!VALID_VISAS.has(visa)) {
      return res.status(400).json({ error: "Invalid visa (use 189|190|491)" });
    }

    // --- Próximo paso (cuando me pases esquema): consulta real con Prisma
    // const rows = await prisma.stateOccupation.findMany({
    //   where: { anzscoCode, visa },
    //   select: { state: true },
    // });
    // const states = rows.map(r => ({ state: r.state }));
    // if (states.length) return res.status(200).json(states);

    // --- Fallback temporal (MOCK)
    const states = MOCK_STATES_BY_CODE[anzscoCode]?.[visa] ?? [];
    // Formato esperado por el hook: [{ state: "NSW" }, ...]
    const payload = states.map((s) => ({ state: s }));

    // Cache corto para dev (opcional)
    res.setHeader("Cache-Control", "private, max-age=30");
    return res.status(200).json(payload);
  } catch (err: any) {
    console.error("GET /api/eligibility/states error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
