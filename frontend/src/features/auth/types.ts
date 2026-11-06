import { z } from 'zod';
import type { EntityId } from '@/shared/types';

// ---------- API contract ----------
export interface SignupRequest {
  email: string;
  full_name: string;
  password: string;
}

export interface SignupResponse {
  id: EntityId;
  email: string;
  full_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** The refresh token is NOT in the body: the backend sets it as an httpOnly cookie. */
export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number; // seconds
}

export interface User {
  id: EntityId;
  email: string;
  full_name: string;
  city: string | null;
  role?: string;
}

// ---------- Form validation (Zod ~ Pydantic models, but in the browser) ----------
const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
}) satisfies z.ZodType<LoginRequest>;

export const signupSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Enter your full name').max(80, 'Too long'),
    email,
    password: z.string().min(8, 'Use at least 8 characters').max(128, 'Too long'),
    confirm_password: z.string().min(1, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
