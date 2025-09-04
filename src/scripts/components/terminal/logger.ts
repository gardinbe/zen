import { type TerminalElements } from '.';
import { type Enum } from '../../utils/enum';
import { isTruthy } from '../../utils/predicates';
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
  stdout: (output: string, options?: Partial<LogOptions>) => void;

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
  const createLogHtml = (html: string) => `<div class='zen-terminal-log'>${html}</div>`;

  const write = (html: string, options?: Partial<LogOptions>) => {
    const classes = [
      options?.collapse && 'zen-terminal-log-unformatted',
      options?.printout && 'zen-terminal-log-printout',
    ].filter(isTruthy);

    const containedHtml = classes.length ? `<div class='${classes.join(' ')}'>${html}</div>` : html;
    const logHtml = createLogHtml(containedHtml);

    if (options?.printout) {
      typer.insert(createLogHtml('\n'));
    }

    if (options?.method === LogMethod.Insert) {
      typer.insert(logHtml);
      return;
    }

    typer.type(logHtml, {
      onStart: () => {
        typer.cursor.show();
      },
      onFinish: () => {
        typer.cursor.hide();
      },
    });
  };

  const stdin = (input: string) =>
    // todo: dodgy
    write(`${els.output.innerHTML ? '\n' : ''}> ${input}`, {
      method: LogMethod.Insert,
    });

  const stdout = (output: string, options?: Partial<LogOptions>) => write(output, options);

  const stderr = (error: unknown) =>
    // todo: use Error.isError when available
    write(`ERROR: ${error instanceof Error ? error.message : error}`, {
      method: LogMethod.Insert,
    });

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

export type LogMethod = Enum<typeof LogMethod>;
export const LogMethod = {
  Type: 0,
  Insert: 1,
} as const;

export type LogOptions = {
  /**
   * Output method.
   * @default LogMethod.Type
   */
  method: LogMethod;

  /**
   * Whether whitespace should be collapsed.
   * @default false
   */
  collapse: boolean;

  /**
   * Whether the output should be wrapped in a printout container.
   * @default false
   */
  printout: boolean;
};
