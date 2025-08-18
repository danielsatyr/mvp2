// features/decision-graph/mapToGraph.ts
import {
  Breakdown,
  DiagramLink,
  DiagramNode,
  OccupationRow,
  UserProfile,
} from "../types";
import type { DecisionGraphDTO } from "../types/dto";


import { statusFromRule } from "../utils/scoringHelpers";

/** Suma segura del breakdown */
function scoreFromBreakdown(breakdown: Breakdown | null | undefined): number {
  if (!breakdown) return 0;
  return Object.values(breakdown).reduce((acc, n) => acc + (n || 0), 0);
}

function visaStatus(visa: "189" | "190" | "491", score: number) {
  const bonus = visa === "190" ? 5 : visa === "491" ? 15 : 0;
  const total = score + bonus;
  if (total >= 65) return "ok";
  if (total >= 55) return "warn";
  return "fail";
}

/**
 * Mapper mínimo:
 * - Start (Total puntos)
 * - Ocupación (skill level + autoridad)
 * - Visas (189/190/491) según columnas de Occupations
 */
export function mapToGraphMinimal(
  profile: UserProfile,
  occ: OccupationRow,
  breakdown: Breakdown
): { nodes: DiagramNode[]; links: DiagramLink[] } {
  const score = scoreFromBreakdown(breakdown);

  const nodes: DiagramNode[] = [
    {
      key: "Start",
      text: `Total: ${score} pts`,
      status: "info",
      isTreeExpanded: true,
      tooltipHtml:
        `<div><b>User:</b> ${profile.userId}</div>` +
        `<div><b>Age:</b> ${profile.age}</div>` +
        `<div><b>English:</b> ${profile.englishLevel}</div>`,
    },
    {
      key: "occ",
      text: `Occupation: ${occ.name} (${occ.occupationId})`,
      status: "info",
      tooltipHtml:
        `<div><b>Skill level:</b> ${occ.Skill_Level_Required}</div>` +
        `<div><b>Authority:</b> ${occ.skill_assessment_body}</div>`,
    },
    {
      key: "elig-visas",
      text: "Visas disponibles por ocupación",
      status: "info",
    },
  ];

  const links: DiagramLink[] = [
    { from: "Start", to: "occ" },
    { from: "Start", to: "elig-visas" },
  ];

  const show189 = occ.visa_189 === "Yes";
  const show190 = occ.visa_190 === "Yes";
  const show491 = occ.visa_491 === "Yes";

  if (show189) {
    nodes.push({
      key: "visa-189",
      text: "189 — Skilled Independent",
      status: visaStatus("189", score),
      isTreeExpanded: false,
      tooltip: "Puntos + skill assessment + inglés. Sin nominación estatal.",
    });
    links.push({ from: "elig-visas", to: "visa-189" });
  }

  if (show190) {
    nodes.push({
      key: "visa-190",
      text: "190 — State Nominated",
      status: visaStatus("190", score),
      isTreeExpanded: false,
      tooltip: "Nominación estatal. Requisitos varían por estado/pathway.",
    });
    links.push({ from: "elig-visas", to: "visa-190" });
  }

  if (show491) {
    nodes.push({
      key: "visa-491",
      text: "491 — Skilled Work Regional",
      status: visaStatus("491", score),
      isTreeExpanded: false,
      tooltip: "Nominación estatal o familiar. Requisitos regionales.",
    });
    links.push({ from: "elig-visas", to: "visa-491" });
  }

  return { nodes, links };
}

/** Localiza el nodo de la visa en el grafo base: soporta `visa-190` o `visa:190`. */
function findVisaNodeKey(
  nodes: DiagramNode[],
  visa: "189" | "190" | "491"
): string | undefined {
  const dash = `visa-${visa}`;
  const colon = `visa:${visa}`;
  if (nodes.some((n) => n.key === dash)) return dash;
  if (nodes.some((n) => n.key === colon)) return colon;
  return undefined;
}

/**
 * Agrega ramas de estados/pathways/resumen de brechas bajo la visa seleccionada.
 * Usa DiagramNode/DiagramLink y campo `text` (no `label`).
 */
