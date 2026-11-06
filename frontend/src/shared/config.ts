// Read env vars once, in one place, with types and defaults.
// (Like a `config.js` that reads process.env in Express.)
const trimSlash = (url: string): string => url.replace(/\/+$/, '');

export const MOCKABLE_FEATURES = ['auth', 'events', 'bookings'] as const;
export type MockableFeature = (typeof MOCKABLE_FEATURES)[number];

/**
 * VITE_MOCKS picks which features MSW fakes; the rest go to the real backend.
 *   "all" -> everything mocked (no backend needed)
 *   "none" or "" -> nothing mocked
 *   "events,bookings" -> auth hits FastAPI, events/bookings are still faked
 */
function parseMocks(raw: string | undefined): ReadonlySet<MockableFeature> {
  const value = (raw ?? 'all').trim().toLowerCase();
  if (value === 'all') return new Set(MOCKABLE_FEATURES);
  if (value === 'none' || value === '') return new Set();
  const known = new Set<string>(MOCKABLE_FEATURES);
  return new Set(
    value
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is MockableFeature => known.has(s)),
  );
}

const mocks = parseMocks(import.meta.env.VITE_MOCKS);

export const config = {
  apiBaseUrl: trimSlash(import.meta.env.VITE_API_BASE_URL || '/api'),
  mocks,
  useMocks: mocks.size > 0,
  // Only used by the MSW mock backend. VITE_* values end up in the JS bundle,
  // so never put real credentials here.
  demo: {
    email: import.meta.env.VITE_DEMO_EMAIL || 'demo@ticketrush.dev',
    password: import.meta.env.VITE_DEMO_PASSWORD || 'password123',
  },
} as const;
