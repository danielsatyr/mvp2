// features/decision-graph/mapToGraph.ts
import {
  Breakdown,
  DiagramLink,
  DiagramNode,
  OccupationRow,
  UserProfile,
} from "./types";

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
        `<div><b>English:</b> ${profile.englishLevel}</div>`
    },
    {
      key: "occ",
      text: `Occupation: ${occ.name} (${occ.occupation_id})`,
      status: "info",
      tooltipHtml:
        `<div><b>Skill level:</b> ${occ.Skill_Level_Required}</div>` +
        `<div><b>Authority:</b> ${occ.skill_assessment_body}</div>`
    },
    {
      key: "elig-visas",
      text: "Visas disponibles por ocupación",
      status: "info"
    }
  ];

  const links: DiagramLink[] = [
    { from: "Start", to: "occ" },
    { from: "Start", to: "elig-visas" }
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
      tooltip: "Puntos + skill assessment + inglés. Sin nominación estatal."
    });
    links.push({ from: "elig-visas", to: "visa-189" });
  }

  if (show190) {
    nodes.push({
      key: "visa-190",
      text: "190 — State Nominated",
      status: visaStatus("190", score),
      isTreeExpanded: false,
      tooltip: "Nominación estatal. Requisitos varían por estado/pathway."
    });
    links.push({ from: "elig-visas", to: "visa-190" });
  }

  if (show491) {
    nodes.push({
      key: "visa-491",
      text: "491 — Skilled Work Regional",
      status: visaStatus("491", score),
      isTreeExpanded: false,
      tooltip: "Nominación estatal o familiar. Requisitos regionales."
    });
    links.push({ from: "elig-visas", to: "visa-491" });
  }

  return { nodes, links };
}
