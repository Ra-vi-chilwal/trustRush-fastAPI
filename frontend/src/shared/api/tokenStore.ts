// JWT storage: memory (fast, the source of truth) + sessionStorage (survives a refresh,
// cleared when the tab closes). Listeners let React re-render when the token changes,
// including when the axios interceptor clears it on a 401.
const STORAGE_KEY = 'ticketrush.access_token';

type Listener = (token: string | null) => void;

function readSession(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage can be blocked (privacy mode)
  }
}

function writeSession(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(STORAGE_KEY, token);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore: memory copy still works for this page load
  }
}

let memoryToken: string | null = readSession();
const listeners = new Set<Listener>();

function update(token: string | null): void {
  if (token === memoryToken) return;
  memoryToken = token;
  writeSession(token);
  listeners.forEach((fn) => fn(token));
}

export const tokenStore = {
  get: (): string | null => memoryToken,
  set: (token: string): void => update(token),
  clear: (): void => update(null),
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
