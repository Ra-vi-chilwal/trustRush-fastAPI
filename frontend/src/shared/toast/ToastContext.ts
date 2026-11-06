import { createContext } from 'react';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface ToastApi {
  show: (kind: ToastKind, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);
