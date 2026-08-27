interface Props {
  direction: 'dependents' | 'dependencies';
  fileName: string;
}

export function EmptyImpact({ direction, fileName }: Props) {
  const message =
    direction === 'dependents'
      ? `Nothing in the codebase imports ${fileName}. It's a leaf — safe to change without a ripple effect elsewhere.`
      : `${fileName} doesn't import anything else in the codebase. It has no internal dependencies to worry about.`;

  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden>
        ◇
      </div>
      <p>{message}</p>
    </div>
  );
}
