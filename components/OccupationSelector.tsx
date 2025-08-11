// components/OccupationSelector.tsx
import React from "react";
import useSWR from "swr";

type OccupationBasic = { occupationId: number; name: string };

// 1) Define el fetcher
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Error fetching occupations");
    return res.json();
  });

export function OccupationSelector({
  selected,
  onChange,
}: {
  selected: number | null;
  onChange: (id: number) => void;
}) {
  // 2) Pásaselo a useSWR
  const { data, error } = useSWR<OccupationBasic[]>(
    "/api/occupations",
    fetcher,
  );

  if (!data && !error) return <p>Loading occupations...</p>;
  if (error) return <p className="text-red-600">Error loading occupations</p>;

  return (
    <select
      value={selected ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className="border rounded p-2 w-full max-w-sm"
    >
      <option value="" disabled>
        Select occupation
      </option>
      {(data ?? []).map((occ) => (
      <option key={occ.occupationId} value={occ.occupationId}>
        {occ.name}
      </option>
    ))}
    </select>
  );
}
