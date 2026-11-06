import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { config } from '@/shared/config';
import { Button } from '@/shared/ui/Button';
import { Logo } from '@/shared/ui/Logo';
import { cn } from '@/shared/utils/cn';

const linkCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-lg px-3 py-2 text-sm font-semibold transition',
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  );

export function AppLayout() {
  const { user, logout } = useAuth();
  const initials = (user?.full_name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <NavLink to="/" className="text-xl">
            <Logo />
          </NavLink>
          {config.useMocks && (
            <span
              className="hidden rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 sm:inline"
              title="These features are served by MSW in the browser (VITE_MOCKS)"
            >
              mock: {[...config.mocks].join(', ')}
            </span>
          )}
          <nav className="ml-auto flex items-center gap-1">
            <NavLink to="/" end className={linkCls}>Events</NavLink>
            <NavLink to="/my-bookings" className={linkCls}>My bookings</NavLink>
          </nav>
          <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-3">
            <div
              className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-600 text-sm font-bold text-white"
              title={`${user?.full_name ?? ''} · ${user?.email ?? ''}${user?.city ? ` · ${user.city}` : ''}`}
            >
              {initials}
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>Log out</Button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
