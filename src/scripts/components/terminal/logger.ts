import { type TerminalElements } from '.';
import { type Typer, createTyper } from '../typer';

export type TerminalLogger = {
  /**
   * Typer instance.
   */
  typer: Typer;

  /**
   * Logs a standard input to the terminal.
   * @param input Input to log.
   */
  stdin: (input: string) => void;

  /**
   * Logs a standard output to the terminal.
   * @param output Output to log.
   */
  stdout: (output: string, options?: Partial<LoggerWriteOptions>) => void;

  /**
   * Logs a standard error to the terminal.
   * @param error Error to log.
   */
  stderr: (error: unknown) => void;

  /**
   * Clears the terminal output.
   */
  clear: () => void;
};

/**
 * Creates a new terminal logger instance.
 * @param els Terminal elements.
 * @returns Terminal logger instance.
 */
export const createTerminalLogger = (els: TerminalElements): TerminalLogger => {
  const write = (text: string) => {
    let prevScrollTop = 0;

    const tick = () => {
      if (els.outputContainer.scrollTop < prevScrollTop) {
        requestAnimationFrame(tick);
        return;
      }

      els.outputContainer.scrollTop = els.outputContainer.scrollHeight;
      prevScrollTop = els.outputContainer.scrollTop;
      frameRequestId = requestAnimationFrame(tick);
    };

    let frameRequestId = requestAnimationFrame(tick);

    typer.type(text, {
      onStart: () => {
        typer.cursor.show();
      },
      onFinish: () => {
        typer.cursor.hide();
        cancelAnimationFrame(frameRequestId);
      },
    });
  };

  const clear = () => {
    typer.clear();
  };

  // todo: if a user types or program errors with [[]] it fucks with this

  const stdin = (input: string) => write(`[[insert:> ${input}\n]]`);

  const stdout = (output: string, options?: Partial<LoggerWriteOptions>) =>
    write(options?.noNewlines ? output : `[[insert:\n]]${output}[[insert:\n\n]]`);

  const stderr = (error: unknown) =>
    // todo: use Error.isError when available
    write(`[[insert:ERROR: ${error instanceof Error ? error.message : error}\n]]`);

  const typer = createTyper({
    main: els.output,
  });

  return {
    typer,
    stdin,
    stdout,
    stderr,
    clear,
  };
};

export type LoggerWriteOptions = {
  /**
   * Whether to prevent adding newlines before/after the output.
   * @default false
   */
  noNewlines?: boolean;
};
