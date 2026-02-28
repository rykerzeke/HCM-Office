import { useState, useRef, useEffect } from 'react';
import { Icons } from './icons';

interface Option {
  id: string;
  name: string;
}

interface SearchableStateSelectProps {
  value: string;
  onChange: (stateId: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchableStateSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Select state...',
  disabled = false,
  className = '',
}: SearchableStateSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedName = options.find((o) => o.id === value)?.name ?? '';
  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="select-dark w-full flex items-center justify-between gap-2 text-left"
      >
        <span className={value ? '' : 'text-surface-500'}>{selectedName || placeholder}</span>
        <Icons.ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full glass rounded-xl border border-white/10 overflow-hidden shadow-xl animate-fade-in">
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search states..."
                className="input-dark w-full pl-9 py-2 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-surface-500 text-sm">No matching state</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-primary-500/10 transition-colors ${
                    value === opt.id ? 'bg-primary-500/15 text-primary-400' : ''
                  }`}
                >
                  {opt.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
