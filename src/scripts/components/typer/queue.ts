import { type EffectFunction } from './effect';

export type TyperQueue = {
  /**
   * Current queue abort signal.
   */
  signal: AbortSignal;

  /**
   * Pushes items to the queue.
   * @param runners Items to push.
   */
  push: (...batches: EffectBatch[]) => void;

  /**
   * Clears the queue.
   */
  clear: () => Promise<void>;
};

export const createTyperQueue = (): TyperQueue => {
  let active: ReturnType<typeof run> | null = null;
  let controller = new AbortController();
  const batches: EffectBatch[] = [];

  const push = (..._batches: EffectBatch[]) => {
    batches.push(..._batches);

    if (active) {
      return;
    }

    active = run(controller.signal);
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

  const run = async (signal: AbortSignal) => {
    // todo: maybe this can be tidier

    let batch;

    while ((batch = batches.shift())) {
      if (signal.aborted) {
        batch.callbacks.onAbort();
        batch.callbacks.onEnd();
        break;
      }

      batch.callbacks.onStart();

      let runner;

      while ((runner = batch.runners.shift())) {
        if (signal.aborted) {
          batch.callbacks.onAbort();
          batch.callbacks.onEnd();
          break;
        }

        await runner();
      }

      if (signal.aborted) {
        batch.callbacks.onAbort();
        batch.callbacks.onEnd();
        break;
      }

      batch.callbacks.onComplete();
      batch.callbacks.onEnd();
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

export type EffectRunner = () => ReturnType<EffectFunction>;

export type EffectBatchCallbacks = {
  onStart: () => void;
  onComplete: () => void;
  onAbort: () => void;
  onEnd: () => void;
};

export type EffectBatch = {
  runners: EffectRunner[];
  callbacks: EffectBatchCallbacks;
};
