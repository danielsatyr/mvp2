import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeQueryParam(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

const ALLOWED_VISAS = new Set(["189", "190", "491"]);

// Utilidad: agrega una regla solo si value no es null/undefined/""
function pushRule(
  rules: Array<{ field: string; op: string; value: any; label: string }>,
  field: string,
  op: string,
  value: any,
  label: string
) {
  const isEmpty =
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "");
  if (!isEmpty) {
    rules.push({ field, op, value, label });
  }
}

type PathwayRow = {
  id: number;
  occupationId: string;
  anzscoCode: string | null;
  visa: string;
  state: string;
  pathway: string | null;
  englishLevelRequired: string | null;
  workExperienceStateYears: number | null;
  workExperienceOverseasYears: number | null;
  studyInStateRequired: boolean | null;
  minPointsState: number | null;

  residencyRequirement: string | null;
  studyInStateLevel: string | null;
  jobOfferRequired: boolean | null;
  familySponsorship: boolean | null;
  familySponsorshipStateLoc: string | null;
  offshoreCondition: string | null;
  sectorCritical: boolean | null;
  financialCapacity: boolean | null;
  financialCapacityValue: string | null;
  otherRequirement: string | null;
  offshore: boolean | null;

  streamName: string | null;
  stateOccId: string | null;
  valueRaw: string | null;
  occupationName: string | null;
  visa190Flag: boolean | null;
  visa491Flag: boolean | null;
};

// Construye reglas a partir de una fila de EligibilityFactors (ajustada a tu schema actual)
function buildRulesFromRow(row: PathwayRow) {
  const rules: Array<{ field: string; op: string; value: any; label: string }> = [];

  // Inglés (string ordenable: Competent/Proficient/Superior)
  pushRule(rules, "english", ">=", row.englishLevelRequired, "Inglés requerido");

  // Estudio en el estado (flag)
  pushRule(
    rules,
    "study_in_state",
    "==",
    row.studyInStateRequired === true,
    "Estudio en el estado"
  );

  // Nivel de estudio en el estado (texto; luego podemos ordenarlo por AQF si quieres)
  pushRule(
    rules,
    "study_in_state_level",
    ">=",
    row.studyInStateLevel,
    "Nivel de estudio (estado)"
  );

  // Experiencia en el estado (número)
  if (typeof row.workExperienceStateYears === "number") {
    pushRule(
      rules,
      "experience_state_years",
      ">=",
      row.workExperienceStateYears,
      "Experiencia en el estado (años)"
    );
  }

  // Experiencia en el exterior (número)
  if (typeof row.workExperienceOverseasYears === "number") {
    pushRule(
      rules,
      "experience_overseas_years",
      ">=",
      row.workExperienceOverseasYears,
      "Experiencia en el exterior (años)"
    );
  }

  // Puntos mínimos del estado
  if (typeof row.minPointsState === "number") {
    pushRule(rules, "state_min_points", ">=", row.minPointsState, "Puntaje mínimo (estado)");
  }

  // Requisito de residencia (texto libre)
  pushRule(
    rules,
    "residency_requirement",
    "info",
    row.residencyRequirement,
    "Requisito de residencia"
  );

  // Patrocinio familiar (flag) + ubicación (texto)
  if (typeof row.familySponsorship === "boolean") {
    pushRule(
      rules,
      "family_sponsorship",
      "==",
      row.familySponsorship === true,
      "Patrocinio familiar aceptado"
    );
  }
  pushRule(
    rules,
    "family_sponsorship_state",
    "info",
    row.familySponsorshipStateLoc,
    "Ubicación patrocinio familiar"
  );

  // Oferta laboral (flag)
  if (typeof row.jobOfferRequired === "boolean") {
    pushRule(rules, "job_offer", "==", row.jobOfferRequired === true, "Oferta laboral requerida");
  }

  // Condición offshore (texto)
  pushRule(rules, "offshore_condition", "info", row.offshoreCondition, "Condición offshore");

  // Sector crítico (flag)
  if (typeof row.sectorCritical === "boolean") {
    pushRule(rules, "sector_critical", "==", row.sectorCritical === true, "Sector crítico");
  }

  // Capacidad financiera (flag + monto/valor)
  if (typeof row.financialCapacity === "boolean") {
    pushRule(
      rules,
      "financial_capacity",
      "==",
      row.financialCapacity === true,
      "Capacidad financiera requerida"
    );
  }
  pushRule(
    rules,
    "financial_capacity_value",
    "info",
    row.financialCapacityValue,
    "Monto/soporte financiero"
  );

  // Otros requerimientos (texto)
  pushRule(rules, "other_requirement", "info", row.otherRequirement, "Otro requisito");

  return rules;
}

