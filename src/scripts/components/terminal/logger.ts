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

export const createTerminalLogger = (els: TerminalElements): TerminalLogger => {
  const write = async (text: string) => {
    let finished = false;
    let prevScrollPos = els.main.scrollTop;
    let manuallyScrolled = false;
    let scrolled = false;

    // todo: this scroll shit doesn't work

    const onscroll = () => {
      if (manuallyScrolled) {
        manuallyScrolled = false;
        return;
      }

      scrolled = true;
    };

    els.output.addEventListener('scroll', onscroll, {
      passive: true,
      once: true,
    });

    const check = () => {
      if (finished || scrolled) {
        return;
      }

      if (els.main.scrollTop <= prevScrollPos) {
        requestAnimationFrame(check);
        return;
      }

      manuallyScrolled = true;
      els.main.scrollTop = els.main.scrollHeight;
      prevScrollPos = els.main.scrollTop;
      requestAnimationFrame(check);
    };

    requestAnimationFrame(check);

    typer.type(text, {
      onStart: () => {
        typer.cursor.show();
      },
      onFinish: () => {
        typer.cursor.hide();
        els.main.removeEventListener('scroll', onscroll);
        finished = true;
      },
    });
  };

  const clear = () => {
    typer.clear();
  };

  const stdin = (input: string) => write(`[[insert:> ${input}\n]]`);
  const stdout = (output: string, options?: Partial<LoggerWriteOptions>) =>
    write(options?.noNewlines ? output : `[[insert:\n]]${output}[[insert:\n\n]]`);
  const stderr = (error: unknown) =>
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

// todo: unsure if this is the best approach

export type LoggerWriteOptions = {
  /**
   * Whether to prevent adding a newlines before/after the output.
   * @default false
   */
  noNewlines?: boolean;
};
