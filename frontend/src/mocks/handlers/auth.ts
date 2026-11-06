import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import type { SignupResponse, TokenResponse, User } from '@/features/auth/types';
import { db, save } from '../db';
import { api, httpError, issueToken, latency, readJson, unauthorized, userFromRequest, validationError } from '../utils';

// Server-side validation (what your Pydantic models will do).
const signupBody = z.object({
  email: z.string().email('value is not a valid email address'),
  full_name: z.string().min(1, 'Field required'),
  password: z.string().min(8, 'String should have at least 8 characters'),
});
const loginBody = z.object({ email: z.string(), password: z.string() });

export const authHandlers = [
  http.post(api('/auth/signup'), async ({ request }) => {
    await latency();
    const parsed = signupBody.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error.issues);
    const { email, full_name, password } = parsed.data;

    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return httpError(409, 'Email already registered');
    }
    const user = { id: db.nextUserId++, email, full_name, password, city: null };
    db.users.push(user);
    save();
    return HttpResponse.json({ id: user.id, email, full_name } satisfies SignupResponse, { status: 201 });
  }),

  http.post(api('/auth/login'), async ({ request }) => {
    await latency();
    const parsed = loginBody.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error.issues);
    const user = db.users.find((u) => u.email.toLowerCase() === parsed.data.email.toLowerCase());
    if (!user || user.password !== parsed.data.password) {
      return httpError(401, 'Incorrect email or password');
    }
    return HttpResponse.json({
      access_token: issueToken(user),
      token_type: 'bearer',
      expires_in: 15 * 60,
    } satisfies TokenResponse);
  }),

  // Mock mode has no refresh cookie: refresh always fails, so a lost access token = log in again.
  http.post(api('/auth/refresh'), async () => {
    await latency();
    return httpError(401, 'Invalid or expired refresh token');
  }),

  http.post(api('/auth/logout'), async () => {
    await latency();
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(api('/auth/me'), async ({ request }) => {
    await latency();
    const user = userFromRequest(request);
    if (!user) return unauthorized();
    return HttpResponse.json({ id: user.id, email: user.email, full_name: user.full_name, city: user.city } satisfies User);
  }),
];
