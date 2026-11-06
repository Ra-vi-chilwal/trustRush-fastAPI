import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/shared/ui/Button';
import { ErrorState } from '@/shared/ui/ErrorState';
import { FullPageSpinner } from '@/shared/ui/Spinner';
import { useAuth } from './useAuth';
import { readRedirectState, type AuthRedirectState } from './redirectState';

/** Like an Express `requireAuth` middleware, but for pages. */
export function ProtectedRoute() {
  const { status, error, retry, logout } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner label="Checking your session…" />;

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <ErrorState error={error} title="Couldn't load your account" onRetry={retry}>
          <Button variant="ghost" onClick={logout}>Log out</Button>
        </ErrorState>
      </div>
    );
  }

  if (status === 'anonymous') {
    const state: AuthRedirectState = { from: location.pathname + location.search };
    return <Navigate to="/login" replace state={state} />;
  }

  return <Outlet />;
}

/** /login and /signup: bounce logged-in users back to where they were going. */
export function GuestOnlyRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'authenticated') {
    return <Navigate to={readRedirectState(location.state).from ?? '/'} replace />;
  }
  return <Outlet />;
}
