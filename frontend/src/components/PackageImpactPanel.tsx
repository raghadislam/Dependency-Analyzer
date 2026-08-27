import { useState } from 'react';
import { api, ApiError } from '../api/client';
import type { PackageImpactResult } from '../types';
import { LoadingRings } from './LoadingRings';
import { ErrorBanner } from './ErrorBanner';

export function PackageImpactPanel() {
  const [name, setName] = useState('');
  const [data, setData] = useState<PackageImpactResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  function search(pkg: string) {
    if (!pkg.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    api
      .getPackageImpact(pkg.trim())
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not check package impact.'))
      .finally(() => setLoading(false));
  }

  return (
    <div className="insight-card">
      <h3>What if a package breaks?</h3>
      <p className="insight-card__subtitle">
        Enter an npm package name (e.g. <span className="mono">express</span>, <span className="mono">@prisma/client</span>) to
        see every file that would need attention.
      </p>
      <form
        className="package-impact__form"
        onSubmit={(e) => {
          e.preventDefault();
          search(name);
        }}
      >
        <input
          type="text"
          placeholder="Package name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Check</button>
      </form>

      {loading && <LoadingRings />}
      {error && <ErrorBanner message={error} />}
      {!loading && !error && searched && data && data.length === 0 && (
        <p className="insight-card__subtitle">No files in this codebase depend on that package.</p>
      )}
      {!loading && !error && data && data.length > 0 && (
        <ul className="package-impact__list">
          {data.map((row) => (
            <li key={row.path} className="mono">
              {row.path}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
