// pages/dev/diag.tsx
import dynamic from "next/dynamic";
import type { DecisionDiagramNode, DecisionDiagramLink } from "@/components/DecisionDiagram";

// Import dinámico para evitar SSR con GoJS
const DecisionDiagram = dynamic(
  () => import("@/components/DecisionDiagram"),
  { ssr: false }
);

export default function DevDiag() {
  // Demo fijo con tipos correctos
  const nodeDataArray: DecisionDiagramNode[] = [
    { key: "Start", text: "Total: 98 pts", status: "info", isTreeExpanded: true },
    { key: "elig-visas", text: "Visas disponibles por ocupación", status: "info" },
    { key: "visa-189", text: "189 — Skilled Independent", status: "ok" },
    { key: "visa-190", text: "190 — State Nominated", status: "warn" },
    { key: "visa-491", text: "491 — Skilled Work Regional", status: "ok" },
  ];

  const linkDataArray: DecisionDiagramLink[] = [
    { from: "Start", to: "elig-visas" },
    { from: "elig-visas", to: "visa-189" },
    { from: "elig-visas", to: "visa-190" },
    { from: "elig-visas", to: "visa-491" },
  ];

  return (
    <div style={{ height: 600, padding: 16 }}>
      <DecisionDiagram nodeDataArray={nodeDataArray} linkDataArray={linkDataArray} />
    </div>
  );
}
