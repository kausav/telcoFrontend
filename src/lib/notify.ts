import { toast } from 'react-toastify';
import { getApiErrorMessage } from '../api/client';

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

/** Every notification in the app goes through here, so the toast library can be swapped or restyled in one place. */
export function notify(message: string, kind: ToastKind = 'info'): void {
  toast[kind](message);
}

/** Show a failed API call as an error toast and return the message that was shown. */
export function notifyApiError(error: unknown, fallback?: string): string {
  const message = getApiErrorMessage(error, fallback);
  toast.error(message);
  return message;
}
