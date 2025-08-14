import useSWR from "swr";
import { mapToGraphWithEligibility } from "../services/mapToGraph";
import { useEligibilityCascader, CascaderState } from "./useEligibilityCascader";
import type { DiagramNode, DiagramLink } from "../types";

// Ajusta este tipo a tu modelo real si ya lo tienes en ../types
type Profile = {
  occupationId?: string;
  anzscoCode?: string;
  englishLevel?: string;
  points?: number;
  userId?: number | string;
  age?: number;
};

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  });

export function useDecisionGraph(profile: Profile, ui: CascaderState) {
  // Desestructuramos aquí para que EXISTAN en el scope
  const { selectedVisa, selectedState, selectedPathwayId } = ui || {};

  // ---- Visas disponibles (Paso 1) ----
  const q = new URLSearchParams();
  if (profile?.occupationId) q.set("occupationId", String(profile.occupationId));
  if (profile?.anzscoCode) q.set("anzscoCode", String(profile.anzscoCode));

  const { data: visas, error: visasError, isLoading: visasLoading } = useSWR<string[]>(
    q.toString() ? `/api/eligibility/visas?${q.toString()}` : null,
    fetcher
  );

  // ---- Cascada (Paso 2 y 3) ----
  const cascader = useEligibilityCascader(
    { occupationId: profile?.occupationId, anzscoCode: profile?.anzscoCode },
    { selectedVisa, selectedState, selectedPathwayId }
  );

  // ---- baseGraph: Start + Elig Visas + nodos visa-xxx ----
  // (No incluimos Occupation aquí; si ya lo pintas en otro lado, genial)
  const startLabel = `Total: ${profile?.points ?? 0} pts`;

  const baseNodes: DiagramNode[] = [
    { key: "Start", text: startLabel, status: "info", isTreeExpanded: true },
    { key: "elig-visas", text: "Visas disponibles por ocupación", status: "info" },
  ];


  
  const baseLinks: DiagramLink[] = [
    { from: "Start", to: "elig-visas" },
  ];

  // Añadimos los nodos de visas si existen
  (visas ?? []).forEach((v) => {
    const visaKey = `visa-${v}` as const;
    baseNodes.push({
      key: visaKey,
      text: v === "189"
        ? "189 — Skilled Independent"
        : v === "190"
        ? "190 — State Nominated"
        : "491 — Skilled Work Regional",
      status: "info",
      isTreeExpanded: false,
    });
    baseLinks.push({ from: "elig-visas", to: visaKey });
  });


  
  const baseGraph = { nodes: baseNodes, links: baseLinks };

  // ---- Extender con estados/pathways/reglas (Paso 4) ----
  const graph = mapToGraphWithEligibility(baseGraph, {
    profile,
    selectedVisa,
    selectedState,
    selectedPathwayId,
    states: cascader.states,
    pathways: cascader.pathways,
  });

  return {
    graph,
    visas: visas ?? [],
    states: cascader.states,
    pathways: cascader.pathways,
    loading: Boolean(visasLoading || cascader.loading),
    error: visasError || cascader.error || null,
  };
}
