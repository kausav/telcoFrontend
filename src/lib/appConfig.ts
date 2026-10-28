// Settings that can change per deployment without rebuilding the app.
//
// A VITE_* value is normally fixed when the app is built. When the backend also serves this app (single container), it answers
// /runtime-config.js with every VITE_* environment variable of the running service, so the same image can be configured differently
// per environment (dev, test, prod) from Cloud Run alone. The run-time value wins; the build-time value is the fallback, so local
// development with a .env file works unchanged.
//
// Everything here reaches the browser: only put values in VITE_* variables that you would be happy to show to a visitor.
type Runtime = Record<string, string | undefined>;

const runtime = (): Runtime =>
  (typeof window !== 'undefined' && (window as unknown as { __APP_CONFIG__?: Runtime }).__APP_CONFIG__) || {};

/** `buildValue` is the literal `import.meta.env.VITE_NAME` at the call site (Vite only replaces it when written out in full). */
export function setting(name: string, buildValue: string | undefined): string {
  const live = (runtime()[name] ?? '').trim();
  return live !== '' ? live : (buildValue ?? '').trim();
}
