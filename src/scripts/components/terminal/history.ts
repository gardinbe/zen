import { clamp } from '../../utils/clamp';

export type TerminalHistory = {
  /**
   * Returns the history entries.
   */
  entries: string[];

  /**
   * Navigates to the next history entry.
   * @returns Next history entry.
   */
  next: () => string;

  /**
   * Navigates to the previous history entry.
   * @returns Previous history entry.
   */
  prev: () => string;

  /**
   * Resets the history position.
   */
  reset: () => void;

  /**
   * Adds an entry to the history.
   * @param entry Entry.
   */
  add: (entry: string) => void;

  /**
   * Clears the history.
   */
  clear: () => void;
};

export type TerminalHistoryOptions = {
  /**
   * Invoked to get the current value.
   * @returns Current value.
   */
  getValue: () => string;
};

/**
 * Creates a terminal history instance.
 * @param options History options.
 * @returns Terminal history instance.
 */
export const createTerminalHistory = (options: TerminalHistoryOptions): TerminalHistory => {
  const save = () => {
    localStorage.setItem(LocalStorageKey, JSON.stringify(entries));
  };

  const load = () => {
    const stored = localStorage.getItem(LocalStorageKey);

    if (!stored) {
      return;
    }

    let parsed;

    try {
      parsed = JSON.parse(stored) as string[];
    } catch {
      return;
    }

    entries.length = 0;
    entries.push(...parsed);
  };

  const navigate = (delta: number) => {
    storedValue ??= options.getValue();
    pos = clamp(pos + delta, -1, entries.length - 1);
    const value = ~pos ? entries.at(-1 - pos)! : storedValue;
    return value;
  };

  const next = () => navigate(-1);

  const prev = () => navigate(1);

  const reset = () => {
    pos = -1;
    storedValue = null;
  };

  const add = (entry: string) => {
    if (entries.at(-1) === entry) {
      return;
    }

    entries.push(entry);
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

  const entries: string[] = [];
  let pos = -1;
  let storedValue: string | null = null;

  load();

  return {
    entries,
    next,
    prev,
    reset,
    add,
    clear,
  };
};

const LocalStorageKey = 'terminal-history';
