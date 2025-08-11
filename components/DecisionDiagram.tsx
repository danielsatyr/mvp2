import * as go from "gojs";
import { ReactDiagram } from "gojs-react";
import { useCallback, useMemo } from "react";

export interface DecisionDiagramNode {
  key: string;
  text: string;
  isTreeExpanded?: boolean;
  tooltip?: string;
  tooltipHtml?: string; // ✅ añadimos esto
  status?: "ok" | "warn" | "fail" | "info"; // 👈 nuevo

}

export interface DecisionDiagramLink {
  key?: string;
  from: string;
  to: string;
  label?: string;
}

export interface DecisionDiagramProps {
  nodeDataArray: DecisionDiagramNode[];
  linkDataArray: DecisionDiagramLink[];
}



export default function DecisionDiagram({
  nodeDataArray,
  linkDataArray,
}: DecisionDiagramProps) {
  // Asegurar que cada link tenga una propiedad 'key'
  const linksWithKey = useMemo(
    () =>
      linkDataArray.map((link, idx) => ({
        key: link.key ?? `link${idx}`,
        ...link,
      })),
    [linkDataArray],
  );

  const initDiagram = useCallback(() => {
  const $ = go.GraphObject.make;
  const diagram = $(go.Diagram, {
    "undoManager.isEnabled": true,
    layout: $(go.TreeLayout, { angle: 90, layerSpacing: 35 }),
    "animationManager.isEnabled": false,
  });

  diagram.toolManager.hoverDelay = 100;

  // Modelo con linkKeyProperty en 'key'
  diagram.model = $(go.GraphLinksModel, { linkKeyProperty: "key" });

  // Tooltip HTML
  const htmlTooltip = $(go.HTMLInfo, {
    show: (obj, dgrm) => {
      const div = document.getElementById("goHtmlTooltip") as HTMLDivElement | null;
      if (!div) return;
      const mousePt = dgrm.lastInput.viewPoint;
      div.style.left = mousePt.x + 12 + "px";
      div.style.top = mousePt.y + 12 + "px";

      const data: any = obj?.part?.data ?? {};
      const html =
        data.tooltipHtml ||
        (data.tooltip ? `<div>${data.tooltip}</div>` : "") ||
        (data.key === "Start"
          ? "<div><b>Puntuación total</b>: resumen no disponible.</div>"
          : "");
      div.innerHTML = html;
      div.style.display = "block";
      return div;
    },
    hide: () => {
      const div = document.getElementById("goHtmlTooltip") as HTMLDivElement | null;
      if (div) {
        div.style.display = "none";
        div.innerHTML = "";
      }
    },
  });

function statusColor(status?: string) {
  switch (status) {
    case "ok":   return "#22c55e"; // verde
    case "warn": return "#f59e0b"; // ámbar
    case "fail": return "#ef4444"; // rojo
    case "info": return "#1976d2"; // azul (por defecto)
    default:     return "#1976d2";
  }
}
function linkStrokeByLabel(label?: string) {
  if (!label) return "#555";
  const norm = label.trim().toLowerCase();
  if (norm === "sí" || norm === "si" || norm === "yes") return "#22c55e"; // verde
  if (norm === "no") return "#ef4444";                                     // rojo
  return "#555"; // default
}
function labelBgByLabel(label?: string) {
  if (!label) return "white";
  const norm = label.trim().toLowerCase();
  if (norm === "sí" || norm === "si" || norm === "yes") return "#e8f7ee";  // verde suave
  if (norm === "no") return "#fde8e8";                                     // rojo suave
  return "white";
}
function labelTextByLabel(label?: string) {
  if (!label) return "#333";
  const norm = label.trim().toLowerCase();
  if (norm === "sí" || norm === "si" || norm === "yes") return "#065f46";  // verde oscuro
  if (norm === "no") return "#7f1d1d";                                     // rojo oscuro
  return "#333";
}
  // --- NODE TEMPLATE ---
  const nodeTpl = $(
    go.Node, "Horizontal",
    $("TreeExpanderButton"),
    $(
      go.Panel, "Auto",
      { toolTip: htmlTooltip, cursor: "help" },
      $(go.Shape, "RoundedRectangle",
        { strokeWidth: 0, fill: "#1976d2" },
        // color base según status
        new go.Binding("fill", "status", statusColor),
        // si está resaltado, sobreescribe con color de highlight; si no, no toca
        new go.Binding("fill", "isHighlighted", (h: boolean) => (h ? "#2b89ff" : undefined)).ofObject()
      ),
      $(go.TextBlock,
        {
          margin: 8,
          stroke: "white",
          font: "bold 12px sans-serif",
          wrap: go.TextBlock.WrapFit,
          width: 220,
        },
        new go.Binding("text", "text")
      )
    ),
    new go.Binding("isTreeExpanded", "isTreeExpanded").makeTwoWay()
  );

  // Handlers de hover (TIPADOS y en el template)
nodeTpl.mouseEnter = (e: go.InputEvent, obj: go.GraphObject) => {
  const node = (obj.part ?? obj) as go.Node;
  node.isHighlighted = true;
  node.findLinksConnected().each((l: go.Link) => (l.isHighlighted = true));
  node.findNodesConnected().each((n: go.Node) => (n.isHighlighted = true));
};

nodeTpl.mouseLeave = (e: go.InputEvent, obj: go.GraphObject) => {
  const node = (obj.part ?? obj) as go.Node;
  node.isHighlighted = false;
  node.findLinksConnected().each((l: go.Link) => (l.isHighlighted = false));
  node.findNodesConnected().each((n: go.Node) => (n.isHighlighted = false));

  // 👇 VUELVE A APLICAR LOS BINDINGS (restaura el color por 'status')
  node.updateTargetBindings();
};

  diagram.nodeTemplate = nodeTpl;

  // --- LINK TEMPLATE ---
  diagram.linkTemplate = $(
  go.Link,
  { routing: go.Link.Orthogonal, corner: 5 },
  $(go.Shape,
    { strokeWidth: 2 },
    // color base por label
    new go.Binding("stroke", "label", linkStrokeByLabel),
    // highlight al pasar por el nodo (se superpone)
    new go.Binding("strokeWidth", "isHighlighted", (h: boolean) => (h ? 3.5 : 2)).ofObject(),
    new go.Binding("stroke", "isHighlighted", (h: boolean, shape: go.Shape) => {
      return h ? "#1f5fbf" : (shape.stroke as string);
    }).ofObject()
  ),
  $(
    go.Panel, "Auto",
    { segmentIndex: 2, segmentFraction: 0.5 },
    $(go.Shape, "RoundedRectangle",
      { stroke: "#ccc" },
      new go.Binding("fill", "label", labelBgByLabel),
      new go.Binding("stroke", "label", (l) => (l ? "#ccc" : "transparent"))
    ),
    $(go.TextBlock,
      { margin: 3, editable: false, font: "11px sans-serif" },
      new go.Binding("stroke", "label", labelTextByLabel),
      new go.Binding("text", "label")
    )
  )
);

  return diagram;
}, []);


 return (
  <div style={{ width: "100%", height: "100%", position: "relative" }}>
    <ReactDiagram
      initDiagram={initDiagram}
      
      nodeDataArray={nodeDataArray}
      linkDataArray={linksWithKey}
      divClassName="w-full h-full"
    />
    {/* Contenedor HTML del tooltip */}
    <div
      id="goHtmlTooltip"
      style={{
        position: "absolute",
        zIndex: 10,
        pointerEvents: "none",
        background: "white",
        border: "1px solid #ddd",
        borderRadius: 6,
        padding: "8px 10px",
        maxWidth: 320,
        boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
        display: "none",
      }}
    />
  </div>
);
}
