// pages/api/eligibility/pathways.ts
import type { NextApiRequest, NextApiResponse } from "next";

// ⚠️ TODO (próximo paso): reemplazar MOCKS por consultas Prisma reales.
// import { prisma } from "@/lib/prisma";

const VALID_VISAS = new Set(["189", "190", "491"]);

// Fallback mínimo (por ANZSCO + visa + state)
const MOCK_PATHWAYS: Array<{
  anzscoCode: string;
  visa: "189" | "190" | "491";
  state: string;
  pathways: Array<{ pathwayId: string; title: string; prefix?: string }>;
}> = [
  {
    anzscoCode: "263112",
    visa: "190",
    state: "NSW",
    pathways: [
      { pathwayId: "nsw-A", title: "General Skilled – A", prefix: "A" },
      { pathwayId: "nsw-B", title: "General Skilled – B", prefix: "B" },
    ],
  },
  {
    anzscoCode: "263112",
    visa: "190",
    state: "VIC",
    pathways: [{ pathwayId: "vic-GEN", title: "Victoria Skilled Program" }],
  },
  {
    anzscoCode: "263112",
    visa: "491",
    state: "SA",
    pathways: [{ pathwayId: "sa-reg", title: "Regional Skilled SA", prefix: "REG" }],
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const anzscoCode = String(req.query.anzscoCode ?? "").trim();
    const visa = String(req.query.visa ?? "").trim() as "189" | "190" | "491";
    const state = String(req.query.state ?? "").trim().toUpperCase();

    if (!/^\d{6}$/.test(anzscoCode)) {
      return res.status(400).json({ error: "Invalid anzscoCode (need 6 digits)" });
    }
    if (!VALID_VISAS.has(visa)) {
      return res.status(400).json({ error: "Invalid visa (use 189|190|491)" });
    }
    if (!state) {
      return res.status(400).json({ error: "Missing state" });
    }

    // --- Próximo paso: consulta real en Prisma con tus tablas
    // const rows = await prisma.pathway.findMany({
    //   where: { anzscoCode, visa, state },
    //   select: { pathwayId: true, title: true, prefix: true },
    // });
    // if (rows.length) return res.status(200).json(rows);

    // --- Fallback temporal (MOCK)
    const found = MOCK_PATHWAYS.find(
      (x) => x.anzscoCode === anzscoCode && x.visa === visa && x.state === state
    );
    const payload = found?.pathways ?? [];

    res.setHeader("Cache-Control", "private, max-age=30");
    return res.status(200).json(payload);
  } catch (err: any) {
    console.error("GET /api/eligibility/pathways error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
