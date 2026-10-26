import { api, getApiErrorBody, getApiErrorStatus, LONG_TIMEOUT_MS } from './client';
import type {
  ScenarioConfirmRequest,
  ScenarioConfirmResponse,
  ScenarioDraftResponse,
  ScenarioGenerateRequest,
  ScenarioGenerateResponse,
  ScenarioProposeRequest,
} from './types';

/** Step 1 -> 2: the backend proposes the schema (variables) for the scenario and returns a draft to review. */
export const proposeScenario = async (body: ScenarioProposeRequest): Promise<ScenarioDraftResponse> =>
  (await api.post<ScenarioDraftResponse>('/scenario/propose', body, { timeout: LONG_TIMEOUT_MS })).data;

/** Step 2 -> 3: approve the draft (with the reviewer's deletions/edits) so it can be generated from. */
export const confirmScenario = async (body: ScenarioConfirmRequest): Promise<ScenarioConfirmResponse> =>
  (await api.post<ScenarioConfirmResponse>('/scenario/confirm', body, { timeout: LONG_TIMEOUT_MS })).data;

// A scenario's behaviour design takes minutes (it can run up to ~12 min with its repair rounds); the backend answers each wait in
// well under a minute, so allow for ~20 min of 30 s retries.
const MAX_SPEC_RETRIES = 60;
const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Step 3: generate the dataset.
 *
 * While a scenario's data design (or its repair) is still running in the background the backend answers 202 Accepted with
 * `{ status: 'designing' | 'refining', retryAfterSeconds }` - not an error. This waits that long and asks again (up to
 * MAX_SPEC_RETRIES times) and reports each wait through `onWait`, so the caller can tell the user. (Older backends answered
 * 503 with the same `retryAfterSeconds` in `details`; that is still understood.)
 */
export async function generateScenario(
  body: ScenarioGenerateRequest,
  onWait?: (seconds: number, attempt: number) => void,
): Promise<ScenarioGenerateResponse> {
  for (let attempt = 1; ; attempt += 1) {
    let wait = NaN;
    try {
      const response = await api.post<ScenarioGenerateResponse>('/scenario/generate', body, { timeout: LONG_TIMEOUT_MS });
      const pending = response.data as unknown as { status?: string; retryAfterSeconds?: number };
      if (response.status !== 202 || !pending || (pending.status !== 'designing' && pending.status !== 'refining')) return response.data;
      wait = Number(pending.retryAfterSeconds);
    } catch (error) {
      const details = getApiErrorBody(error)?.details as { retryAfterSeconds?: number } | null | undefined;
      wait = Number(details?.retryAfterSeconds);
      if (getApiErrorStatus(error) !== 503 || !Number.isFinite(wait) || wait <= 0) throw error;
    }
    if (!Number.isFinite(wait) || wait <= 0 || attempt > MAX_SPEC_RETRIES) {
      throw new Error('The data design is taking longer than expected. Please try again in a few minutes.');
    }
    onWait?.(wait, attempt);
    await sleep(wait * 1000);
  }
}
