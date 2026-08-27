export function LoadingRings() {
  return (
    <div className="loading-rings" role="status" aria-label="Loading">
      <svg viewBox="0 0 200 200" width="200" height="200">
        {[30, 55, 80].map((r, i) => (
          <circle
            key={r}
            cx={100}
            cy={100}
            r={r}
            fill="none"
            stroke="var(--bp-grid-line)"
            strokeWidth={2}
            className="loading-rings__ring"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </svg>
      <p>Tracing connections…</p>
    </div>
  );
}
