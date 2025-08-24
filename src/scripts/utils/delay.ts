/**
 * Creates a promise that resolves after the specified duration.
 * @param ms Duration in milliseconds.
 * @returns Empty promise.
 */
export const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (!signal) {
      setTimeout(resolve, ms);
      return;
    }

    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeout);
      reject();
    };

    signal.addEventListener('abort', onAbort, { once: true });
  });

/**
 * Creates a promise that resolves after a random duration.
 * @param options Minimum and maximum duration in milliseconds.
 * @returns Empty promise.
 */
export const randomDelay = (
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
  signal?: AbortSignal,
) => delay(Math.random() * (max - min) + min, signal);
