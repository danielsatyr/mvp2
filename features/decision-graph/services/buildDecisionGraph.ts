// features/decision-graph/services/buildDecisionGraph.ts
import type { DecisionGraphDTO } from "../types/dto";
import type { ProfileInput } from "@/lib/validation/decision-graph";

export async function buildDecisionGraph(profile: ProfileInput): Promise<DecisionGraphDTO> {
  // TODO: luego reemplazar por repositorios/DB
  const rootKey = "start";
  const occupationKey = `occ:${profile.occupationCode}`;
  const eligibilityKey = "eligibility:baseline";

  return {
    nodes: [
      { key: rootKey, parent: null, title: "Start" },
      { key: occupationKey, parent: rootKey, title: `Occupation ${profile.occupationCode}` },
      { key: eligibilityKey, parent: occupationKey, title: "Baseline eligibility (mock)" },
    ],
  };
}