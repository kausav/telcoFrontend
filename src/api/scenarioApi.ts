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

const MAX_SPEC_RETRIES = 6;
const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Step 3: generate the dataset.
 *
 * While a scenario's behaviour design is still running in the background the backend answers 503 with
 * `details.retryAfterSeconds`; this waits that long and asks again (up to MAX_SPEC_RETRIES times) and reports each
 * wait through `onWait`, so the caller can tell the user.
 */
export async function generateScenario(
  body: ScenarioGenerateRequest,
  onWait?: (seconds: number, attempt: number) => void,
): Promise<ScenarioGenerateResponse> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return (await api.post<ScenarioGenerateResponse>('/scenario/generate', body, { timeout: LONG_TIMEOUT_MS })).data;
    } catch (error) {
      const details = getApiErrorBody(error)?.details as { retryAfterSeconds?: number } | null | undefined;
      const wait = Number(details?.retryAfterSeconds);
      if (getApiErrorStatus(error) !== 503 || !Number.isFinite(wait) || wait <= 0 || attempt > MAX_SPEC_RETRIES) throw error;
      onWait?.(wait, attempt);
      await sleep(wait * 1000);
    }
  }
}
