import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { config } from '@/shared/config';
import { tokenStore } from './tokenStore';
import { toApiError } from './errors';

/**
 * The ONE axios instance. Every feature's api.ts imports this.
 * Think of the interceptors as Express middleware, but running on the client:
 *   request interceptor  ~ middleware that runs before every outgoing call
 *   response interceptor ~ an error-handling middleware for every response
 */
export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 15_000,
  // Send cookies (the httpOnly refresh token) even if the API is on another origin.
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ---- 401 handling ----
// The router registers a handler (so it can navigate without a full reload).
// Before that's registered, fall back to a hard redirect.
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler = () => {
  if (window.location.pathname !== '/login') window.location.assign('/login');
};
export function setUnauthorizedHandler(fn: UnauthorizedHandler): void {
  onUnauthorized = fn;
}

// A wrong password on /auth/login also returns 401. That's not "session expired",
// so these endpoints never trigger a refresh or a redirect.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/logout'];
const isAuthEndpoint = (url = ''): boolean => AUTH_ENDPOINTS.some((p) => url.endsWith(p));

// ---- silent refresh ----
// POST /auth/refresh: the browser attaches the httpOnly cookie automatically.
// Single-flight: if 5 requests get 401 at once, they all wait on ONE refresh call.
// (Two refreshes with the same cookie would look like token reuse to the backend.)
let refreshInFlight: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= axios
    .post<{ access_token: string }>(`${config.apiBaseUrl}/auth/refresh`, null, {
      withCredentials: true,
      timeout: 15_000,
    })
    .then((res) => {
      tokenStore.set(res.data.access_token);
      return res.data.access_token;
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

// ---- request: attach JWT ----
apiClient.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  const token = tokenStore.get();
  if (token) req.headers.set('Authorization', `Bearer ${token}`);
  return req;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

// ---- response: on 401 refresh once and replay; otherwise normalise the error ----
apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    if (error.response?.status === 401 && original && !isAuthEndpoint(original.url)) {
      if (!original._retried) {
        original._retried = true;
        const token = await refreshAccessToken();
        if (token) {
          original.headers.set('Authorization', `Bearer ${token}`);
          return apiClient(original); // replay the request with the new token
        }
      }
      // Refresh failed (cookie missing/expired/revoked): the session is really over.
      tokenStore.clear();
      onUnauthorized();
    }

    return Promise.reject(toApiError(error));
  },
);
