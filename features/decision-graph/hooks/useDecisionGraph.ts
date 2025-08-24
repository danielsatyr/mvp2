// features/decision-graph/hooks/useDecisionGraph.ts
import useSWR from "swr";
import { mapToGraphWithEligibility, visaStatus } from "../services/mapToGraph";
import { useEligibilityCascader, CascaderState } from "./useEligibilityCascader";
import type { DiagramNode, DiagramLink, UserProfile } from "../types";

// (opcional) lookup global si existiera
declare const getOccupationByAnzsco:
  | ((anzsco: string) => { skillAssessmentBody?: string } | null | undefined)
  | undefined;

export type Profile = Partial<UserProfile> & {
  occupationId?: number;
  anzscoCode?: string;
  englishLevel?: string;
  points?: number;
  userId?: number;
  age?: number;
  skillAssessmentBody?: string | null;
};

type Maybe<T> = T | null | undefined;

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
};

// ---- Resolver organismo (Skill Assessment)
function resolveSkillAssessor(args: {
  profile: { anzscoCode?: Maybe<string>; skillAssessmentBody?: Maybe<string> };
  occupationByAnzsco?: (anzsco: string) => Maybe<{ skillAssessmentBody?: string }>;
  fetchedAssessor?: Maybe<string>;
}): string | undefined {
  const fromProfile = args.profile.skillAssessmentBody?.trim();
  if (fromProfile) return fromProfile;

  const fromFetch = args.fetchedAssessor?.trim();
  if (fromFetch) return fromFetch;

  const code = args.profile.anzscoCode?.trim();
  if (code && args.occupationByAnzsco) {
    const occ = args.occupationByAnzsco(code);
    const fromOcc = occ?.skillAssessmentBody?.trim();
    if (fromOcc) return fromOcc;
  }
  return undefined;
}

