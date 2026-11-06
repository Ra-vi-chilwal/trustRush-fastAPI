import { Link } from 'react-router-dom';
import { EmptyState } from '@/shared/ui/EmptyState';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <EmptyState
        icon="🧭"
        title="Page not found"
        description="That page doesn't exist."
        action={<Link to="/" className="font-semibold text-brand-600 hover:underline">← Back to events</Link>}
      />
    </div>
  );
}
