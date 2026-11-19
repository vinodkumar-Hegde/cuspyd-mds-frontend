/** The browser speaks HTTP only. Credentials and database code stay in backend/. */
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'mdslate_access_token';
export const AUTH_EXPIRED = 'mdslate:auth-expired';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function token() { return localStorage.getItem(TOKEN_KEY); }
export function storeToken(value: string | null) {
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}

export function mediaUrl(value?: string | null) {
  return value?.startsWith('/api/uploads/') ? `${API_BASE}${value}` : value || '';
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const accessToken = token();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options, headers, signal: options.signal ?? AbortSignal.timeout(60000),
    });
  } catch {
    throw new ApiError(0, 'The service could not be reached. Please try again.');
  }
  if (!response.ok) {
    const json = await response.json().catch(() => null);
    if (response.status === 401 && accessToken && path !== '/api/auth/login') {
      storeToken(null);
      window.dispatchEvent(new Event(AUTH_EXPIRED));
    }
    const detail = typeof json?.detail === 'string' ? json.detail
      : Array.isArray(json?.detail) ? json.detail.map((item: {loc?: string[];msg?: string}) =>
        `${item.loc?.slice(1).join('.') || 'Input'}: ${item.msg || 'Invalid value'}`).join('; ')
      : `Request failed (${response.status})`;
    throw new ApiError(response.status, detail);
  }
  return response;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, options);
  return response.status === 204 ? undefined as T : response.json();
}

export function apiGet<T>(path: string) { return apiRequest<T>(path); }
export function apiPost<T>(path: string, value: unknown) {
  return apiRequest<T>(path, {method: 'POST', body: JSON.stringify(value)});
}
export function apiPatch<T>(path: string, value: unknown) {
  return apiRequest<T>(path, {method: 'PATCH', body: JSON.stringify(value)});
}
export function apiDelete(path: string) { return apiRequest<void>(path, {method: 'DELETE'}); }

/** Explicit result handling for forms that display their own error messages. */
export async function apiResult<T>(request: Promise<T>) {
  try { return { data: await request, error: null }; }
  catch (error) { return { data: null, error: { message: error instanceof Error ? error.message : 'Request failed' } }; }
}
