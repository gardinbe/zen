export type TerminalProgramController = {
  /**
   * Returns the current controller abort signal.
   */
  readonly signal: AbortSignal | null;

  /**
   * Initializes a new program.
   *
   * Sets a new AbortController into state and returns the signal.
   */
  init: () => AbortSignal;

  /**
   * Terminates the current program.
   *
   * Aborts the current AbortController.
   */
  terminate: () => Promise<void>;
};

export type TerminalProgramControllerOptions = {
  /**
   * Invoked when the program is terminated.
   */
  onTerminate: () => void | Promise<void>;
};

export const createTerminalProgramController = (
  options: TerminalProgramControllerOptions,
): TerminalProgramController => {
  let controller = new AbortController();

  const init = () => {
    controller = new AbortController();
    return controller.signal;
  };

  const terminate = async () => {
    controller?.abort();
    await options.onTerminate();
  };

  return {
    get signal() {
      return controller?.signal ?? null;
    },
    init,
    terminate,
  };
};
