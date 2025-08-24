import { type TerminalElements } from '.';

export type TerminalHistory = {
  /**
   * History entries.
   */
  readonly entries: string[];

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
  /**
   * Invoked when the history is navigated.
   * @param value Navigated value.
   */
  onNavigate: (value: string) => void;
};

// todo: refactor input element logic out, and into input

export const createTerminalHistory = (
  els: TerminalElements,
  options: TerminalHistoryOptions,
): TerminalHistory => {
  const entries: string[] = [];
  let pos = -1;
  let prevValue = '';

  const save = () => {
    localStorage.setItem('terminal-history', JSON.stringify(entries));
  };

  const load = () => {
    const stored = localStorage.getItem('terminal-history');

    if (!stored) {
      return;
    }

    let parsed;

    try {
      parsed = JSON.parse(stored) as string[];
    } catch {
      return;
    }

    entries.push(...parsed);
  };

  const up = () => {
    if (!~pos) {
      prevValue = els.input.value;
    }

    pos = Math.min(pos + 1, entries.length - 1);
    const value = entries.at(-1 - pos) ?? entries.at(0) ?? '';
    options.onNavigate(value);
  };

  const down = () => {
    pos = Math.max(pos - 1, -1);
    const value = entries.at(-1 - pos) ?? prevValue ?? '';
    options.onNavigate(value);
  };

  const add = (value: string) => {
    if (entries.at(-1) === value) {
      return;
    }

    entries.push(value);
    save();

    if (!~pos) {
      return;
    }

    pos++;
  };

  const clear = () => {
    entries.length = 0;
    save();
    reset();
  };

  const reset = () => {
    pos = -1;
    prevValue = '';
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

  load();
  listen();

  return {
    entries,
    up,
    down,
    add,
    clear,
    reset,
    listen,
    ignore,
  };
};
