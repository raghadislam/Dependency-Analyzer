import { useMemo } from 'react';
import type { Direction, TraversalNode } from '../types';

interface Props {
  target: string;
  direction: Direction;
  nodes: TraversalNode[];
  edges: { from: string; to: string }[];
  onSelectNode: (path: string) => void;
}

const SIZE = 640;
const CENTER = SIZE / 2;
const BASE_RADIUS = 92;
const MARGIN = 56;

function basename(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hopColor(hop: number, maxHop: number): string {
  const t = maxHop <= 1 ? 0 : (hop - 1) / (maxHop - 1);
  const from = [79, 209, 232]; // trace cyan, bright — close to the change
  const to = [58, 96, 112]; // muted — far from the change
  const [r, g, b] = from.map((c, i) => Math.round(lerp(c, to[i], t)));
  return `rgb(${r}, ${g}, ${b})`;
}

interface PositionedNode extends TraversalNode {
  x: number;
  y: number;
}

export function RadialGraph({ target, direction, nodes, edges, onSelectNode }: Props) {
  const { positioned, ringRadii, maxHop } = useMemo(() => {
    const maxHop = Math.max(1, ...nodes.map((n) => n.hops));
    const outerRadius = SIZE / 2 - MARGIN;
    const ringGap = maxHop > 1 ? (outerRadius - BASE_RADIUS) / (maxHop - 1) : 0;

    const byHop = new Map<number, TraversalNode[]>();
    for (const node of nodes) {
      if (!byHop.has(node.hops)) byHop.set(node.hops, []);
      byHop.get(node.hops)!.push(node);
    }

    const positioned: PositionedNode[] = [];
    for (const [hop, group] of byHop) {
      const radius = BASE_RADIUS + (hop - 1) * ringGap;
      const stagger = (hop - 1) * 0.28; // rotates each ring slightly so nodes don't stack radially
      const startAngle = -Math.PI / 2 + stagger;
      group.forEach((node, i) => {
        const angle = startAngle + (i * (2 * Math.PI)) / group.length;
        positioned.push({
          ...node,
          x: CENTER + radius * Math.cos(angle),
          y: CENTER + radius * Math.sin(angle),
        });
      });
    }

    const ringRadii = Array.from(byHop.keys())
      .sort((a, b) => a - b)
      .map((hop) => ({ hop, radius: BASE_RADIUS + (hop - 1) * ringGap }));

    return { positioned, ringRadii, maxHop };
  }, [nodes]);

  const positionByPath = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    map.set(target, { x: CENTER, y: CENTER });
    for (const n of positioned) map.set(n.path, { x: n.x, y: n.y });
    return map;
  }, [positioned, target]);

  const stepWord = direction === 'dependents' ? 'depend on it' : 'it depends on';

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`Radial diagram: ${nodes.length} files that ${stepWord}, centered on ${basename(target)}`}
      style={{ width: '100%', height: 'auto', maxWidth: 640 }}
    >
      {/* Ring guides, like distance markers on a schematic */}
      {ringRadii.map(({ hop, radius }) => (
        <g key={hop}>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={radius}
            fill="none"
            stroke="var(--bp-grid-line)"
            strokeWidth={1}
            strokeDasharray="2 7"
          />
          <text
            x={CENTER}
            y={CENTER - radius - 6}
            textAnchor="middle"
            fill="var(--bp-chalk-dim)"
            fontFamily="var(--font-display)"
            fontSize={11}
          >
            {hop} step{hop > 1 ? 's' : ''} away
          </text>
        </g>
      ))}

      {/* Edges: real IMPORTS relationships among the nodes shown */}
      {edges.map((edge, i) => {
        const from = positionByPath.get(edge.from);
        const to = positionByPath.get(edge.to);
        if (!from || !to) return null;
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="var(--bp-trace-cyan)"
            strokeOpacity={0.35}
            strokeWidth={1.2}
          />
        );
      })}

      {/* Target node — the file being changed */}
      <g>
        <circle
          cx={CENTER}
          cy={CENTER}
          r={20}
          fill="none"
          stroke="var(--bp-signal-amber)"
          strokeWidth={2}
          className="radial-graph__pulse"
        />
        <rect
          x={CENTER - 12}
          y={CENTER - 12}
          width={24}
          height={24}
          rx={4}
          fill="var(--bp-signal-amber)"
          transform={`rotate(45 ${CENTER} ${CENTER})`}
        />
        <text
          x={CENTER}
          y={CENTER + 38}
          textAnchor="middle"
          fill="var(--bp-chalk)"
          fontFamily="var(--font-display)"
          fontWeight={600}
          fontSize={13}
        >
          {basename(target)}
        </text>
      </g>

      {/* Everything that {stepWord} */}
      {positioned.map((node) => {
        const onRight = node.x >= CENTER;
        return (
          <g
            key={node.path}
            className="radial-graph__node"
            onClick={() => onSelectNode(node.path)}
            tabIndex={0}
            role="button"
            aria-label={`${node.path}, ${node.hops} step${node.hops > 1 ? 's' : ''} away. View its own blast radius.`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectNode(node.path);
            }}
          >
            <title>{node.path}</title>
            <circle cx={node.x} cy={node.y} r={8} fill={hopColor(node.hops, maxHop)} />
            <text
              x={node.x + (onRight ? 12 : -12)}
              y={node.y + 4}
              textAnchor={onRight ? 'start' : 'end'}
              fill="var(--bp-chalk)"
              fontFamily="var(--font-display)"
              fontSize={11}
            >
              {basename(node.path)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