export function useDecisionGraph(profile: Profile, ui: CascaderState) {
  const { selectedVisa, selectedState, selectedPathwayId } = ui || {};

  // ---- Visas disponibles
  const q = new URLSearchParams();
  if (profile?.occupationId) q.set("occupationId", String(profile.occupationId));
  if (profile?.anzscoCode) q.set("anzscoCode", String(profile.anzscoCode));

  const {
    data: visas,
    error: visasError,
    isLoading: visasLoading,
  } = useSWR<string[]>(
    q.toString() ? `/api/eligibility/visas?${q.toString()}` : null,
    fetcher
  );

  // ---- Cascader oficial
  const cascader = useEligibilityCascader(
    { occupationId: profile?.occupationId, anzscoCode: profile?.anzscoCode },
    { selectedVisa, selectedState, selectedPathwayId }
  );

  // ---- Fallback assessor por ANZSCO
  const { data: occByCode, error: occByCodeErr } = useSWR<any>(
    profile?.anzscoCode
      ? `/api/occupations?anzscoCode=${encodeURIComponent(profile.anzscoCode)}`
      : null,
    fetcher
  );

  const shouldFallbackList =
    Boolean(profile?.anzscoCode) &&
    (occByCodeErr?.message === "404" ||
      occByCodeErr?.message === "400" ||
      typeof occByCode === "undefined");

  const { data: occList } = useSWR<any[]>(
    shouldFallbackList ? "/api/occupations" : null,
    fetcher
  );

  let fetchedAssessor: string | undefined;
  if (occByCode && typeof occByCode === "object") {
    const candidate = Array.isArray(occByCode) ? occByCode[0] : occByCode;
    fetchedAssessor =
      candidate?.skillAssessmentBody ??
      candidate?.skill_assessment_body ??
      undefined;
  } else if (Array.isArray(occList) && profile?.anzscoCode) {
    const found = occList.find(
      (o) =>
        String(o?.anzscoCode ?? o?.anzsco_code ?? "").trim() ===
        String(profile.anzscoCode).trim()
    );
    fetchedAssessor =
      found?.skillAssessmentBody ?? found?.skill_assessment_body ?? undefined;
  }

  // ================================
  // 🔁 Fallback HTTP para STATES/PATHWAYS si el cascader viene vacío
  // ================================
  const { data: apiStates } = useSWR<any[]>(
    profile?.anzscoCode && selectedVisa && (!Array.isArray(cascader.states) || cascader.states.length === 0)
      ? `/api/eligibility/states?anzscoCode=${encodeURIComponent(
          profile.anzscoCode!
        )}&visa=${selectedVisa}`
      : null,
    fetcher
  );

  const { data: apiPathways } = useSWR<any[]>(
    profile?.anzscoCode &&
      selectedVisa &&
      selectedState &&
      (!Array.isArray(cascader.pathways) || cascader.pathways.length === 0)
      ? `/api/eligibility/pathways?anzscoCode=${encodeURIComponent(
          profile.anzscoCode!
        )}&visa=${selectedVisa}&state=${encodeURIComponent(selectedState)}`
      : null,
    fetcher
  );

  // Fusionar: cascader si trae; si no, fallback HTTP
  const mergedStates: any[] = Array.isArray(cascader.states) && cascader.states.length
    ? cascader.states
    : Array.isArray(apiStates)
    ? apiStates
    : [];

  const mergedPathways: any[] = Array.isArray(cascader.pathways) && cascader.pathways.length
    ? cascader.pathways
    : Array.isArray(apiPathways)
    ? apiPathways
    : [];

  // ---- Grafo base
  const score = profile?.points ?? 0;
  const startLabel = `Total: ${score} pts`;

  const baseNodes: DiagramNode[] = [
    { key: "Start", text: startLabel, status: "info", isTreeExpanded: true },
    {
      key: "skill-assessment",
      text: `Skill assessment: ${profile?.skillAssessmentBody ?? "N/A"}`,
      status: "info",
    },
    { key: "elig-visas", text: "Visas disponibles por ocupación", status: "info" },
  ];

  const baseLinks: DiagramLink[] = [
    { from: "Start", to: "skill-assessment" },
    { from: "skill-assessment", to: "elig-visas" },
  ];

  // Nodos de visas
  (visas ?? []).forEach((v) => {
    const visaKey = `visa-${v}` as const;
    baseNodes.push({
      key: visaKey,
      text:
        v === "189"
          ? "189 — Skilled Independent"
          : v === "190"
          ? "190 — State Nominated"
          : "491 — Skilled Work Regional",
      status: visaStatus(v as "189" | "190" | "491", profile.points ?? 0),
      isTreeExpanded: false,
    });
    baseLinks.push({ from: "elig-visas", to: visaKey });
  });

  const baseGraph = { nodes: baseNodes, links: baseLinks };

  // ---- Perfil para grafo
  const profileForGraph: UserProfile & { points?: number } = {
    userId: Number(profile.userId ?? 0),
    age: profile.age ?? 0,
    englishLevel:
      (profile.englishLevel as UserProfile["englishLevel"]) ?? "Competent",
    workExperience_in: 0,
    workExperience_out: 0,
    education_qualification: "",
    occupationId: Number(profile.occupationId ?? 0),
    occupation_name: profile.anzscoCode ?? "",
    points: profile.points,
  };

  // Pathways según selección
  const pathwaysForGraph = selectedPathwayId
    ? mergedPathways.filter((p: any) => p?.pathwayId === selectedPathwayId)
    : mergedPathways;

  // ---- Normalizaciones
  const normalizedStates: string[] = Array.isArray(mergedStates)
    ? mergedStates.map((s: any) =>
        typeof s === "object" && s !== null && "state" in s
          ? String((s as any).state)
          : String(s)
      )
    : [];

  const mappedPathwaysForGraph = Array.isArray(pathwaysForGraph)
    ? pathwaysForGraph.map((p: any) => ({
        pathwayId: String(p?.pathwayId ?? p?.id ?? p?.code ?? "unknown"),
        title: String(p?.title ?? p?.name ?? p?.prefix ?? p?.pathwayId ?? "Pathway"),
        prefix: typeof p?.prefix === "string" ? p.prefix : undefined,
        rules: Array.isArray(p?.rules) ? p.rules : [],
        meta: p ?? {},
      }))
    : [];

  // ---- Mapear
  const graph = mapToGraphWithEligibility(baseGraph, {
    profile: profileForGraph,
    selectedVisa,
    selectedState,
    selectedPathwayId,
    states: normalizedStates,
    pathways: mappedPathwaysForGraph,
  });

  // ---- Skill assessor definitivo
  const lookupByAnzsco =
    typeof getOccupationByAnzsco === "function" ? getOccupationByAnzsco : undefined;

  const assessor = resolveSkillAssessor({
    profile: {
      anzscoCode: profile.anzscoCode,
      skillAssessmentBody: (profile as any)?.skillAssessmentBody,
    },
    occupationByAnzsco: lookupByAnzsco,
    fetchedAssessor,
  });

  if (assessor) {
    const node = graph.nodes.find((n) => n.key === "skill-assessment");
    if (node) {
      node.text = `Skill assessment: ${assessor}`;
      (node as any).tooltipHtml = `<div><b>Skill Assessment Body</b><br/>${assessor}</div>`;
      node.isTreeExpanded = true;
    }
  }

  // ---- Contenedor de Estados (nivel 3)
  if (selectedVisa && normalizedStates.length) {
    const parentVisaKey = `visa-${selectedVisa}`;
    const statesNodeKey = `states:${selectedVisa}`;
    const exists = graph.nodes.some((n) => n.key === statesNodeKey);
    if (!exists) {
      const statesListHtml = `<div><b>States (${selectedVisa})</b><ul style="margin:6px 0 0 14px;padding:0;">${
        normalizedStates.map((s) => `<li>${s}</li>`).join("")
      }</ul></div>`;

      graph.nodes.push({
        key: statesNodeKey,
        text: `States — ${selectedVisa} (${normalizedStates.length})`,
        status: "info",
        parent: parentVisaKey,
        isTreeExpanded: true,
        // @ts-ignore
        tooltipHtml: statesListHtml,
      });

      graph.links.push({
        key: `link:${parentVisaKey}->${statesNodeKey}`,
        from: parentVisaKey,
        to: statesNodeKey,
        label: "info",
      });
    }
  }

  return {
    graph,
    visas: visas ?? [],
    // devolvemos los fusionados para que el dashboard pueda autoseleccionar
    states: mergedStates,
    pathways: mergedPathways,
    loading: Boolean(visasLoading || cascader.loading),
    error: visasError || cascader.error || null,
  };
}
