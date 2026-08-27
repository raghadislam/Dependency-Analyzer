import type { Direction } from '../types';

interface Props {
  value: Direction;
  onChange: (direction: Direction) => void;
}

export function DirectionToggle({ value, onChange }: Props) {
  return (
    <div className="direction-toggle" role="tablist" aria-label="Traversal direction">
      <button
        role="tab"
        aria-selected={value === 'dependents'}
        className={`direction-toggle__option ${value === 'dependents' ? 'is-active' : ''}`}
        onClick={() => onChange('dependents')}
      >
        What breaks if I change this
      </button>
      <button
        role="tab"
        aria-selected={value === 'dependencies'}
        className={`direction-toggle__option ${value === 'dependencies' ? 'is-active' : ''}`}
        onClick={() => onChange('dependencies')}
      >
        What this relies on
      </button>
    </div>
  );
}
