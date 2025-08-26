import { withAbortable } from './abortable';

/**
 * Delays execution for the given number of milliseconds.
 * @param ms Delay duration in milliseconds.
 * @param signal Abort signal.
 * @returns Promise that resolves to `true` if completed successfully, and `false` if aborted.
 */
export const delay = (ms: number, signal: AbortSignal | null): Promise<boolean> =>
  new Promise((resolve) => {
    const cleanup = () => {
      cancelAnimationFrame(frameRequestId);
    };

    let frameRequestId = 0;

    withAbortable(
      signal,
      () => {
        const start = performance.now();
        const end = start + ms;

        const tick: FrameRequestCallback = (now) => {
          if (now < end) {
            frameRequestId = requestAnimationFrame(tick);
            return;
          }

          cleanup();
          resolve(true);
        };

        frameRequestId = requestAnimationFrame(tick);
      },
      () => {
        cleanup();
        resolve(false);
      },
    );
  });

/**
 * Delays execution for a random number of milliseconds.
 * @param min Minimum duration in milliseconds.
 * @param max Maximum duration in milliseconds.
 * @param signal Abort signal.
 * @returns Promise that resolves to `true` if completed successfully, and `false` if aborted.
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
  signal: AbortSignal | null,
): Promise<boolean> => delay(Math.random() * (max - min) + min, signal);
