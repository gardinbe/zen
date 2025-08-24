export type TerminalInputSuggester = {
  /**
   * Returns the next suggestion for the input value.
   * @param value Input value.
   * @returns Suggested value, or `null` if no suggestion is available.
   */
  get: (value: string) => string | null;

  /**
   * Resets the suggestions.
   */
  reset: () => void;
};

export type TerminalInputSuggesterOptions = {
  /**
   * Invoked to get suggestions for the input value.
   * @param value Input value.
   * @returns Suggested values.
   */
  getSuggestions: (value: string) => string[];
};

export const createTerminalInputSuggester = (
  options: TerminalInputSuggesterOptions,
): TerminalInputSuggester => {
  const get = (value: string) => {
    current ||= value;
    suggestions ||= options.getSuggestions(value);

    if (!suggestions.length) {
      return null;
    }

    index = (index + 1) % suggestions.length;
    const suggestion = suggestions[index]!;

    return suggestion;
  };

  const reset = () => {
    current = null;
    suggestions = null;
    index = -1;
  };

  let current: string | null = null;
  let suggestions: string[] | null = null;
  let index = -1;

  return {
    get,
    reset,
  };
};
