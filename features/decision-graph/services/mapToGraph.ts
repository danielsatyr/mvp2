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
  return Object.values(breakdown).reduce((acc, n) => acc + (Number(n) || 0), 0);
}

/** Estado de la visa según puntos + bonus (190=+5, 491=+15) */
export function visaStatus(
  visa: "189" | "190" | "491",
  points: number
): DiagramNode["status"] {
  const bonus = visa === "190" ? 5 : visa === "491" ? 15 : 0;
  const total = (Number(points) || 0) + bonus;
  if (total >= 65) return "ok";
  if (total >= 55) return "warn";
  return "fail";
}

/**
 * Grafo mínimo a partir de perfil + ocupación + breakdown.
 * - Start con puntaje
 * - Occupation info básica
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
      text: `Occupation: ${occ.name} (${(occ as any).occupationId ?? ""})`,
      status: "info",
      tooltipHtml:
        `<div><b>Skill level:</b> ${(occ as any).Skill_Level_Required ?? ""}</div>` +
        `<div><b>Authority:</b> ${(occ as any).skill_assessment_body ?? ""}</div>`,
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

  if ((occ as any).mltsslFlag) {
    nodes.push({
      key: "visa-189",
      text: "189 — Skilled Independent",
      status: "info",
    } as DiagramNode);
    links.push({ from: "elig-visas", to: "visa-189" });
  }
  if ((occ as any).stsolFlag) {
    nodes.push({
      key: "visa-190",
      text: "190 — State Nominated",
      status: "info",
    } as DiagramNode);
    links.push({ from: "elig-visas", to: "visa-190" });
  }
  if ((occ as any).rolFlag) {
    nodes.push({
      key: "visa-491",
      text: "491 — Skilled Work Regional",
      status: "info",
    } as DiagramNode);
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
 * Agrega ramas de estados/pathways/resumen bajo la visa seleccionada.
 */
export function mapToGraphWithEligibility(
  baseGraph: { nodes: DiagramNode[]; links: DiagramLink[] },
  options: {
    profile: UserProfile;
    selectedVisa?: "189" | "190" | "491";
    states?: string[];
    selectedState?: string;
    pathways?: Array<{
      pathwayId: string;
      title: string;
      prefix?: string;
      rules: any[];
      meta: any;
    }>;
    selectedPathwayId?: string;
  }
) {
  const g = { nodes: [...baseGraph.nodes], links: [...baseGraph.links] };

  if (!options.selectedVisa) return g;

  const visaKey = findVisaNodeKey(g.nodes, options.selectedVisa);
  if (!visaKey) return g;

  // 189 no usa contenedor de estados
  if (options.selectedVisa === "189") return g;

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

  // 2) Nodo del estado seleccionado
  if (options.selectedState) {
    const stateKey = `state:${options.selectedVisa}:${options.selectedState}`;

    if (!g.nodes.some((n) => n.key === stateKey)) {
      g.nodes.push({
        key: stateKey,
        text: options.selectedState,
        status: "info",
        parent: statesContainerKey,
        isTreeExpanded: true,
      } as DiagramNode);
      g.links.push({ from: statesContainerKey, to: stateKey });
    }

    const pws = options.pathways ?? [];
    const toRender = options.selectedPathwayId
      ? pws.filter((pw) => pw.pathwayId === options.selectedPathwayId)
      : pws;

    for (const pw of toRender) {
      const pwKey = `pw:${options.selectedVisa}:${options.selectedState}:${pw.pathwayId}`;
      if (!g.nodes.some((n) => n.key === pwKey)) {
        g.nodes.push({
          key: pwKey,
          text: pw.prefix ?? pw.title ?? pw.pathwayId,
          status: "info",
          parent: stateKey,
        } as DiagramNode);
        g.links.push({ from: stateKey, to: pwKey });
      }

      // Resumen de brechas
      let fails = 0;
      let warns = 0;
      for (const r of pw.rules) {
        const s = statusFromRule(options.profile, r);
        if (s === "fail") fails++;
        else if (s === "warn") warns++;
      }

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
 * aceptando variantes de NodeDTO (text | label | title) y status opcional.
 */
export function mapToGraph(
  dto: DecisionGraphDTO,
  profile: any,
  breakdown: Breakdown
): { nodes: DiagramNode[]; links: DiagramLink[] } {
  const score = scoreFromBreakdown(breakdown);

  const rawNodes: any[] = Array.isArray((dto as any)?.nodes)
    ? (dto as any).nodes
    : [];

  const nodes: DiagramNode[] = rawNodes.map((n: any) => ({
    key: String(n?.key),
    text: String(n?.text ?? n?.label ?? n?.title ?? n?.key ?? ""),
    parent: n?.parent ?? undefined,
    status: (n?.status as DiagramNode["status"]) ?? "info",
    tooltipHtml: typeof n?.tooltipHtml === "string" ? n.tooltipHtml : undefined,
    isTreeExpanded: true,
  }));

  const links: DiagramLink[] = [];
  for (const n of rawNodes) {
    if (n?.parent) {
      links.push({ from: String(n.parent), to: String(n.key) });
    }
  }

  // Ajustar Start con puntaje
  const startNode = nodes.find((n) => n.key === "start" || n.key === "Start");
  if (startNode) startNode.text = `Total: ${score} pts`;

  // Estados por defecto para nodos visa:* si vinieron sin status
  for (const n of nodes) {
    const m = String(n.key).match(/^visa[:\-](\d{3})$/);
    if (m && !n.status) {
      const v = m[1] as "189" | "190" | "491";
      n.status = visaStatus(v, score); // usa la misma regla
    }
  }

  return { nodes, links };
}
