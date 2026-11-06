import { delay, HttpResponse } from 'msw';
import type { ZodIssue } from 'zod';
import { config } from '@/shared/config';
import type { FastApiValidationIssue } from '@/shared/api/errors';
import { db, type MockUser } from './db';

/** '/events' -> '/api/events' (or the full URL if VITE_API_BASE_URL is absolute) */
export const api = (path: string): string => `${config.apiBaseUrl}${path}`;

/** Realistic network latency. */
export const latency = () => delay(150 + Math.random() * 350);

/** FastAPI HTTPException shape. */
export const httpError = (status: number, detail: string, headers?: Record<string, string>) =>
  HttpResponse.json({ detail }, { status, headers });

/** FastAPI RequestValidationError shape (422). */
export const validationError = (issues: ZodIssue[]) => {
  const detail: FastApiValidationIssue[] = issues.map((i) => ({
    loc: ['body', ...i.path],
    msg: i.message,
    type: i.code,
  }));
  return HttpResponse.json({ detail }, { status: 422 });
};

// Token format for mocks only: "mock.<userId>.<issuedAt>". A real backend issues a signed JWT.
export const issueToken = (user: MockUser): string => `mock.${user.id}.${Date.now()}`;

// Real FastAPI users get mock-db ids in their own range, so they never share
// bookings with the seeded demo user (id 1).
const REAL_USER_ID_OFFSET = 1_000_000;

/** Read (NOT verify) a real JWT from the FastAPI auth-service. Mocks can't know SECRET_KEY. */
function userFromRealJwt(token: string): MockUser | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { sub?: unknown; exp?: unknown; type?: unknown };
    if (payload.type !== 'access') return null;
    // Honour expiry so the refresh flow still gets exercised against mocked endpoints.
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) return null;
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    return { id: REAL_USER_ID_OFFSET + id, email: '', full_name: '', password: '', city: null };
  } catch {
    return null;
  }
}

export function userFromRequest(request: Request): MockUser | null {
  const header = request.headers.get('Authorization') ?? '';
  const mock = /^Bearer mock\.(\d+)\.\d+$/.exec(header);
  if (mock) return db.users.find((u) => u.id === Number(mock[1])) ?? null;

  // Hybrid mode (VITE_MOCKS without "auth"): the token came from the real backend.
  if (!config.mocks.has('auth') && header.startsWith('Bearer ')) {
    return userFromRealJwt(header.slice('Bearer '.length));
  }
  return null;
}

export const unauthorized = () =>
  httpError(401, 'Could not validate credentials', { 'WWW-Authenticate': 'Bearer' });

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
