export type TerminalSuggester = {
  /**
   * Returns the next suggestion.
   * @returns Next suggestion, or `null` if none available.
   */
  next: () => string | null;

  /**
   * Returns the previous suggestion.
   * @returns Previous suggestion, or `null` if none available.
   */
  prev: () => string | null;

  /**
   * Sets the current suggestions for the given value.
   * @param value Value.
   */
  set: (value: string) => void;
};

export type TerminalSuggesterOptions = {
  /**
   * Invoked to get suggestions for the given value.
   * @param value Value.
   * @returns Suggestions.
   */
  getSuggestions: (value: string) => string[];
};

/**
 * Creates a terminal suggester instance.
 * @param options Suggester options.
 * @returns Terminal suggester instance.
 */
export const createTerminalSuggester = (options: TerminalSuggesterOptions): TerminalSuggester => {
  const navigate = (delta: number) => {
    if (!suggestions.length) {
      return null;
    }

    pos = (pos + delta + suggestions.length) % suggestions.length;
    const suggestion = suggestions.at(pos)!;
    return suggestion;
  };

  const next = () => navigate(1);

  const prev = () => navigate(-1);

  const set = (value: string) => {
    suggestions = options.getSuggestions(value);
    pos = -1;
  };

  let suggestions: string[] = [];
  let pos = -1;

  return {
    next,
    prev,
    set,
  };
};
