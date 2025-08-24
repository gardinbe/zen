import type { TerminalElements } from '.';

export type TerminalHistory = {
  /**
   * History items.
   */
  readonly items: string[];

  /**
   * Scrolls up in the history.
   */
  up: () => void;

  /**
   * Scrolls down in the history.
   */
  down: () => void;

  /**
   * Adds a command to the history.
   */
  add: (value: string) => void;

  /**
   * Clears the history.
   */
  clear: () => void;

  /**
   * Resets the history position.
   */
  reset: () => void;

  /**
   * Starts listening for events.
   */
  listen: () => void;

  /**
   * Stops listening for events.
   */
  ignore: () => void;
};

export type TerminalHistoryOptions = {
  setInput: (value: string) => void;
};

export const createTerminalHistory = (
  els: TerminalElements,
  options: TerminalHistoryOptions,
): TerminalHistory => {
  const items: string[] = [];
  let pos = -1;
  let lastValue = '';

  const up = () => {
    if (!~pos) {
      lastValue = els.input.value;
    }

    pos = Math.min(pos + 1, items.length - 1);
    const value = items[items.length - 1 - pos] ?? items[0] ?? '';
    options.setInput(value);
  };

  const down = () => {
    pos = Math.max(pos - 1, -1);
    const value = items[items.length - 1 - pos] ?? lastValue ?? '';
    options.setInput(value);
  };

  const add = (value: string) => {
    items.push(value);

    if (!~pos) {
      return;
    }

    pos++;
  };

  const clear = () => {
    items.length = 0;
    reset();
  };

  const reset = () => {
    pos = -1;
    lastValue = '';
  };

  const listeners = {
    keydown: (ev: KeyboardEvent) => {
      if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') {
        return;
      }

      ev.preventDefault();

      if (ev.key === 'ArrowUp') {
        up();
      } else {
        down();
      }
    },
  };

  const listen = () => {
    els.input.addEventListener('keydown', listeners.keydown);
    els.input.addEventListener('input', reset);
  };

  const ignore = () => {
    els.input.removeEventListener('keydown', listeners.keydown);
    els.input.removeEventListener('input', reset);
  };

  listen();

  return {
    items,
    up,
    down,
    add,
    clear,
    reset,
    listen,
    ignore,
  };
};
