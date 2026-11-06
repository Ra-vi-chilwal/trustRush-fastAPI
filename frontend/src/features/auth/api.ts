import { apiClient } from '@/shared/api/client';
import type { LoginRequest, SignupRequest, SignupResponse, TokenResponse, User } from './types';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export const authApi = {
  signup: (body: SignupRequest) => apiClient.post<SignupResponse>('/auth/signup', body).then((r) => r.data),

  // Response body has the access token; the refresh token arrives as a Set-Cookie header.
  login: (body: LoginRequest) => apiClient.post<TokenResponse>('/auth/login', body).then((r) => r.data),

  me: (signal?: AbortSignal) => apiClient.get<User>('/auth/me', { signal }).then((r) => r.data),

  // Revokes the refresh-token family server-side and clears the cookie.
  logout: () => apiClient.post<void>('/auth/logout').then(() => undefined),
};
