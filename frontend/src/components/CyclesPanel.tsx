import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { CycleResult } from '../types';
import { LoadingRings } from './LoadingRings';
import { ErrorBanner } from './ErrorBanner';

export function CyclesPanel() {
  const [data, setData] = useState<CycleResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getCycles()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not check for cycles.'));
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <LoadingRings />;

  return (
    <div className="insight-card">
      <h3>Import cycles</h3>
      <p className="insight-card__subtitle">Files that import each other in a loop, directly or transitively.</p>
      {data.length === 0 ? (
        <div className="cycles-panel__clean">
          <span aria-hidden>✓</span> No import cycles found.
        </div>
      ) : (
        <ul className="cycles-panel__list">
          {data.map((c, i) => (
            <li key={i} className="mono">
              {c.cycle.map((p) => p.split('/').pop()).join(' → ')}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
