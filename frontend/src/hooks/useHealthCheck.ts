import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

export type HealthStatus = 'checking' | 'up' | 'down';

export function useHealthCheck(pollMs = 15000) {
  const [status, setStatus] = useState<HealthStatus>('checking');

  const check = useCallback(async () => {
    try {
      await api.checkHealth();
      setStatus('up');
    } catch {
      setStatus('down');
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, pollMs);
    return () => clearInterval(id);
  }, [check, pollMs]);

  return { status, recheck: check };
}
