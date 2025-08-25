import { AbortError } from './error';

/**
 * Creates a timeout with the given duration and returns a promise that resolves when the timeout
 * completes.
 * @param ms Duration in milliseconds.
 * @param signal Abort signal.
 * @returns Empty promise.
 */
export const timeout = (ms: number, signal: AbortSignal | null): Promise<AbortError | null> =>
  new Promise((resolve) => {
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve(null);
    }, ms);

    const onAbort = () => {
      clearTimeout(timeout);
      resolve(new AbortError());
    };

    signal?.addEventListener('abort', onAbort, {
      once: true,
    });
  });

/**
 * Creates a timeout with a random duration and returns a promise that resolves when the timeout
 * completes.
 * @param durations Minimum and maximum duration in milliseconds.
 * @param signal Abort signal.
 * @returns Empty promise.
 */
export const randomTimeout = (
  {
    min,
    max,
  }: {
    /**
     * Minimum duration in milliseconds.
     */
    min: number;

    /**
     * Maximum duration in milliseconds.
     */
    max: number;
  },
  signal: AbortSignal | null,
): Promise<AbortError | null> => timeout(Math.random() * (max - min) + min, signal);
