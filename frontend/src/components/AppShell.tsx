import type { ReactNode } from 'react';
import type { HealthStatus } from '../hooks/useHealthCheck';

interface Props {
  tab: 'blast-radius' | 'insights';
  onTabChange: (tab: 'blast-radius' | 'insights') => void;
  health: HealthStatus;
  children: ReactNode;
}

export function AppShell({ tab, onTabChange, health, children }: Props) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__title">
          <span className="app-shell__mark" aria-hidden>
            ◈
          </span>
          <div>
            <h1>Dependency Analyzer</h1>
            <p>What could this affect?</p>
          </div>
        </div>

        <nav className="app-shell__tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'blast-radius'}
            className={`app-shell__tab ${tab === 'blast-radius' ? 'is-active' : ''}`}
            onClick={() => onTabChange('blast-radius')}
          >
            Blast Radius
          </button>
          <button
            role="tab"
            aria-selected={tab === 'insights'}
            className={`app-shell__tab ${tab === 'insights' ? 'is-active' : ''}`}
            onClick={() => onTabChange('insights')}
          >
            Insights
          </button>
        </nav>

        <div className={`app-shell__status app-shell__status--${health}`}>
          <span className="app-shell__status-dot" aria-hidden />
          {health === 'up' && 'Connected'}
          {health === 'down' && 'Database unreachable'}
          {health === 'checking' && 'Connecting…'}
        </div>
      </header>

      <main className="app-shell__main">{children}</main>
    </div>
  );
}
