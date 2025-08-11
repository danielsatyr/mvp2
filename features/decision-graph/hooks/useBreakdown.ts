// features/profile/hooks/useBreakdown.ts
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type Breakdown = {
  visa: number; age: number; english: number; workOutside: number; workInside: number;
  education: number; specialist: number; australianStudy: number; communityLanguage: number;
  regionalStudy: number; professionalYear: number; partner: number; nomination: number;
};

function toBreakdownAndScore(raw: any): { breakdown: Breakdown | null; score: number | null } {
  if (!raw) return { breakdown: null, score: null };
  if (raw.breakdown) {
    const score = typeof raw.score === "number"
      ? raw.score
      : Object.values(raw.breakdown).reduce((a: number, n: number) => a + (n || 0), 0);
    return { breakdown: raw.breakdown as Breakdown, score };
  }
  // Si el endpoint devuelve el breakdown como objeto plano:
  const b = raw as Breakdown;
  const score = Object.values(b).reduce((a, n) => a + (n || 0), 0);
  return { breakdown: b, score };
}

export function useBreakdown() {
  const { data, error, isLoading, mutate } = useSWR("/api/profile/breakdown", fetcher, {
    revalidateOnFocus: false,
  });

  const { breakdown, score } = toBreakdownAndScore(data);
  return { breakdown, score, isLoading, error, refresh: mutate };
}