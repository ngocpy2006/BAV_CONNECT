'use client';

import { useEffect, useState } from 'react';

type Resource<T> =
  { state: 'loading' } | { state: 'ready'; data: T } | { state: 'error'; error: unknown };

export function useApiResource<T>(load: (signal: AbortSignal) => Promise<T>): Resource<T> {
  const [result, setResult] = useState<Resource<T>>({ state: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ state: 'ready', data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setResult({ state: 'error', error });
      },
    );
    return () => controller.abort();
  }, [load]);
  return result;
}
