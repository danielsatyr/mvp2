// features/decision-graph/types/dto.ts
export type NodeDTO = {
  key: string;
  parent?: string | null;
  title: string;
  meta?: Record<string, unknown>;
};

export type LinkDTO = { from: string; to: string };

export type DecisionGraphDTO = {
  nodes: NodeDTO[];
  links?: LinkDTO[];
};