/**
 * GET /api/eligibility/pathways?visa=190&state=VIC&occupationId=... | &anzscoCode=...
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const visa = normalizeQueryParam(req.query.visa);
  const state = normalizeQueryParam(req.query.state);
  const qOccupationId = normalizeQueryParam(req.query.occupationId);
  const qAnzscoCode = normalizeQueryParam(req.query.anzscoCode);

  if (!visa || !state || (!qOccupationId && !qAnzscoCode)) {
    return res.status(400).json({
      error: "Debes enviar visa, state y (occupationId o anzscoCode)",
    });
  }
  if (!ALLOWED_VISAS.has(visa)) {
    return res.status(400).json({ error: "Visa inválida. Usa 189, 190 o 491" });
  }

  try {
    // 1) Resolver ocupación
    const whereOcc: Prisma.OccupationWhereInput = qOccupationId
      ? { occupationId: String(qOccupationId) }
      : { anzscoCode: String(qAnzscoCode) };

    const occ = await prisma.occupation.findFirst({
      where: whereOcc,
      select: { occupationId: true, anzscoCode: true },
    });

    if (!occ) {
      return res.status(404).json({ error: "Ocupación no encontrada" });
    }

    // 2) Traer filas de EligibilityFactors filtradas por ocupación + visa + state
    // 🔧 Sin `select` para evitar errores TS por desalineación de tipos. Cast controlado.
    const rows = (await prisma.eligibilityFactors.findMany({
      where: {
        occupationId: occ.occupationId,
        visa: visa,
        state: state,
      },
      orderBy: [{ pathway: "asc" }],
    })) as unknown as PathwayRow[];

    // 3) Agrupar por pathway
    type Group = {
      rules: Array<{ field: string; op: string; value: any; label: string }>;
      meta: Record<string, any>;
      title?: string;
    };
    const groups = new Map<string, Group>();

    for (const row of rows) {
      const pathwayId = (row as any).pathway ?? (row as any).pathwayId ?? "General";
      const title =
        (row as any).pathwayTitle ??
        (row as any).pathway ??
        (row as any).pathwayId ??
        "General";

      if (!groups.has(pathwayId)) {
        groups.set(pathwayId, { rules: [], meta: {}, title });
      }

      const group = groups.get(pathwayId)!;

      // Reglas
      const rules = buildRulesFromRow(row);
      group.rules.push(...rules);

      // Meta (solo si existe)
      const offshore =
        row.offshore === true ? true : row.offshore === false ? false : undefined;

      const visaFlags = {
        visa190Flag:
          row.visa190Flag === true ? true : row.visa190Flag === false ? false : undefined,
        visa491Flag:
          row.visa491Flag === true ? true : row.visa491Flag === false ? false : undefined,
      };

      if (offshore !== undefined) group.meta.offshore = offshore;
      if (visaFlags.visa190Flag !== undefined) group.meta.visa190Flag = visaFlags.visa190Flag;
      if (visaFlags.visa491Flag !== undefined) group.meta.visa491Flag = visaFlags.visa491Flag;

      if (row.streamName) group.meta.streamName = row.streamName;
      if (row.stateOccId) group.meta.stateOccId = row.stateOccId;
      if (row.valueRaw) group.meta.valueRaw = row.valueRaw;
      if (row.occupationName) group.meta.occupationName = row.occupationName;
    }

    // 4) Compactar reglas duplicadas
    const resp = Array.from(groups.entries()).map(([pathwayId, g]) => {
      const seen = new Set<string>();
      const uniqueRules = g.rules.filter((r) => {
        const key = `${r.field}|${r.op}|${String(r.value)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return {
        pathwayId,
        title: g.title ?? pathwayId,
        rules: uniqueRules,
        meta: g.meta,
      };
    });

    return res.status(200).json(resp);
  } catch (err) {
    console.error("GET /api/eligibility/pathways error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
