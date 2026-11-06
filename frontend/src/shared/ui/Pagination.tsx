import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}

/** Page numbers with ellipses: 1 … 4 5 6 … 12 */
function pageList(page: number, total: number): Array<number | 'gap'> {
  const pages = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | 'gap'> = [];
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

export function Pagination({ page, totalPages, onChange, disabled }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
      <Button variant="ghost" size="sm" disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
        ← Prev
      </Button>
      {pageList(page, totalPages).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-slate-400">…</span>
        ) : (
          <button
            key={p}
            type="button"
            disabled={disabled}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onChange(p)}
            className={
              p === page
                ? 'h-8 min-w-8 rounded-lg bg-slate-900 px-2 text-sm font-semibold text-white'
                : 'h-8 min-w-8 rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-100'
            }
          >
            {p}
          </button>
        ),
      )}
      <Button variant="ghost" size="sm" disabled={disabled || page >= totalPages} onClick={() => onChange(page + 1)}>
        Next →
      </Button>
    </nav>
  );
}
