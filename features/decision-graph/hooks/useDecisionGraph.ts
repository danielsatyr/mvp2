import useSWR from "swr";
import { mapToGraphMinimal } from "../mapToGraph";
import type { Breakdown, OccupationRow, UserProfile } from "../types";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function normalizeBreakdown(data: any): { breakdown: Breakdown | null; score: number | null } {
  if (!data) return { breakdown: null, score: null };
  if (data.breakdown) {
    const score = typeof data.score === "number"
      ? data.score
      : Object.values(data.breakdown).reduce((a: number, n: number) => a + (n || 0), 0);
    return { breakdown: data.breakdown as Breakdown, score };
  }
  const b = data as Breakdown;
  const score = Object.values(b).reduce((a, n) => a + (n || 0), 0);
  return { breakdown: b, score };
}

// ⚠️ Exportamos nombrado Y default para evitar desajustes en el import
export function useDecisionGraph() {
  const { data, error, isLoading, mutate } = useSWR("/api/profile/breakdown", fetcher, {
    revalidateOnFocus: false,
  });

  const { breakdown, score } = normalizeBreakdown(data);

  // MOCKS por ahora (luego conectamos DB)
  const profile: UserProfile = {
    userId: 1,
    age: 30,
    englishLevel: "Superior",
    workExperience_in: 2,
    workExperience_out: 5,
    education_qualification: "Bachelor",
    australianStudy: true,
    regionalStudy: false,
    communityLanguage: false,
    professionalYear: false,
    partnerSkill: "",
    nominationType: "",
    occupation_id: 261313,
    occupation_name: "Software Engineer",
  };

  const occ: OccupationRow = {
    occupation_id: 261313,
    name: "Software Engineer",
    anzsco_code: "261313",
    skill_assessment_body: "ACS",
    Skill_Level_Required: 1,
    visa_189: "Yes",
    visa_190: "Yes",
    visa_491: "Yes",
  };

  const { nodes, links } = breakdown
    ? mapToGraphMinimal(profile, occ, breakdown)
    : { nodes: [], links: [] };

  return { nodes, links, breakdown, score, isLoading, error, refresh: mutate };
}

export default useDecisionGraph;
