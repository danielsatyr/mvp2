// features/decision-graph/services/buildDecisionGraph.ts
import type { DecisionGraphDTO } from "../types/dto";
import type { ProfileInput } from "@/lib/validation/decision-graph";
import { prisma } from "@/lib/prisma";

export async function buildDecisionGraph(profile: ProfileInput): Promise<DecisionGraphDTO> {
  const rootKey = "start";
  const occupationKey = `occ:${profile.occupationId ?? "unknown"}`;
  const eligibilityKey = "eligibility:baseline";

  // 1) Resolver nombre + ANZSCO desde Occupation usando el occupationId (string)
  //    profile.occupationId debe contener el occupationId único de tu tabla Occupation.
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

  return {
    nodes: [
      { key: rootKey, parent: null, title: "Start" },
      { key: occupationKey, parent: rootKey, title: occTitle },
      { key: eligibilityKey, parent: occupationKey, title: "Baseline eligibility (mock)" },
    ],
  };
}
