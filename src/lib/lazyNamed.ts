import { lazy, type ComponentType } from 'react';

/** React.lazy for a component that is a named export: lazyNamed(() => import('./Page'), 'Page'). */
export function lazyNamed<K extends string, C extends ComponentType<any>>(load: () => Promise<Record<K, C>>, name: K) {
  return lazy(() => load().then(module => ({ default: module[name] })));
}
