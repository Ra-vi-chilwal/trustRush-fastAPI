import { createBrowserRouter } from 'react-router-dom';
import { setUnauthorizedHandler } from '@/shared/api/client';
import { GuestOnlyRoute, ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { SignupPage } from '@/features/auth/pages/SignupPage';
import type { AuthRedirectState } from '@/features/auth/redirectState';
import { EventListPage } from '@/features/events/pages/EventListPage';
import { EventDetailPage } from '@/features/events/pages/EventDetailPage';
import { MyBookingsPage } from '@/features/booking/pages/MyBookingsPage';
import { AppLayout } from './AppLayout';
import { NotFoundPage } from './NotFoundPage';
import { queryClient } from './queryClient';

// Route table — similar to app.use('/x', router) in Express, but for pages.
export const router = createBrowserRouter([
  {
    element: <GuestOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },
  {
    element: <ProtectedRoute />, // everything below requires a logged-in user
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <EventListPage /> },
          { path: '/events/:id', element: <EventDetailPage /> },
          { path: '/my-bookings', element: <MyBookingsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

// 401 from any API call (token expired/invalid): the interceptor already cleared the token;
// here we wipe cached data and do a client-side redirect (no page reload).
setUnauthorizedHandler(() => {
  queryClient.clear();
  const { pathname, search } = window.location;
  if (pathname === '/login') return;
  const state: AuthRedirectState = { from: pathname + search, reason: 'expired' };
  void router.navigate('/login', { replace: true, state });
});
