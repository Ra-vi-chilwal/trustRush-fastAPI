# TicketRush — frontend

React 18 · TypeScript · Vite · TanStack Query · Axios · Tailwind · React Hook Form + Zod · MSW

## Run with mocks (no backend needed)

```bash
cd frontend
npm install
cp .env.example .env      # VITE_MOCKS=all
npm run dev               # http://localhost:5173
```

Log in with the demo account from `.env` (default `demo@ticketrush.dev` / `password123`),
or sign up. The login page has a **Use demo** button in mock mode.

MSW (Mock Service Worker) intercepts requests inside the browser, so the Network tab still
shows real-looking requests and responses. The mock simulates:

| Scenario | How to trigger it |
|---|---|
| **409** seat taken | ~10% of holds fail at random, and holding a seat that turned amber/grey also fails |
| **429** rate limit | hold more than 5 seats within one minute, which returns a `Retry-After` header |
| Hold expiry | holds expire 5 minutes after `hold_expires_at` |
| Other buyers | seats get sold randomly while the seat map refreshes every 10s |
| 401 | delete `ticketrush.access_token` from sessionStorage and click anything |

Mock data is stored in localStorage (`ticketrush.mockdb.v1`). Delete that key to reset it.

## Real backend, one feature at a time

`VITE_MOCKS` picks which features MSW fakes. Everything else goes to the real API:

| `VITE_MOCKS` | Result |
|---|---|
| `all` | everything mocked, no backend needed |
| `events,bookings` | **auth hits FastAPI**, events and bookings are still faked (current setup) |
| `none` | everything real |

In hybrid mode the mocked events and bookings accept the real JWT from FastAPI (they decode it without
verifying it), so you can log in for real and still use the seat map.

**Dev proxy** (`.env`, read by `vite.config.ts`, never bundled):

```
API_PROXY_TARGET=http://localhost:8000   # uvicorn directly
API_PROXY_STRIP_PREFIX=true              # /api/auth/login -> /auth/login (what Nginx will do)
```

When Nginx is up: `API_PROXY_TARGET=http://localhost:80` and `API_PROXY_STRIP_PREFIX=false`.

The browser only ever calls `http://localhost:5173/api/...` (same origin), so there is **no CORS**, and the
httpOnly refresh cookie (path `/api/auth`) is sent automatically.

### Auth flow

- `POST /auth/login` → `{access_token, token_type, expires_in}` in the body, refresh token as an **httpOnly cookie**.
- Access token: memory + sessionStorage. JS never sees the refresh token.
- Any 401 → the axios interceptor calls `POST /auth/refresh` **once** (single-flight) and replays the request.
  If the refresh fails, the token is cleared and the user is redirected to `/login`.
- First load with no access token (for example a new tab) → silent `POST /auth/refresh`, so the session survives.
- Logout → `POST /auth/logout` revokes the token family server-side and clears the cookie.

If you set a full URL instead (`VITE_API_BASE_URL=http://localhost/api`), the request skips the
proxy, and Nginx (or FastAPI's `CORSMiddleware`) must allow origin `http://localhost:5173` and the
`Authorization` and `Idempotency-Key` headers.

**Production:** `npm run build` → serve `dist/` from the same Nginx (with `try_files $uri /index.html;`
for client-side routes). `/api` keeps working with no CORS.

### Backend checklist (what the UI relies on)

- Response shapes exactly as in `src/features/*/types.ts`. Those files are the contract.
- `POST /auth/login` takes **JSON** `{email, password}`, not OAuth2 form data.
- `401` on a missing or expired token. The UI clears the token and redirects to `/login`.
- `POST /bookings`: read the `Idempotency-Key` header. A repeated key from the same user must return the
  **same** booking. Return `409` if the seat is taken, and `429` + `Retry-After: <seconds>` when rate limited.
- `hold_expires_at` must be **timezone-aware** (`2026-11-03T10:05:00Z`). A naive datetime is read as
  local time and the countdown will be wrong.
- Errors: `HTTPException(status_code, detail="message")`. The UI shows `detail`, and 422 errors
  are mapped onto form fields.
- Optional: `/bookings/me` may return `status: "EXPIRED"` for HELD bookings past their expiry.

## Project layout

```
src/
  app/            App providers, router, layout, TanStack Query defaults
  shared/         api client (axios + interceptors), error parsing, token store,
                  UI kit, toasts, hooks (countdown, cooldown, debounce), utils
  features/
    auth/         login/signup pages, AuthProvider (/auth/me), ProtectedRoute
    events/       list + filters + pagination, detail, seat map (polls every 10s)
    booking/      hold → countdown → confirm/cancel, idempotency, my bookings
  mocks/          MSW handlers + in-browser DB (only the features listed in VITE_MOCKS)
```

## Scripts

| | |
|---|---|
| `npm run dev` | dev server + proxy |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | typecheck + production build |
