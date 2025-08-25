export type TerminalHistory = {
  /**
   * Returns the history entries.
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
};

export type TerminalHistoryOptions = {
  /**
   * Invoked to get the current value.
   * @returns Current value.
   */
  getValue: () => string;

  /**
   * Invoked when the history is navigated.
   * @param value Navigated value.
   */
  onNavigate: (value: string) => void;
};

export const createTerminalHistory = (options: TerminalHistoryOptions): TerminalHistory => {
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
      prevValue = options.getValue();
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

  const entries: string[] = [];
  let pos = -1;
  let prevValue = '';

  load();

  return {
    entries,
    up,
    down,
    add,
    clear,
    reset,
  };
};
