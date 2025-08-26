export type TerminalInputSuggester = {
  /**
   * Returns the next suggestion for the given value.
   * @param value Value.
   * @returns Suggested value, or `null` if no suggestion is available.
   */
  suggest: (value: string) => string | null;

  /**
   * Clears the suggestions.
   */
  clear: () => void;
};

export type TerminalInputSuggesterOptions = {
  /**
   * Invoked to get suggestions for the given value.
   * @param value Value.
   * @returns Suggested values.
   */
  getSuggestions: (value: string) => string[];
};

/**
 * Creates a terminal input suggester instance.
 * @param options Suggester options.
 * @returns Terminal input suggester instance.
 */
export const createTerminalInputSuggester = (
  options: TerminalInputSuggesterOptions,
): TerminalInputSuggester => {
  const suggest = (value: string) => {
    current ??= value;
    suggestions ??= options.getSuggestions(value);

    if (!suggestions.length) {
      return null;
    }

    index = (index + 1) % suggestions.length;
    const suggestion = suggestions.at(index)!;
    return suggestion;
  };

  const clear = () => {
    current = null;
    suggestions = null;
    index = -1;
  };

  let current: string | null = null;
  let suggestions: string[] | null = null;
  let index = -1;

  return {
    suggest,
    clear,
  };
};
