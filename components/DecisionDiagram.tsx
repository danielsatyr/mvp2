import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import { useCallback, useMemo } from 'react';

export interface DecisionDiagramNode {
  key: string;
  text: string;
}

export interface DecisionDiagramLink {
  key?: string;
  from: string;
  to: string;
}

export interface DecisionDiagramProps {
  nodeDataArray: DecisionDiagramNode[];
  linkDataArray: DecisionDiagramLink[];
}

export default function DecisionDiagram({ nodeDataArray, linkDataArray }: DecisionDiagramProps) {
  // Asegurar que cada link tenga una propiedad 'key'
  const linksWithKey = useMemo(
    () => linkDataArray.map((link, idx) => ({ key: link.key ?? `link${idx}`, ...link })),
    [linkDataArray]
  );

  const initDiagram = useCallback(() => {
    const $ = go.GraphObject.make;
    const diagram = $(go.Diagram, {
      'undoManager.isEnabled': true,
      layout: $(go.TreeLayout, { angle: 90, layerSpacing: 35 }),
      'animationManager.isEnabled': false
    });

    // Modelo con linkKeyProperty en 'key'
    diagram.model = $(go.GraphLinksModel, { linkKeyProperty: 'key' });

    // Node template
    diagram.nodeTemplate =
      $(go.Node, 'Auto',
        $(go.Shape, 'RoundedRectangle', { strokeWidth: 0, fill: '#1976d2' }),
        $(go.TextBlock, { margin: 8, stroke: 'white', font: 'bold 12px sans-serif' },
          new go.Binding('text', 'text'))
      );

    // Link template
    diagram.linkTemplate =
      $(go.Link,
        { routing: go.Link.Orthogonal, corner: 5 },
        $(go.Shape, { strokeWidth: 2, stroke: '#555' })
      );

    return diagram;
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactDiagram
        initDiagram={initDiagram}
        nodeDataArray={nodeDataArray}
        linkDataArray={linksWithKey}
        divClassName="w-full h-full"
      />
    </div>
  );
}
