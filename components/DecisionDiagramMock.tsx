// components/DecisionDiagramMock.tsx
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Visual mock (data-driven) of the decision diagram:
 * - Uses your real nodeDataArray/linkDataArray
 * - Tree expand/collapse per node (click a node)
 * - Status colors on nodes: ok/warn/fail/info
 * - Link colors by label: “Sí” (green), “No” (red)
 * - HTML tooltips (from tooltipHtml or tooltip)
 * - Hover highlight (node + connected links)
 */

type Status = "ok" | "warn" | "fail" | "info";
type MockNode = {
  key: string;
  text: string;
  status?: Status;
  tooltip?: string;
  tooltipHtml?: string;
};
type MockLink = { from: string; to: string; label?: string };

export default function DecisionDiagramMock({
  nodeDataArray,
  linkDataArray,
}: {
  nodeDataArray: MockNode[];
  linkDataArray: MockLink[];
}) {
  // --- Constants / styling ---
  const NODE_W = 220;
  const NODE_H = 54;
  const GAP_X = 220;
  const GAP_Y = 120;
  const CENTER_X = 480;
  const START_Y = 80;

  const statusFill: Record<Status, string> = {
    ok: "#22c55e",
    warn: "#f59e0b",
    fail: "#ef4444",
    info: "#1976d2",
  };
  const statusText: Record<Status, string> = {
    ok: "OK",
    warn: "Advertencia",
    fail: "No cumple",
    info: "Info",
  };

  const linkStrokeByLabel = (label?: string) => {
    if (!label) return "#555";
    const v = label.trim().toLowerCase();
    if (v === "sí" || v === "si" || v === "yes") return "#22c55e";
    if (v === "no") return "#ef4444";
    return "#555";
  };
  const labelBgByLabel = (label?: string) => {
    if (!label) return "white";
    const v = label.trim().toLowerCase();
    if (v === "sí" || v === "si" || v === "yes") return "#e8f7ee";
    if (v === "no") return "#fde8e8";
    return "white";
  };
  const labelTextByLabel = (label?: string) => {
    if (!label) return "#333";
    const v = label.trim().toLowerCase();
    if (v === "sí" || v === "si" || v === "yes") return "#065f46";
    if (v === "no") return "#7f1d1d";
    return "#333";
  };

  // --- Build graph helpers ---
  const byKey = useMemo(() => {
    const map = new Map<string, MockNode>();
    nodeDataArray.forEach((n) => map.set(n.key, n));
    return map;
  }, [nodeDataArray]);

  const children = useMemo(() => {
    const m = new Map<string, string[]>();
    nodeDataArray.forEach((n) => m.set(n.key, []));
    linkDataArray.forEach((l) => {
      if (m.has(l.from)) m.get(l.from)!.push(l.to);
    });
    return m;
  }, [nodeDataArray, linkDataArray]);

  const rootKey = useMemo(() => {
    // Find a node that is never a target (typical root). Fallback to "Start".
    const targets = new Set(linkDataArray.map((l) => l.to));
    const candidates = nodeDataArray.map((n) => n.key).filter((k) => !targets.has(k));
    return candidates[0] ?? "Start";
  }, [nodeDataArray, linkDataArray]);

  // --- Expanded state (root expanded by default) ---
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([rootKey]));
  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // --- Layout (level by level BFS) ---
  const positioned = useMemo(() => {
    const q = [rootKey];
    const level = new Map<string, number>();
    level.set(rootKey, 0);
    const order = new Map<number, string[]>();
    order.set(0, [rootKey]);

    while (q.length) {
      const k = q.shift()!;
      const lv = level.get(k)!;
      const childs = children.get(k) ?? [];
      for (const ch of childs) {
        if (!level.has(ch)) {
          level.set(ch, lv + 1);
          q.push(ch);
          order.set(lv + 1, [...(order.get(lv + 1) ?? []), ch]);
        }
      }
    }

    const pos = new Map<string, { x: number; y: number }>();
    const sortedLvls = [...order.keys()].sort((a, b) => a - b);
    for (const lv of sortedLvls) {
      const row = order.get(lv)!;
      const totalW = row.length * NODE_W + (row.length - 1) * GAP_X;
      let x = CENTER_X - totalW / 2 + NODE_W / 2;
      for (const k of row) {
        pos.set(k, { x, y: START_Y + lv * GAP_Y });
        x += NODE_W + GAP_X;
      }
    }
    return pos;
  }, [children, rootKey]);

  // --- Visible set based on expansion ---
  const visibleSet = useMemo(() => {
    const v = new Set<string>();
    const stack = [rootKey];
    while (stack.length) {
      const k = stack.pop()!;
      v.add(k);
      if (expanded.has(k)) {
        (children.get(k) ?? []).forEach((ch) => stack.push(ch));
      }
    }
    return v;
  }, [children, expanded, rootKey]);

  const visibleNodes = nodeDataArray.filter((n) => visibleSet.has(n.key));
  const visibleLinks = linkDataArray.filter((l) => visibleSet.has(l.from) && visibleSet.has(l.to));

  // --- Hover highlight ---
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const isHot = (id: string) => hoverKey === id;

  const nodePos = (k: string) => positioned.get(k) ?? { x: CENTER_X, y: START_Y };
  const rectPos = (k: string) => {
    const p = nodePos(k);
    return { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 };
  };

  // --- Legend ---
  const Legend = () => (
    <div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-3">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: statusFill.ok }} />
        OK
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: statusFill.warn }} />
        Advertencia
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: statusFill.fail }} />
        No cumple
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: statusFill.info }} />
        Info
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: statusFill.ok }} />
        Enlace “Sí”
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: statusFill.fail }} />
        Enlace “No”
      </span>
    </div>
  );

  return (
    <div className="w-full bg-white rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">Vista: Demo (con datos reales)</div>
        <div className="flex gap-2">
          {/* Expand/Collapse all (optional) */}
          <button
            className="px-3 py-1.5 rounded-md text-sm border shadow-sm bg-white hover:bg-gray-50"
            onClick={() => {
              // toggle all under root
              const all = new Set<string>();
              const stack = [rootKey];
              while (stack.length) {
                const k = stack.pop()!;
                all.add(k);
                (children.get(k) ?? []).forEach((ch) => stack.push(ch));
              }
              const allExpanded = [...all].every((k) => expanded.has(k));
              setExpanded(allExpanded ? new Set([rootKey]) : all);
            }}
          >
            {(() => {
              // label reflects whether all are expanded
              const test = new Set<string>();
              const stack = [rootKey];
              while (stack.length) {
                const k = stack.pop()!;
                test.add(k);
                (children.get(k) ?? []).forEach((ch) => stack.push(ch));
              }
              const allExpanded = [...test].every((k) => expanded.has(k));
              return allExpanded ? "Colapsar todo" : "Expandir todo";
            })()}
          </button>
        </div>
      </div>

      <Legend />

      <div
        className="relative w-full overflow-hidden border border-dashed border-gray-300 rounded-xl"
        style={{ height: 440 }}
      >
        <svg width="100%" height="100%" viewBox="0 0 960 440">
          {/* Links */}
          <AnimatePresence>
            {visibleLinks.map((l) => {
              const pFrom = rectPos(l.from);
              const pTo = rectPos(l.to);
              const fromCenter = { x: pFrom.x + NODE_W / 2, y: pFrom.y + NODE_H };
              const toCenter = { x: pTo.x + NODE_W / 2, y: pTo.y };
              const midX = (fromCenter.x + toCenter.x) / 2;
              const midY = (fromCenter.y + toCenter.y) / 2;

              const baseStroke = linkStrokeByLabel(l.label);
              const hot = hoverKey === l.from || hoverKey === l.to;

              return (
                <g key={`${l.from}-${l.to}`}>
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                    d={`M ${fromCenter.x} ${fromCenter.y} L ${fromCenter.x} ${midY} L ${toCenter.x} ${midY} L ${toCenter.x} ${toCenter.y}`}
                    fill="none"
                    stroke={hot ? "#1f5fbf" : baseStroke}
                    strokeWidth={hot ? 3.5 : 2}
                  />
                  {/* Label pill */}
                  <foreignObject x={midX - 36} y={midY - 14} width={90} height={28}>
                    <div
                      className="px-2 py-0.5 rounded-md text-xs border text-center"
                      style={{
                        background: labelBgByLabel(l.label),
                        color: labelTextByLabel(l.label),
                        borderColor: baseStroke,
                      }}
                    >
                      {l.label}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </AnimatePresence>

          {/* Nodes */}
          {visibleNodes.map((n) => {
            const pos = rectPos(n.key);
            const status = (n.status ?? "info") as Status;
            const hot = isHot(n.key);
            const fill = hot ? "#2b89ff" : statusFill[status];

            return (
              <g
                key={n.key}
                onMouseEnter={() => setHoverKey(n.key)}
                onMouseLeave={() => setHoverKey(null)}
                onClick={() => toggle(n.key)}
                style={{ cursor: "pointer" }}
              >
                {/* Card */}
                <motion.rect
                  x={pos.x}
                  y={pos.y}
                  rx={12}
                  width={NODE_W}
                  height={NODE_H}
                  fill={fill}
                  initial={{ opacity: 0, y: pos.y - 8 }}
                  animate={{ opacity: 1, y: pos.y }}
                  transition={{ duration: 0.25 }}
                />
                {/* Text */}
                <foreignObject x={pos.x} y={pos.y} width={NODE_W} height={NODE_H}>
                  <div className="w-full h-full flex items-center justify-center px-3 text-white font-semibold text-sm text-center">
                    {n.text}
                  </div>
                </foreignObject>

                {/* Status pill (left side) */}
                <foreignObject x={pos.x - 84} y={pos.y + NODE_H / 2 - 10} width={78} height={22}>
                  <div className="flex justify-end">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border"
                      style={{
                        background: `${statusFill[status]}1A`,
                        borderColor: statusFill[status],
                        color: statusFill[status],
                      }}
                    >
                      <span
                        className="inline-block w-2.5 h-2.5 rounded"
                        style={{ background: statusFill[status] }}
                      />
                      {statusText[status]}
                    </span>
                  </div>
                </foreignObject>

                {/* Tooltip (HTML) */}
                <AnimatePresence>
                  {hot && (n.tooltipHtml || n.tooltip) && (
                    <motion.foreignObject
                      x={pos.x + NODE_W + 10}
                      y={pos.y - 6}
                      width={300}
                      height={160}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                    >
                      <div
                        className="bg-white shadow-xl rounded-xl border p-3 text-sm"
                        style={{ pointerEvents: "none" }}
                        dangerouslySetInnerHTML={{
                          __html:
                            n.tooltipHtml ||
                            `<div>${n.tooltip}</div>` ||
                            "",
                        }}
                      />
                    </motion.foreignObject>
                  )}
                </AnimatePresence>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
