export type ApiMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ApiResponse<T> = {
  data: T;
  meta?: ApiMeta;
};

export type QueryValue = string | number | boolean | null | undefined;

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  query?: Record<string, QueryValue>;
  body?: unknown;
  timeoutMs?: number;
};

export class ApiClientError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly url: string;
  readonly method: string;
  readonly details?: unknown;

  constructor(params: {
    message: string;
    code: string;
    status?: number;
    url: string;
    method: string;
    details?: unknown;
    cause?: unknown;
  }) {
    super(params.message, params.cause ? { cause: params.cause } : undefined);
    this.name = 'ApiClientError';
    this.code = params.code;
    this.status = params.status;
    this.url = params.url;
    this.method = params.method;
    this.details = params.details;
  }
}

const DEFAULT_API_BASE_URL = 'http://localhost:3001';
const DEFAULT_TIMEOUT_MS = 10000;

function resolveBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!value) return DEFAULT_API_BASE_URL;
  return value.replace(/\/+$/, '');
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${resolveBaseUrl()}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function normalizeJsonPayload<T>(payload: unknown): ApiResponse<T> {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const envelope = payload as { data: T; meta?: ApiMeta };
    return { data: envelope.data, meta: envelope.meta };
  }

  return { data: payload as T };
}

async function parseErrorResponse(response: Response): Promise<{ message: string; details?: unknown }> {
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const json = await response.json();
      if (json && typeof json === 'object') {
        const body = json as { message?: string; error?: string; details?: unknown };
        return {
          message: body.message || body.error || `HTTP ${response.status}`,
          details: json,
        };
      }
    }

    const text = await response.text();
    if (text) return { message: text };
  } catch {
    // Ignore parser failures and fallback below.
  }

  return { message: `HTTP ${response.status}` };
}

function createTimeoutController(signal: AbortSignal | null | undefined, timeoutMs: number): {
  controller: AbortController;
  cleanup: () => void;
  hasTimedOut: () => boolean;
} {
  const controller = new AbortController();
  let timedOut = false;

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const abortListener = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', abortListener, { once: true });
    }
  }

  return {
    controller,
    cleanup: () => {
      clearTimeout(timeout);
      if (signal) {
        signal.removeEventListener('abort', abortListener);
      }
    },
    hasTimedOut: () => timedOut,
  };
}

async function request<T>(method: string, path: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
  const url = buildUrl(path, options.query);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutController = createTimeoutController(options.signal, timeoutMs);

  const headers = new Headers(options.headers || {});
  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      method,
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: timeoutController.controller.signal,
    });

    if (!response.ok) {
      const parsed = await parseErrorResponse(response);
      throw new ApiClientError({
        message: `${method} ${path} failed: ${parsed.message}`,
        code: 'HTTP_ERROR',
        status: response.status,
        method,
        url,
        details: parsed.details,
      });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      return { data: text as T };
    }

    const payload = await response.json();
    return normalizeJsonPayload<T>(payload);
  } catch (error) {
    if (error instanceof ApiClientError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      const code = timeoutController.hasTimedOut() ? 'REQUEST_TIMEOUT' : 'REQUEST_ABORTED';
      const message = timeoutController.hasTimedOut()
        ? `${method} ${path} failed: request timed out after ${timeoutMs}ms`
        : `${method} ${path} was aborted`;

      throw new ApiClientError({
        message,
        code,
        method,
        url,
        cause: error,
      });
    }

    throw new ApiClientError({
      message: `${method} ${path} failed: network error`,
      code: 'NETWORK_ERROR',
      method,
      url,
      cause: error,
    });
  } finally {
    timeoutController.cleanup();
  }
}

export const apiClient = {
  get: <T>(path: string, options?: ApiRequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, options?: ApiRequestOptions) => request<T>('POST', path, options),
  put: <T>(path: string, options?: ApiRequestOptions) => request<T>('PUT', path, options),
  patch: <T>(path: string, options?: ApiRequestOptions) => request<T>('PATCH', path, options),
  delete: <T>(path: string, options?: ApiRequestOptions) => request<T>('DELETE', path, options),
};
