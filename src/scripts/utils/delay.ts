/**
 * Creates a timeout with the given duration and returns a promise that resolves when the timeout
 * completes.
 * @param ms Duration in milliseconds.
 * @returns Empty promise.
 */
export const timeout = (ms = 0, signal?: AbortSignal) =>
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
 * Creates a timeout with a random duration and returns a promise that resolves when the timeout
 * completes.
 * @param durations Minimum and maximum duration in milliseconds.
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
  signal?: AbortSignal,
) => timeout(Math.random() * (max - min) + min, signal);
