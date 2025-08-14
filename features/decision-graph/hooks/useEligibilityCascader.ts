import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
});

export type CascaderState = {
  selectedVisa?: "189" | "190" | "491";
  selectedState?: string; // "VIC", "QLD", etc.
  selectedPathwayId?: string;
};

export function useEligibilityCascader(
  baseParams: { occupationId?: string; anzscoCode?: string },
  ui: CascaderState
) {
  const q = new URLSearchParams();
  if (baseParams.occupationId) q.set("occupationId", baseParams.occupationId);
  if (baseParams.anzscoCode) q.set("anzscoCode", baseParams.anzscoCode);

  // Paso 2: estados (solo si hay visa seleccionada y != 189)
  const statesKey =
    ui.selectedVisa && ui.selectedVisa !== "189"
      ? `/api/eligibility/states?visa=${ui.selectedVisa}&${q.toString()}`
      : null;

  const { data: states, error: statesError, isLoading: statesLoading } = useSWR<string[]>(
    statesKey, fetcher
  );

  // Paso 3: pathways (solo si ya hay state + visa 190/491)
  const pathwaysKey =
    ui.selectedVisa && ui.selectedVisa !== "189" && ui.selectedState
      ? `/api/eligibility/pathways?visa=${ui.selectedVisa}&state=${ui.selectedState}&${q.toString()}`
      : null;

  const { data: pathways, error: pathwaysError, isLoading: pathwaysLoading } = useSWR<any[]>(
    pathwaysKey, fetcher
  );

  return {
    states: states ?? [],
    pathways: pathways ?? [],
    loading: statesLoading || pathwaysLoading,
    error: statesError || pathwaysError || null,
  };
}
