import axios from 'axios';
import { api, LONG_TIMEOUT_MS } from './client';
import type {
  ErGenerateOutcome,
  ErGenerateResult,
  ErModelJson,
  ErRequest,
  ErSampleSummary,
  ErValidation,
} from './erTypes';

// All ER calls go through the shared axios instance, so the base URL, the API token and the timeouts behave like every other call.

export const listErSamples = async (): Promise<ErSampleSummary[]> => (await api.get<{ samples: ErSampleSummary[] }>('/er/samples')).data.samples;

export const getErSample = async (id: string): Promise<ErModelJson> =>
  (await api.get<{ id: string; model: ErModelJson }>(`/er/samples/${encodeURIComponent(id)}`)).data.model;

/** Always answers 200: `valid` says whether the model can be generated, `errors` why not, `plan` what it would build. */
export const validateErModel = async (body: ErRequest): Promise<ErValidation> => (await api.post<ErValidation>('/er/validate', body)).data;

/** The flat lists the backend adds to a 422 beside the application's error envelope, if this error carries them. */
function modelProblems(error: unknown): { errors: string[]; warnings: string[] } | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 422) return null;
  const data = error.response.data as { errors?: unknown; warnings?: unknown } | undefined;
  if (!data || !Array.isArray(data.errors)) return null;
  const texts = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);
  return { errors: texts(data.errors), warnings: texts(data.warnings) };
}

/** Every table with its rows, plus the integrity report. A model the backend rejects comes back as `{ ok: false, errors }`. */
export async function generateErModel(body: ErRequest): Promise<ErGenerateOutcome> {
  try {
    const response = await api.post<ErGenerateResult>('/er/generate', body, { timeout: LONG_TIMEOUT_MS });
    return { ok: true, result: response.data };
  } catch (error) {
    const problems = modelProblems(error);
    if (problems) return { ok: false, ...problems };
    throw error;
  }
}

export const ER_ZIP_FALLBACK_NAME = 'er_tables.zip';

/** The file name from a Content-Disposition header, if there is one (the backend exposes the header to the browser through CORS). */
export function fileNameFromDisposition(header: unknown): string | null {
  const match = /filename="([^"]+)"/.exec(typeof header === 'string' ? header : '');
  return match ? match[1] : null;
}

/** One CSV per table, the integrity report and the model, as a zip. Throws an Error whose message is fit to show when the model is rejected. */
export async function exportErZip(body: ErRequest): Promise<{ blob: Blob; filename: string }> {
  try {
    const response = await api.post<Blob>('/er/export', body, { responseType: 'blob', timeout: LONG_TIMEOUT_MS });
    return { blob: response.data, filename: fileNameFromDisposition(response.headers['content-disposition']) ?? ER_ZIP_FALLBACK_NAME };
  } catch (error) {
    // With responseType 'blob' an error body arrives as a Blob too; read it so the user sees the reason, not "Request failed".
    const data: unknown = axios.isAxiosError(error) ? error.response?.data : undefined;
    if (data instanceof Blob) {
      try {
        const parsed = JSON.parse(await data.text()) as { errors?: unknown; error?: { message?: string } };
        const reasons = Array.isArray(parsed.errors) ? parsed.errors.map(String) : [];
        if (reasons.length) throw new Error(reasons.slice(0, 3).join('; '));
        if (parsed.error?.message) throw new Error(parsed.error.message);
      } catch (inner) {
        if (inner instanceof Error && !(inner instanceof SyntaxError)) throw inner;
      }
    }
    throw error;
  }
}