export function mapToGraphWithEligibility(
  baseGraph: { nodes: DiagramNode[]; links: DiagramLink[] },
  options: {
    profile: UserProfile;
    selectedVisa?: "189" | "190" | "491";
    states?: string[];
    selectedState?: string;
    pathways?: Array<{ pathwayId: string; title: string; rules: any[]; meta: any }>;
    selectedPathwayId?: string;
  }
) {
  const g = { nodes: [...baseGraph.nodes], links: [...baseGraph.links] };

  if (!options.selectedVisa) return g;

  const visaKey = findVisaNodeKey(g.nodes, options.selectedVisa);
  if (!visaKey) return g;

  // 1) Contenedor de estados
  const statesContainerKey = `states:${options.selectedVisa}`;
  if (!g.nodes.some((n) => n.key === statesContainerKey)) {
    g.nodes.push({
      key: statesContainerKey,
      text: "Estados",
      status: "info",
      isTreeExpanded: true,
      parent: visaKey,
    } as DiagramNode);
    g.links.push({ from: visaKey, to: statesContainerKey });
  }

  // 2) Estados bajo la visa
  for (const st of options.states ?? []) {
    const stateKey = `state:${options.selectedVisa}:${st}`;
    if (!g.nodes.some((n) => n.key === stateKey)) {
      g.nodes.push({
        key: stateKey,
        text: st,
        status: "info",
        parent: statesContainerKey,
      } as DiagramNode);
      g.links.push({ from: statesContainerKey, to: stateKey });
    }
  }

  // 3) Pathways bajo el estado seleccionado
  if (options.selectedState) {
    const stateKey = `state:${options.selectedVisa}:${options.selectedState}`;
    const pws = options.pathways ?? [];

    for (const pw of pws) {
      const pwKey = `pw:${options.selectedVisa}:${options.selectedState}:${pw.pathwayId}`;
      if (!g.nodes.some((n) => n.key === pwKey)) {
        g.nodes.push({
          key: pwKey,
          text: pw.title ?? pw.pathwayId,
          status: "info",
          parent: stateKey,
        } as DiagramNode);
        g.links.push({ from: stateKey, to: pwKey });
      }

      // 4) Resumen de brechas (si quieres pintar cada regla como nodo, lo añadimos luego)
      const statuses: Array<"ok" | "warn" | "fail"> = [];
      for (const r of pw.rules) {
        const s = statusFromRule(options.profile, r);
        statuses.push(s);
      }
      const fails = statuses.filter((s) => s === "fail").length;
      const warns = statuses.filter((s) => s === "warn").length;

      const summaryKey = `summary:${pwKey}`;
      const summaryLabel = `Brechas: ${fails} fail / ${warns} warn`;
      if (!g.nodes.some((n) => n.key === summaryKey)) {
        g.nodes.push({
          key: summaryKey,
          text: summaryLabel,
          status: fails ? "fail" : warns ? "warn" : "ok",
          parent: pwKey,
        } as DiagramNode);
        g.links.push({ from: pwKey, to: summaryKey });
      }
    }
  }

  return g;
}

/**
 * Mapea un DecisionGraphDTO (nodos con parent/meta) a DiagramNode/DiagramLink
 * evaluando reglas y puntajes.
 */
export function mapToGraph(
  dto: DecisionGraphDTO,
  profile: any,
  breakdown: Breakdown
): { nodes: DiagramNode[]; links: DiagramLink[] } {
  const score = scoreFromBreakdown(breakdown);

  const nodes: DiagramNode[] = dto.nodes.map((n) => ({
    key: n.key,
    text: n.title,
    parent: n.parent || undefined,
    status: "info",
    isTreeExpanded: true,
  }));

  const links: DiagramLink[] = [];
  dto.nodes.forEach((n) => {
    if (n.parent) links.push({ from: n.parent, to: n.key });
  });

  // Ajustar nodo Start con puntaje
  const startNode = nodes.find((n) => n.key === "start");
  if (startNode) startNode.text = `Total: ${score} pts`;

  // Estados de visas
  for (const n of nodes) {
    const m = n.key.match(/^visa:(189|190|491)$/);
    if (m) {
      n.status = visaStatus(m[1] as any, score);
      n.isTreeExpanded = false;
    }
  }

  // Resumen de reglas para cada pathway (nodo pw:... con meta.rules)
  dto.nodes.forEach((n) => {
    const rules = (n.meta as any)?.rules;
    if (n.key.startsWith("pw:") && Array.isArray(rules)) {
      const statuses = rules.map((r: any) => statusFromRule(profile, r));
      const fails = statuses.filter((s) => s === "fail").length;
      const warns = statuses.filter((s) => s === "warn").length;
      const summaryKey = `summary:${n.key}`;
      nodes.push({
        key: summaryKey,
        text: `Brechas: ${fails} fail / ${warns} warn`,
        status: fails ? "fail" : warns ? "warn" : "ok",
        parent: n.key,
      });
      links.push({ from: n.key, to: summaryKey });
    }
  });

  return { nodes, links };
}