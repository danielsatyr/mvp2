// components/StateEligibility.tsx
// Usa datos de la tabla `EligibilityFactor` (columnas: state, pathway, requisito, valor)
import React from "react";

type StateFactor = {
  state: string;
  pathway: string | null;
  requisito: string;
  valor: string;
};

export function StateEligibility({
  stateFactors,
}: {
  stateFactors: StateFactor[];
}) {
  const grouped = stateFactors.reduce(
    (acc, curr) => {
      acc[curr.state] = acc[curr.state] || [];
      acc[curr.state].push(curr);
      return acc;
    },
    {} as Record<string, StateFactor[]>,
  );

  return (
    <div className="mt-4">
      {Object.entries(grouped).map(([state, factors]) => (
        <div key={state} className="mb-3">
          <h3 className="font-semibold mb-1">{state}</h3>
          <ul className="ml-4 list-disc">
            {factors.map((f, idx) => (
              <li key={idx}>
                {f.pathway}: {f.requisito} – {f.valor}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
