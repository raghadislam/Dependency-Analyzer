import type { TraversalNode } from '../types';

interface Props {
  nodes: TraversalNode[];
  onSelect: (path: string) => void;
}

export function ImpactList({ nodes, onSelect }: Props) {
  const sorted = [...nodes].sort((a, b) => a.hops - b.hops || a.path.localeCompare(b.path));

  return (
    <div className="impact-list">
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Module</th>
            <th>Steps away</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((node) => (
            <tr key={node.path} onClick={() => onSelect(node.path)} tabIndex={0}>
              <td className="mono">{node.path}</td>
              <td>{node.module}</td>
              <td>
                <span className={`hop-badge hop-badge--${Math.min(node.hops, 4)}`}>{node.hops}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
