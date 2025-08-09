// features/decision-graph/hooks/useDecisionGraph.ts
import useSWR from "swr";
import type { DecisionGraphDTO } from "../types/dto";
import type { ProfileInput } from "@/lib/validation/decision-graph";

const fetcher = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });

export function useDecisionGraph(profile: ProfileInput | null) {
  const shouldFetch = Boolean(profile);
  const { data, error, isLoading, mutate } = useSWR<DecisionGraphDTO>(
    shouldFetch ? ["/api/decision-graph", profile] : null,
    ([url, body]) => fetcher(url, body)
  );
  return { data, error, isLoading, mutate };
}