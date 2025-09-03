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
  clear: () => Promise<void>;
};

/**
 * Creates a new terminal logger instance.
 * @param els Terminal elements.
 * @returns Terminal logger instance.
 */
export const createTerminalLogger = (els: TerminalElements): TerminalLogger => {
  const write = (text: string) => {
    let prevScrollTop = 0;
    let isRunning = true;

    const tick = () => {
      if (els.output.scrollTop + LoggerScrollRegion <= prevScrollTop) {
        requestAnimationFrame(tick);
        return;
      }

      els.output.scrollTop = els.output.scrollHeight;
      prevScrollTop = els.output.scrollTop;

      if (!isRunning) {
        cancelAnimationFrame(frameRequestId);
        return;
      }

      frameRequestId = requestAnimationFrame(tick);
    };

    let frameRequestId = requestAnimationFrame(tick);

    typer.type(text, {
      onStart: () => {
        typer.cursor.show();
      },
      onFinish: () => {
        typer.cursor.hide();
        isRunning = false;
      },
    });
  };

  // todo: if a user types or program errors with [[]] it fucks with this

  const stdin = (input: string) => write(`[[insert:\n> ${input}\n]]`);

  const stdout = (output: string, options?: Partial<LoggerWriteOptions>) =>
    write(options?.noNewlines ? output : `[[insert:\n]]${output}[[insert:\n]]`);

  const stderr = (error: unknown) =>
    // todo: use Error.isError when available
    write(`[[insert:ERROR: ${error instanceof Error ? error.message : error}\n]]`);

  const clear = () => typer.clear();

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

/**
 * Region in which the logger will scroll to the bottom.
 */
const LoggerScrollRegion = 5;
