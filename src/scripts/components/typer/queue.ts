import { type Effect } from './effect';

export type TyperQueue = {
  /**
   * Returns the current queue abort signal.
   */
  readonly signal: AbortSignal;

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

export const createTyperQueue = (): TyperQueue => {
  let active: ReturnType<typeof exec> | null = null;
  let controller = new AbortController();
  const batches: EffectBatch[] = [];

  const push = (..._batches: EffectBatch[]) => {
    batches.push(..._batches);

    if (active) {
      return;
    }

    active = exec(controller.signal);
    active.then(() => {
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
    // todo: maybe this can be tidier

    let batch;

    while ((batch = batches.shift())) {
      if (signal.aborted) {
        batch.onAbort();
        batch.onFinish();
        break;
      }

      batch.onStart();

      let executor;

      while ((executor = batch.executors.shift())) {
        if (signal.aborted) {
          batch.onAbort();
          batch.onFinish();
          break;
        }

        await executor();
      }

      if (signal.aborted) {
        batch.onAbort();
        batch.onFinish();
        break;
      }

      batch.onComplete();
      batch.onFinish();
    }
  };

  return {
    get signal() {
      return controller.signal;
    },
    push,
    clear,
  };
};

export type EffectExecutor = () => ReturnType<Effect>;

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
