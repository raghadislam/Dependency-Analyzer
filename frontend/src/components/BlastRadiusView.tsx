import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Direction, FileSummary, ImpactGraph } from '../types';
import { FilePicker } from './FilePicker';
import { DirectionToggle } from './DirectionToggle';
import { RadialGraph } from './RadialGraph';
import { ImpactList } from './ImpactList';
import { LoadingRings } from './LoadingRings';
import { EmptyImpact } from './EmptyImpact';
import { ErrorBanner } from './ErrorBanner';

function basename(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

export function BlastRadiusView() {
  const [files, setFiles] = useState<FileSummary[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [direction, setDirection] = useState<Direction>('dependents');
  const [maxHops, setMaxHops] = useState(5);
  const [graph, setGraph] = useState<ImpactGraph | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listFiles()
      .then((data) => {
        setFiles(data);
        if (data.length > 0) setSelectedPath(data[0].path);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load files.'))
      .finally(() => setFilesLoading(false));
  }, []);

  const loadGraph = useCallback((path: string, dir: Direction, hops: number) => {
    setGraphLoading(true);
    setError(null);
    api
      .getImpactGraph(path, hops, dir)
      .then(setGraph)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Something went wrong.'))
      .finally(() => setGraphLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPath) loadGraph(selectedPath, direction, maxHops);
  }, [selectedPath, direction, maxHops, loadGraph]);

  return (
    <div className="blast-radius-view">
      <div className="blast-radius-view__controls">
        <FilePicker files={files} value={selectedPath ?? ''} onSelect={setSelectedPath} loading={filesLoading} />
        <DirectionToggle value={direction} onChange={setDirection} />
        <label className="hops-control">
          Max steps to trace
          <input
            type="range"
            min={1}
            max={8}
            value={maxHops}
            onChange={(e) => setMaxHops(Number(e.target.value))}
          />
          <span className="mono">{maxHops}</span>
        </label>
      </div>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={selectedPath ? () => loadGraph(selectedPath, direction, maxHops) : undefined}
        />
      )}

      {!error && (
        <div className="blast-radius-view__body">
          <div className="panel panel--graph">
            {graphLoading && <LoadingRings />}
            {!graphLoading && graph && graph.nodes.length === 0 && (
              <EmptyImpact direction={direction} fileName={basename(graph.target)} />
            )}
            {!graphLoading && graph && graph.nodes.length > 0 && (
              <RadialGraph
                target={graph.target}
                direction={graph.direction}
                nodes={graph.nodes}
                edges={graph.edges}
                onSelectNode={setSelectedPath}
              />
            )}
          </div>
          <div className="panel panel--list">
            <h3>
              {graph ? graph.nodes.length : 0} file{graph?.nodes.length === 1 ? '' : 's'}
            </h3>
            {graph && graph.nodes.length > 0 && <ImpactList nodes={graph.nodes} onSelect={setSelectedPath} />}
          </div>
        </div>
      )}
    </div>
  );
}
