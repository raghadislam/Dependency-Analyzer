import { useState } from 'react';
import { AppShell } from './components/AppShell';
import { BlastRadiusView } from './components/BlastRadiusView';
import { InsightsView } from './components/InsightsView';
import { ErrorBanner } from './components/ErrorBanner';
import { useHealthCheck } from './hooks/useHealthCheck';

export default function App() {
  const [tab, setTab] = useState<'blast-radius' | 'insights'>('blast-radius');
  const { status, recheck } = useHealthCheck();

  return (
    <AppShell tab={tab} onTabChange={setTab} health={status}>
      {status === 'down' && (
        <ErrorBanner
          message="Can't reach CognoDB right now. The app will keep retrying, or click retry to check immediately."
          onRetry={recheck}
        />
      )}
      {tab === 'blast-radius' ? <BlastRadiusView /> : <InsightsView />}
    </AppShell>
  );
}
