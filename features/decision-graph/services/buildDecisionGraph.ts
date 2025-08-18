// features/decision-graph/services/buildDecisionGraph.ts
import type { DecisionGraphDTO, NodeDTO, LinkDTO } from "../types/dto";
import type { ProfileInput } from "@/lib/validation/decision-graph";
import { prisma } from "@/lib/prisma";

// Construye nodos de reglas a partir de una fila de EligibilityFactors
function rulesFromEF(row: any) {
  const rules: Array<{ field: string; op: string; value: any; label: string }> = [];
  if (row.englishLevelRequired)
    rules.push({ field: "english", op: ">=", value: row.englishLevelRequired, label: "Inglés requerido" });
  if (typeof row.minPointsState === "number")
    rules.push({ field: "state_min_points", op: ">=", value: row.minPointsState, label: "Puntos mínimos" });
  if (typeof row.workExperienceStateYears === "number")
    rules.push({ field: "experience_state_years", op: ">=", value: row.workExperienceStateYears, label: "Experiencia en el estado" });
  if (typeof row.workExperienceOverseasYears === "number")
    rules.push({ field: "experience_overseas_years", op: ">=", value: row.workExperienceOverseasYears, label: "Experiencia en el exterior" });
  if (row.studyInStateRequired !== null && row.studyInStateRequired !== undefined)
    rules.push({ field: "study_in_state", op: "==", value: row.studyInStateRequired === true, label: "Estudio en el estado" });
  return rules;
}


export async function buildDecisionGraph(profile: ProfileInput): Promise<DecisionGraphDTO> {
  const rootKey = "start";
  const occupationKey = `occ:${profile.occupationId ?? "unknown"}`;
  const eligibilityKey = "eligibility:baseline";


  const nodes: NodeDTO[] = [];
  const links: LinkDTO[] = [];

  // 1) Resolver nombre + ANZSCO desde Occupation usando el occupationId (string)
  let occTitle = "Occupation: (no seleccionado)";
   if (profile.occupationId && profile.occupationId.trim() !== "") {
    const occ = await prisma.occupation.findUnique({
      where: { occupationId: profile.occupationId }, // <- único (String)
      select: { name: true, anzscoCode: true },
    });

    if (occ) {
      // Ej: "ANZSCO 2613 – Software and Applications Programmers"
      occTitle = `ANZSCO ${occ.anzscoCode} – ${occ.name}`;
    } else {
      // fallback si el código en Profile no existe en Occupation
      occTitle = `Occupation: ${profile.occupationId} (no encontrado)`;
    }
  }

  nodes.push({ key: rootKey, parent: null, title: "Start" });
  nodes.push({ key: occupationKey, parent: rootKey, title: occTitle });
  nodes.push({ key: eligibilityKey, parent: occupationKey, title: "Eligibility" });

  links.push({ from: rootKey, to: occupationKey });
  links.push({ from: occupationKey, to: eligibilityKey });

  // 2) Consultar EligibilityFactors → visas, estados y pathways
  const efRows = await prisma.eligibilityFactors.findMany({
    where: { occupationId: profile.occupationId },
  });

  const byVisa = new Map<string, Map<string, Map<string, any>>>();
  for (const row of efRows) {
    if (!row.visa) continue;
    const visa = row.visa;
    if (!byVisa.has(visa)) byVisa.set(visa, new Map());
    const visaMap = byVisa.get(visa)!;
    const state = row.state || "";
    if (!visaMap.has(state)) visaMap.set(state, new Map());
    const stateMap = visaMap.get(state)!;
    const pathway = row.pathway || "General";
    if (!stateMap.has(pathway)) stateMap.set(pathway, { rules: rulesFromEF(row) });
    else {
      const g = stateMap.get(pathway)!;
      g.rules.push(...rulesFromEF(row));
    }
  }

  for (const [visa, states] of byVisa.entries()) {
    const visaKey = `visa:${visa}`;
    nodes.push({ key: visaKey, parent: eligibilityKey, title: `Visa ${visa}` });
    links.push({ from: eligibilityKey, to: visaKey });

    for (const [state, pathways] of states.entries()) {
      const stateKey = `state:${visa}:${state}`;
      nodes.push({ key: stateKey, parent: visaKey, title: state });
      links.push({ from: visaKey, to: stateKey });

      for (const [pathway, data] of pathways.entries()) {
        const pwKey = `pw:${visa}:${state}:${pathway}`;
        nodes.push({ key: pwKey, parent: stateKey, title: pathway, meta: { rules: data.rules } });
        links.push({ from: stateKey, to: pwKey });
      }
    }
  }

  return { nodes, links };
}