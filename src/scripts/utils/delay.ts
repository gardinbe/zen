import { withAbortable } from './abortable';

/**
 * Delays execution for the given number of milliseconds using `requestAnimationFrame`.
 *
 * Value *shouldn't* be less than 16.7ms as that's the fastest a 60fps screen can refresh.
 * @param ms Duration in milliseconds.
 * @param signal Abort signal.
 * @returns Promise that resolves to `true` if completed successfully, and `false` if aborted.
 */
export const delay = async (ms: number, signal: AbortSignal | null): Promise<boolean> => {
  let id = 0;

  const promise = withAbortable(
    signal,
    () => {
      const start = performance.now();
      const end = start + ms;

      return new Promise<boolean>((resolve) => {
        const tick: FrameRequestCallback = (now) => {
          if (now < end) {
            id = requestAnimationFrame(tick);
            return;
          }

          cancelAnimationFrame(id);
          resolve(true);
        };

        id = requestAnimationFrame(tick);
      });
    },
    () => cancelAnimationFrame(id),
  );

  try {
    await promise;
    return true;
  } catch {
    return false;
  }
};

/**
 * Delays execution for a random number of milliseconds using `requestAnimationFrame`.
 *
 * Values *shouldn't* be less than 16.7ms as that's the fastest a 60fps screen can refresh.
 * @param min Minimum duration in milliseconds.
 * @param max Maximum duration in milliseconds.
 * @param signal Abort signal.
 * @returns Promise that resolves to `true` if completed successfully, and `false` if aborted.
 */
export const randomDelay = (
  min: number,
  max: number,
  signal: AbortSignal | null,
): Promise<boolean> => delay(Math.random() * (max - min) + min, signal);
