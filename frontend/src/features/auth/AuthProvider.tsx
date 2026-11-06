import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { refreshAccessToken } from '@/shared/api/client';
import { tokenStore } from '@/shared/api/tokenStore';
import { authApi, authKeys } from './api';
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext';
import type { LoginRequest, SignupRequest } from './types';

/**
 * Session = access token (tokenStore) + current user (GET /auth/me, cached by TanStack Query).
 * Like `req.user` populated by an auth middleware in Express — except here it lives
 * in React context so any component can read it.
 *
 * The refresh token is an httpOnly cookie that JS can't see. So on first load with no
 * access token (new tab, or sessionStorage cleared) we just *try* POST /auth/refresh:
 * if the cookie is valid we get a fresh access token and the user stays logged in.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(tokenStore.get);
  const [restoring, setRestoring] = useState(() => tokenStore.get() === null);

  // The axios interceptor sets/clears the token on refresh/401: keep React in sync.
  useEffect(() => tokenStore.subscribe(setToken), []);

  // Silent session restore from the refresh cookie (once, on mount).
  useEffect(() => {
    if (!restoring) return;
    let active = true;
    // StrictMode runs this twice in dev; refreshAccessToken is single-flight, so it's one request.
    void refreshAccessToken().finally(() => {
      if (active) setRestoring(false);
    });
    return () => {
      active = false;
    };
  }, [restoring]);

  const me = useQuery({
    queryKey: authKeys.me,
    queryFn: ({ signal }) => authApi.me(signal),
    enabled: token !== null,
    staleTime: 5 * 60_000,
  });

  const status: AuthStatus = restoring
    ? 'loading'
    : token === null
      ? 'anonymous'
      : me.isSuccess
        ? 'authenticated'
        : me.isError
          ? 'error'
          : 'loading';

  const login = useCallback(
    async (values: LoginRequest) => {
      const { access_token } = await authApi.login(values);
      tokenStore.set(access_token);
      try {
        // Load the user before resolving, so the redirect lands on a ready page.
        await queryClient.fetchQuery({ queryKey: authKeys.me, queryFn: ({ signal }) => authApi.me(signal) });
      } catch (e) {
        tokenStore.clear();
        throw e;
      }
    },
    [queryClient],
  );

  const signup = useCallback(
    async (values: SignupRequest) => {
      await authApi.signup(values); // 201 {id, email, full_name, ...}, no token
      await login({ email: values.email, password: values.password });
    },
    [login],
  );

  const logout = useCallback(() => {
    // Fire-and-forget: even if the request fails, the user is logged out locally.
    void authApi.logout().catch(() => undefined);
    tokenStore.clear();
    queryClient.clear(); // drop every cached response of the previous user
  }, [queryClient]);

  const { refetch } = me;
  const retry = useCallback(() => void refetch(), [refetch]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: status === 'authenticated' ? me.data ?? null : null,
      error: me.error,
      login,
      signup,
      logout,
      retry,
    }),
    [status, me.data, me.error, login, signup, logout, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
