// features/decision-graph/hooks/useEligibilityCascader.ts
import useSWR from "swr";

export type CascaderState = {
  selectedVisa?: "189" | "190" | "491";
  selectedState?: string;
  selectedPathwayId?: string;
};

type Input = {
  occupationId?: number | null;
  anzscoCode?: string | null;
};

type StateItem = { state: string; [k: string]: any };
type PathwayItem = { pathwayId: string; prefix?: string; [k: string]: any };

// ---- Fetchers via API endpoints ----
const fetchStates = async (
  anzscoCode?: string | null,
  visa?: "189" | "190" | "491"
): Promise<StateItem[]> => {
  if (!anzscoCode || !visa) return [];
  const res = await fetch(
    `/api/eligibility/states?anzscoCode=${encodeURIComponent(
      anzscoCode
    )}&visa=${visa}`
  );
  if (!res.ok) throw new Error("Error fetching states");
  const data = await res.json();
  return Array.isArray(data) ? data : data.states ?? [];
};

const fetchPathways = async (
  anzscoCode?: string | null,
  visa?: "189" | "190" | "491",
  state?: string
): Promise<PathwayItem[]> => {
  if (!anzscoCode || !visa || !state) return [];
  const res = await fetch(
    `/api/eligibility/pathways?anzscoCode=${encodeURIComponent(
      anzscoCode
    )}&visa=${visa}&state=${encodeURIComponent(state)}`
  );
  if (!res.ok) throw new Error("Error fetching pathways");
  const data = await res.json();
  return Array.isArray(data) ? data : data.pathways ?? [];
};

// ---- Main hook ----
export function useEligibilityCascader(
  input: Input,
  ui: CascaderState
): {
  states: StateItem[];
  pathways: PathwayItem[];
  loading: boolean;
  error: any;
} {
  const anzsco = input?.anzscoCode ?? null;
  const visa = ui?.selectedVisa ?? undefined;
  const state = ui?.selectedState ?? undefined;

  // STATES
  const {
    data: states,
    error: statesError,
    isLoading: statesLoading,
  } = useSWR(
    anzsco && visa ? ["elig-states", anzsco, visa] : null,
    (_key, a: string, v: "189" | "190" | "491") => fetchStates(a, v),
    { keepPreviousData: true }
  );

  const selectedStateStillValid =
    state && Array.isArray(states)
      ? states.some((s: any) =>
          typeof s === "object" && s !== null && "state" in s
            ? String((s as any).state) === state
            : String(s) === state
        )
      : false;

  // PATHWAYS
  const effectiveState = selectedStateStillValid ? state : undefined;
  const {
    data: pathways,
    error: pathwaysError,
    isLoading: pathwaysLoading,
  } = useSWR(
    anzsco && visa && effectiveState
      ? ["elig-pathways", anzsco, visa, effectiveState]
      : null,
    (_key, a: string, v: "189" | "190" | "491", st: string) =>
      fetchPathways(a, v, st),
    { keepPreviousData: true }
  );

  return {
    states: states ?? [],
    pathways: pathways ?? [],
    loading: Boolean(statesLoading || pathwaysLoading),
    error: statesError || pathwaysError || null,
  };
}
