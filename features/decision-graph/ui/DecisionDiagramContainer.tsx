// features/decision-graph/ui/DecisionDiagramContainer.tsx
"use client";
import { useDecisionGraph } from "../hooks/useDecisionGraph";
import type { ProfileInput } from "@/lib/validation/decision-graph";
import DecisionDiagram from "@/features/decision-graph/ui/DecisionDiagram"; // tu demo existente


export default function DecisionDiagramContainer({ profile }: { profile: ProfileInput }) {
  const { data, isLoading, error } = useDecisionGraph(profile);

  if (isLoading) return <div>Cargando diagrama...</div>;
  if (error) return <div>Error: {String(error)}</div>;
// features/decision-graph/ui/DecisionDiagramContainer.tsx

  if (!data) return <div>Sin datos</div>;

  const nodeDataArray = data.nodes.map((n) => ({
    key: n.key,
    parent: n.parent ?? undefined,
    text: n.title,
    meta: n.meta,
  }));

  const linkDataArray =
    (data as any).links?.map((l: { from: string; to: string }) => ({ from: l.from, to: l.to })) ??
    data.nodes
      .filter((n) => n.parent)
      .map((n) => ({ from: n.parent as string, to: n.key }));

  return <DecisionDiagram nodeDataArray={nodeDataArray} linkDataArray={linkDataArray} />;
}
