import { createContext } from 'react';
import type { LoginRequest, SignupRequest, User } from './types';

export type AuthStatus = 'anonymous' | 'loading' | 'authenticated' | 'error';

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  error: unknown;
  login: (values: LoginRequest) => Promise<void>;
  signup: (values: SignupRequest) => Promise<void>;
  logout: () => void;
  retry: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
