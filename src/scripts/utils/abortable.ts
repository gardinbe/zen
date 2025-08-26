import { type Result } from './result';
import { AbortError } from './error';

/**
 * Returns a promise that resolves to the result of the given executor function.
 *
 * If the promise is aborted, the executor function is aborted and the promise is rejected with an
 * `AbortError`.
 * @param signal Abort signal.
 * @param executor Executor function.
 * @param cleanup Cleanup function.
 * @returns Promise.
 * @throws {AbortError} If the promise is aborted.
 */
export const withAbortable = <T>(
  signal: AbortSignal | null,
  executor: () => T | Promise<T>,
  cleanup?: () => void | Promise<void>,
): Promise<T> =>
  new Promise((resolve, reject) => {
    const cleanupAll = async () => {
      signal?.removeEventListener('abort', abort);
      await cleanup?.();
    };

    const settle = async (result: T) => {
      if (settled) {
        return;
      }

      settled = true;
      await cleanupAll();
      resolve(result);
    };

    const abort = (error: unknown = new AbortError()) => {
      cleanupAll();
      reject(error);
    };

    if (signal?.aborted) {
      abort();
      return;
    }

    let settled = false;

    signal?.addEventListener('abort', abort, {
      once: true,
    });

    (async () => {
      try {
        const result = await executor();
        settle(result);
      } catch (error) {
        abort(error);
      }
    })();
  });

/**
 * Returns a promise that resolves with the `Result` of the given executor function.
 *
 * If the promise is aborted, the executor function is aborted and the promise resolves to an
 * `ErrorResult` with an `AbortError`.
 * @param signal Abort signal.
 * @param executor Executor function.
 * @param cleanup Cleanup function.
 * @returns Promise.
 */
export const withAbortableResult = <T, E>(
  signal: AbortSignal | null,
  executor: () => Promise<Result<T, E>>,
  cleanup?: () => void | Promise<void>,
): Promise<Result<T, E | AbortError>> =>
  withAbortable(signal, executor, cleanup).catch((error) => [null, error]);
