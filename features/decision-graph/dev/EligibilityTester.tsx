import { useState, useEffect } from "react";
import { useDecisionGraph } from "../hooks/useDecisionGraph";

type Props = {
  anzscoCode?: string;
  occupationId?: string;
  defaultVisa?: "189" | "190" | "491";
};

export default function EligibilityTester({ anzscoCode = "261313", occupationId, defaultVisa = "190" }: Props) {
  const [selectedVisa, setSelectedVisa] = useState<"189"|"190"|"491" | undefined>(defaultVisa);
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined);
  const [selectedPathwayId, setSelectedPathwayId] = useState<string | undefined>(undefined);

  const profile = {
    anzscoCode,
    occupationId,
    englishLevel: "Proficient",
    points: 70,
    userId: "demo",
    age: 32,
  };

  const { graph, visas, states, pathways, loading, error } = useDecisionGraph(
    profile,
    { selectedVisa, selectedState, selectedPathwayId }
  );

  // Si llega visas y no hay seleccion, setear la primera que no sea 189
  useEffect(() => {
    if (!selectedVisa && visas?.length) {
      setSelectedVisa((visas.includes("190") ? "190" : visas[0]) as any);
    }
  }, [visas, selectedVisa]);

  // Resetear state y pathway al cambiar visa
  useEffect(() => {
    setSelectedState(undefined);
    setSelectedPathwayId(undefined);
  }, [selectedVisa]);

  if (loading) return <div className="p-4">Cargando…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {String(error)}</div>;

  return (
    <div className="p-4 grid gap-4">
      <div className="flex gap-4 items-center">
        <label className="font-medium">Visa:</label>
        <select
          className="border rounded px-2 py-1"
          value={selectedVisa ?? ""}
          onChange={(e) => setSelectedVisa(e.target.value as any)}
        >
          <option value="">-- elegir --</option>
          {visas.map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        {selectedVisa && selectedVisa !== "189" && (
          <>
            <label className="font-medium ml-4">State:</label>
            <select
              className="border rounded px-2 py-1"
              value={selectedState ?? ""}
              onChange={(e) => setSelectedState(e.target.value || undefined)}
            >
              <option value="">-- elegir --</option>
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </>
        )}

        {selectedVisa && selectedVisa !== "189" && selectedState && (
          <>
            <label className="font-medium ml-4">Pathway:</label>
            <select
              className="border rounded px-2 py-1"
              value={selectedPathwayId ?? ""}
              onChange={(e) => setSelectedPathwayId(e.target.value || undefined)}
            >
              <option value="">-- elegir --</option>
              {pathways.map(pw => (
                <option key={pw.pathwayId} value={pw.pathwayId}>
                  {pw.title ?? pw.pathwayId}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Visas / States / Pathways</h3>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
{JSON.stringify({ visas, states, pathways }, null, 2)}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Graph</h3>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
{JSON.stringify(graph, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
