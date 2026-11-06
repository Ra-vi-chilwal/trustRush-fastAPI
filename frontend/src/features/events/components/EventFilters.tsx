import { CITIES } from '../constants';

interface EventFiltersProps {
  search: string;
  city: string;
  onSearchChange: (value: string) => void;
  onCityChange: (value: string) => void;
}

export function EventFilters({ search, city, onSearchChange, onCityChange }: EventFiltersProps) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
        <span aria-hidden className="text-slate-400">🔍</span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search events, artists, venues…"
          aria-label="Search events"
          className="h-12 flex-1 bg-transparent outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label="City">
        {['', ...CITIES].map((c) => {
          const active = city === c;
          return (
            <button
              key={c || 'all'}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onCityChange(c)}
              className={
                active
                  ? 'shrink-0 rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white'
                  : 'shrink-0 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 hover:border-slate-400'
              }
            >
              {c || 'All cities'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
