import type {
  CouplingResult,
  CycleResult,
  Direction,
  FileSummary,
  HotspotResult,
  ImpactGraph,
  PackageImpactResult,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public isDbUnreachable: boolean,
  ) {
    super(message);
  }
}

async function request<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`);
  } catch {
    // The fetch itself failed — most likely the API process is down or
    // unreachable (not the same as CognoDB being down, but the user's
    // remedy is the same: "try again in a moment").
    throw new ApiError('Could not reach the API.', 0, true);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // response body wasn't JSON; keep the generic message
    }
    throw new ApiError(message, res.status, res.status === 503);
  }

  return res.json() as Promise<T>;
}

function qs(params: Record<string, string | number | undefined>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) usp.set(key, String(value));
  }
  const str = usp.toString();
  return str ? `?${str}` : '';
}

export const api = {
  checkHealth: () => request<{ status: 'up' }>('/health/db'),

  listFiles: (search?: string) => request<FileSummary[]>(`/files${qs({ search })}`),

  getFileSummary: (path: string) => request<FileSummary>(`/files/detail${qs({ path })}`),

  getImpactGraph: (path: string, maxHops: number, direction: Direction) =>
    request<ImpactGraph>(`/files/graph${qs({ path, maxHops, direction })}`),

  getCycles: () => request<CycleResult[]>('/insights/cycles'),

  getHotspots: (limit = 15) => request<HotspotResult[]>(`/insights/hotspots${qs({ limit })}`),

  getModuleCoupling: () => request<CouplingResult[]>('/insights/module-coupling'),

  getPackageImpact: (name: string, maxHops = 5) =>
    request<PackageImpactResult[]>(`/insights/packages/impact${qs({ name, maxHops })}`),
};
