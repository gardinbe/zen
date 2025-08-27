import { type Effect } from './effects';

export type TyperQueue = {
  /**
   * Pushes batches to the queue.
   * @param batches Batches to push.
   */
  push: (...batches: EffectBatch[]) => void;

  /**
   * Clears the queue.
   */
  clear: () => Promise<void>;
};

/**
 * Creates a typer queue instance.
 * @returns Typer queue instance.
 */
export const createTyperQueue = (): TyperQueue => {
  const push = (...newBatches: EffectBatch[]) => {
    batches.push(...newBatches);

    if (isRunning) {
      return;
    }

    active = exec(controller.signal).finally(() => {
      active = null;
    });
  };

  const clear = async () => {
    controller.abort();
    controller = new AbortController();
    await active;
    batches.length = 0;
  };

  const exec = async (signal: AbortSignal) => {
    isRunning = true;

    const start = () => {
      batch!.onStart();
    };

    const complete = () => {
      batch!.onComplete();
      batch!.onFinish();
    };

    const abort = () => {
      batch!.onAbort();
      batch!.onFinish();
    };

    let batch: EffectBatch | undefined;

    while ((batch = batches.shift())) {
      if (signal.aborted) {
        abort();
        break;
      }

      start();

      let executor;

      while ((executor = batch.executors.shift())) {
        if (signal.aborted) {
          abort();
          break;
        }

        await executor(signal);
      }

      if (signal.aborted) {
        abort();
        break;
      }

      complete();
    }

    isRunning = false;
  };

  let isRunning = false;
  let active: ReturnType<typeof exec> | null = null;
  let controller = new AbortController();
  const batches: EffectBatch[] = [];

  return {
    push,
    clear,
  };
};

export type EffectExecutor = (signal: AbortSignal) => ReturnType<Effect>;

export type EffectBatchCallbacks = {
  /**
   * Invoked when the batch starts.
   */
  onStart: () => void;

  /**
   * Invoked **if** the batch completes successfully.
   *
   * This is not invoked if the batch is aborted.
   */
  onComplete: () => void;

  /**
   * Invoked **if** the batch is aborted.
   *
   * This is not invoked if the batch completes successfully.
   */
  onAbort: () => void;

  /**
   * Invoked when the batch is finished.
   *
   * This occurs after the batch has completed or aborted.
   */
  onFinish: () => void;
};

export type EffectBatch = EffectBatchCallbacks & {
  executors: EffectExecutor[];
};
