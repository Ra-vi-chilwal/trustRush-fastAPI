import axios from 'axios';

// ---- FastAPI error shapes ----
// HTTPException            -> {"detail": "Seat already taken"}
// RequestValidationError   -> {"detail": [{"loc": ["body","email"], "msg": "...", "type": "..."}]}
// Our services also add a stable machine code: {"detail": "...", "code": "EMAIL_TAKEN"}
export interface FastApiValidationIssue {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface FastApiErrorBody {
  detail: string | FastApiValidationIssue[];
  code?: string;
}

function isValidationIssue(v: unknown): v is FastApiValidationIssue {
  return typeof v === 'object' && v !== null && 'loc' in v && 'msg' in v && Array.isArray((v as FastApiValidationIssue).loc);
}

function isFastApiErrorBody(v: unknown): v is FastApiErrorBody {
  if (typeof v !== 'object' || v === null || !('detail' in v)) return false;
  const { detail } = v as { detail: unknown };
  return typeof detail === 'string' || (Array.isArray(detail) && detail.every(isValidationIssue));
}

/** One error type for the whole app. Components only ever see this, never AxiosError. */
export class ApiError extends Error {
  readonly status: number; // 0 = network error / timeout / cancelled
  readonly fieldErrors: Readonly<Record<string, string>>; // from 422: { email: "value is not a valid email" }
  readonly retryAfterSeconds: number | null; // from 429 Retry-After header
  readonly isCanceled: boolean;
  readonly code: string | null; // backend's {code}, e.g. "EMAIL_TAKEN", "INVALID_CREDENTIALS"

  constructor(opts: {
    status: number;
    message: string;
    fieldErrors?: Record<string, string>;
    retryAfterSeconds?: number | null;
    isCanceled?: boolean;
    code?: string | null;
  }) {
    super(opts.message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code ?? null;
    this.fieldErrors = opts.fieldErrors ?? {};
    this.retryAfterSeconds = opts.retryAfterSeconds ?? null;
    this.isCanceled = opts.isCanceled ?? false;
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

/** Retry-After is either seconds ("30") or an HTTP date. */
export function parseRetryAfter(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds));
  const date = Date.parse(String(value));
  if (Number.isNaN(date)) return null;
  return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

function fromDetail(detail: FastApiErrorBody['detail']): { message: string; fieldErrors: Record<string, string> } {
  if (typeof detail === 'string') return { message: detail, fieldErrors: {} };
  const fieldErrors: Record<string, string> = {};
  for (const issue of detail) {
    // ["body", "email"] -> "email"; ["query", "page"] -> "page"
    const field = issue.loc.filter((p) => p !== 'body' && p !== 'query' && p !== 'path').join('.');
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.msg;
  }
  const first = detail[0];
  return { message: first ? first.msg : 'Validation failed', fieldErrors };
}

const FALLBACK: Record<number, string> = {
  400: 'Bad request',
  401: 'Please log in again',
  403: 'You are not allowed to do that',
  404: 'Not found',
  409: 'Conflict',
  429: 'Too many requests',
  500: 'Server error',
  502: 'Gateway error: a service is down',
  503: 'Service unavailable',
  504: 'Gateway timeout',
};

/** Convert anything thrown by axios (or elsewhere) into an ApiError. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (axios.isCancel(err)) {
    return new ApiError({ status: 0, message: 'Request cancelled', isCanceled: true });
  }

  if (axios.isAxiosError(err)) {
    if (!err.response) {
      const timedOut = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT';
      return new ApiError({
        status: 0,
        message: timedOut ? 'The request timed out' : 'Cannot reach the server. Is the gateway running?',
      });
    }
    const { status, data, headers } = err.response;
    const parsed = isFastApiErrorBody(data) ? fromDetail(data.detail) : null;
    return new ApiError({
      status,
      message: parsed?.message ?? FALLBACK[status] ?? `Request failed (${status})`,
      fieldErrors: parsed?.fieldErrors,
      retryAfterSeconds: parseRetryAfter(headers['retry-after']),
      code: isFastApiErrorBody(data) && typeof data.code === 'string' ? data.code : null,
    });
  }

  return new ApiError({ status: 0, message: err instanceof Error ? err.message : 'Unknown error' });
}
