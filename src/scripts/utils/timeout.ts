import { withAbortable } from './abortable';

/**
 * Delays execution for the given number of milliseconds using `setTimeout`.
 * @param ms Delay duration in milliseconds.
 * @param signal Abort signal.
 * @returns Promise that resolves to `true` if completed successfully, and `false` if aborted.
 */
export const timeout = async (ms: number, signal: AbortSignal | null): Promise<boolean> => {
  let id = 0;

  const promise = withAbortable(
    signal,
    () =>
      new Promise<void>((resolve) => {
        // todo: stop node types interfering
        id = setTimeout(resolve, ms) as unknown as number;
      }),
    () => clearTimeout(id),
  );

  try {
    await promise;
    return true;
  } catch {
    return false;
  }
};
