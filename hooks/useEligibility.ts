// hooks/useEligibility.ts
// Hook para obtener datos de elegibilidad desde /api/occupations/[id]

import useSWR from "swr";
import type { EligibilityResponse } from "@/types/occupation";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Error fetching eligibility");
    return res.json();
  });

/**
 * useEligibility
 * @param occupationId ID de la ocupación seleccionada
 * @returns { data, isLoading, error }
 */
export function useEligibility(occupationId: number | null) {
  const shouldFetch = occupationId !== null && occupationId !== 0;
  const { data, error } = useSWR<EligibilityResponse>(
    shouldFetch ? `/api/occupations/${occupationId}` : null,
    fetcher,
  );
  return {
    data,
    isLoading: shouldFetch && !error && !data,
    error,
  };
}
