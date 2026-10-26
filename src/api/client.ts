import axios, { AxiosError } from 'axios';
import type { ApiErrorBody } from './types';

/** Backend base URL; set VITE_API_BASE_URL in .env (see .env.example). */
export const API_BASE_URL: string =
  ((import.meta.env.VITE_API_HOST as string | undefined) || 'http://localhost:8000').replace(/\/+$/, '');

/** Reads are quick; the LLM-backed calls (propose, confirm, generate) pass their own, longer, timeout. */
export const DEFAULT_TIMEOUT_MS = 30_000;
export const LONG_TIMEOUT_MS = 5 * 60_000;

/**
 * The one axios instance every API module uses, so cross-cutting behaviour lives in one place.
 *
 * Interceptors go here when they are needed, for example:
 *
 *   api.interceptors.request.use(config => {
 *     config.headers.Authorization = `Bearer ${getToken()}`;
 *     return config;
 *   });
 *   api.interceptors.response.use(
 *     response => response,
 *     error => { ...refresh the token, redirect on 401, report to monitoring...; return Promise.reject(error); },
 *   );
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
});

/**
 * Static API token, sent on every request until a real login flow exists. Set VITE_API_TOKEN in .env to the value of the
 * backend's API_STATIC_TOKENS. (A token in a front-end bundle is visible to anyone who can load the page: fine for an internal
 * stop-gap, replace it with a login flow before the UI is exposed.)
 */
const API_TOKEN: string = ((import.meta.env.VITE_API_TOKEN as string | undefined) || '').trim();

api.interceptors.request.use(config => {
  if (API_TOKEN) config.headers.set('Authorization', `Bearer ${API_TOKEN}`);
  return config;
});

/** The structured error the backend returns ({ success: false, error: { code, message, details, request_id } }), if any. */
export function getApiErrorBody(error: unknown): ApiErrorBody['error'] | null {
  if (!axios.isAxiosError(error)) return null;
  const body = (error as AxiosError<Partial<ApiErrorBody>>).response?.data;
  return body && typeof body === 'object' && body.error && typeof body.error === 'object' ? body.error : null;
}

export function getApiErrorStatus(error: unknown): number | null {
  return axios.isAxiosError(error) ? error.response?.status ?? null : null;
}

/** A message that is fit to show a user, whatever went wrong. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    if (!error.response) return `Cannot reach the server at ${API_BASE_URL}. Check that the backend is running.`;
    const detail = getApiErrorBody(error);
    if (detail) {
      // Validation errors list the offending fields; show them instead of the generic "Request validation failed".
      if (Array.isArray(detail.details) && detail.details.length > 0) {
        const fields = (detail.details as { field?: string | null; message?: string }[])
          .map(item => (item.field ? `${item.field}: ${item.message ?? 'invalid'}` : item.message ?? ''))
          .filter(Boolean);
        if (fields.length) return `${detail.message}: ${fields.slice(0, 3).join('; ')}`;
      }
      return detail.message || fallback;
    }
    return error.message || fallback;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}
