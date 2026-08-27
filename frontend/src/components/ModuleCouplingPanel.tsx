import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { CouplingResult } from '../types';
import { LoadingRings } from './LoadingRings';
import { ErrorBanner } from './ErrorBanner';

export function ModuleCouplingPanel() {
  const [data, setData] = useState<CouplingResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getModuleCoupling()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load module coupling.'));
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <LoadingRings />;

  return (
    <div className="insight-card">
      <h3>Cross-module coupling</h3>
      <p className="insight-card__subtitle">
        Direct imports that cross from one business module into another. High counts between modules that
        shouldn't know about each other are worth a second look.
      </p>
      <table className="coupling-table">
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Import edges</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 20).map((row, i) => (
            <tr key={i}>
              <td>{row.fromModule}</td>
              <td>{row.toModule}</td>
              <td className="mono">{row.edgeCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
