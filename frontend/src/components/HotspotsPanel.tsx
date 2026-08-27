import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { HotspotResult } from '../types';
import { LoadingRings } from './LoadingRings';
import { ErrorBanner } from './ErrorBanner';

export function HotspotsPanel() {
  const [data, setData] = useState<HotspotResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getHotspots(15)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load hotspots.'));
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <LoadingRings />;

  const max = Math.max(...data.map((d) => d.fanIn), 1);

  return (
    <div className="insight-card">
      <h3>Riskiest files to touch</h3>
      <p className="insight-card__subtitle">Ranked by how many files depend on them, directly.</p>
      <ul className="hotspot-list">
        {data.map((row) => (
          <li key={row.path}>
            <span className="mono hotspot-list__path">{row.path}</span>
            <div className="hotspot-list__bar-track">
              <div className="hotspot-list__bar" style={{ width: `${(row.fanIn / max) * 100}%` }} />
            </div>
            <span className="hotspot-list__count">{row.fanIn}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
