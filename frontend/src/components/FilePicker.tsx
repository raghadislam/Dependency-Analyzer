import { useEffect, useRef, useState } from 'react';
import type { FileSummary } from '../types';

interface Props {
  files: FileSummary[];
  value: string;
  onSelect: (path: string) => void;
  loading: boolean;
}

export function FilePicker({ files, value, onSelect, loading }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query
    ? files.filter((f) => f.path.toLowerCase().includes(query.toLowerCase())).slice(0, 12)
    : files.slice(0, 12);

  return (
    <div className="file-picker" ref={containerRef}>
      <label className="file-picker__label" htmlFor="file-search">
        What are you about to change?
      </label>
      <input
        id="file-search"
        className="file-picker__input"
        type="text"
        placeholder={loading ? 'Loading files…' : 'Search for a file, e.g. auth.service.ts'}
        value={query || value}
        disabled={loading}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      {open && filtered.length > 0 && (
        <ul className="file-picker__dropdown" role="listbox">
          {filtered.map((f) => (
            <li key={f.path}>
              <button
                className="file-picker__option"
                onClick={() => {
                  onSelect(f.path);
                  setQuery('');
                  setOpen(false);
                }}
              >
                <span className="mono file-picker__path">{f.path}</span>
                <span className="file-picker__meta">
                  {f.module} · {f.layer} · {f.fanIn} depend on it
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
