import { Aliases, Commands } from '../commands';
import { createCursor, type Cursor } from './cursor';
import { createTyper, type Typer } from './typer';

export type TerminalElements = {
  main: HTMLElement;
  output: HTMLElement;
  prompt: HTMLFormElement;
  prefix: HTMLElement;
  input: HTMLInputElement;
};

export type Terminal = {
  /**
   * Output typer instance.
   */
  typer: Typer;

  /**
   * Cursor instance for the user input.
   */
  cursor: Cursor;

  /**
   * Logger instance.
   */
  logger: Logger;

  /**
   * History instance.
   */
  history: History;

  /**
   * Executes the current input value.
   */
  send: () => void;

  /**
   * Executes a command.
   * @param value Command to execute.
   */
  exec: (value: string) => void | Promise<void>;

  /**
   * Starts listening for events.
   */
  listen: () => void;

  /**
   * Stops listening for events.
   */
  ignore: () => void;
};

export const createTerminal = (els: TerminalElements): Terminal => {
  const setInput = (value: string) => {
    els.input.value = value;
    resizeInput();
  };

  const typer = createTyper({
    main: els.output,
  });
  const cursor = createCursor();
  const logger = createLogger(els, typer);
  const history = createHistory(els, setInput);

  const resizeInput = () => {
    els.input.style.width = `${els.input.value.length}ch`;
  };

  const send = () => {
    const value = els.input.value;
    setInput('');
    return exec(value);
  };

  const exec = (value: string) => {
    if (!value) {
      return;
    }

    history.add(value);
    logger.stdin(value);

    if (!value) {
      return;
    }

    const parsed = parse(value);

    if (!parsed) {
      logger.stderr(`Error parsing command: ${value}`);
      return;
    }

    const command = getCommand(parsed.name);

    if (!command) {
      logger.stderr(`Unknown command: ${parsed.name}`);
      return;
    }

    const ctx: CommandContext = {
      logger,
      history,
    };

    return command.fn(ctx, parsed.args);
  };

  const repositionCursor = () =>
    cursor.setPosition(els.input.value.length - (els.input.selectionEnd ?? 0));

  const listeners = {
    input: () => {
      resizeInput();
      cursor.freeze();
      requestAnimationFrame(cursor.blink);
    },

    keydown: (ev: KeyboardEvent) => {
      if (ev.key === 'Delete') {
        requestAnimationFrame(repositionCursor);
        return;
      }

      if (ev.ctrlKey && ev.key === 'c') {
        ev.preventDefault();
        logger.stdout(`${els.input.value}^C`);
        setInput('');
        return;
      }
    },

    selectionchange: () => {
      if (getSelection()?.toString()) {
        return;
      }

      repositionCursor();
    },

    click: () => {
      if (getSelection()?.toString()) {
        return;
      }

      els.input.focus();
    },

    submit: async (ev: SubmitEvent) => {
      ev.preventDefault();
      requestAnimationFrame(repositionCursor);
      history.reset();
      await send();
    },
  };

  const listen = () => {
    els.input.addEventListener('focus', cursor.show);
    els.input.addEventListener('blur', cursor.hide);
    els.input.addEventListener('input', listeners.input);
    els.input.addEventListener('keydown', listeners.keydown);
    els.input.addEventListener('selectionchange', listeners.selectionchange);
    els.main.addEventListener('click', listeners.click);
    els.prompt.addEventListener('submit', listeners.submit);
  };

  const ignore = () => {
    els.input.removeEventListener('focus', cursor.show);
    els.input.removeEventListener('blur', cursor.hide);
    els.input.removeEventListener('input', listeners.input);
    els.input.removeEventListener('selectionchange', listeners.selectionchange);
    els.main.removeEventListener('click', listeners.click);
    els.prompt.removeEventListener('submit', listeners.submit);
  };

  cursor.attach(els.input);
  cursor.hide();
  requestAnimationFrame(() => els.input.focus());
  resizeInput();
  listen();

  return {
    typer,
    cursor,
    logger,
    history,
    send,
    exec,
    listen,
    ignore,
  };
};

export type CommandContext = Readonly<{
  /**
   * Logger instance.
   */
  logger: Logger;

  /**
   * History instance.
   */
  history: History;
}>;

export type Command = {
  name: string;
  description: string;
  fn: (ctx: CommandContext, args: string[]) => void | Promise<void>;
};

const ExpressionRegex = /(\S+)(?:\s+(.*))?/s;
const TokenRegex = /"([^"]+)"|'([^']+)'|`([^`]+)`|(\S+)/gs;

type ParsedInput = {
  name: string;
  args: string[];
};

const parse = (str: string): ParsedInput | null => {
  const match = str.match(ExpressionRegex);
  const [, name, argsStr] = match || [];

  if (!name) {
    return null;
  }

  const args = argsStr
    ? [...argsStr.matchAll(TokenRegex)].map((m) => (m[1] || m[2] || m[3] || m[4]) as string)
    : [];

  return {
    name,
    args,
  };
};

const getCommand = (name: string): Command | null =>
  Object.entries(Aliases).find(([n]) => n.toLocaleUpperCase() === name.toLocaleUpperCase())?.[1] ??
  Object.values(Commands).find(
    (command) => command.name.toLocaleUpperCase() === name.toLocaleUpperCase(),
  ) ??
  null;

type History = {
  /**
   * History items.
   */
  readonly items: string[];

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

  /**
   * Starts listening for events.
   */
  listen: () => void;

  /**
   * Stops listening for events.
   */
  ignore: () => void;
};

const createHistory = (els: TerminalElements, setInput: (value: string) => void): History => {
  const items: string[] = [];
  let pos = -1;
  let lastValue = '';

  const up = () => {
    if (!~pos) {
      lastValue = els.input.value;
    }

    pos = Math.min(pos + 1, items.length - 1);
    const value = items[items.length - 1 - pos] ?? items[0] ?? '';
    setInput(value);
  };

  const down = () => {
    pos = Math.max(pos - 1, -1);
    const value = items[items.length - 1 - pos] ?? lastValue ?? '';
    setInput(value);
  };

  const add = (value: string) => {
    items.push(value);

    if (!~pos) {
      return;
    }

    pos++;
  };

  const clear = () => {
    items.length = 0;
    reset();
  };

  const reset = () => {
    pos = -1;
    lastValue = '';
  };

  const listeners = {
    keydown: (ev: KeyboardEvent) => {
      if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') {
        return;
      }

      ev.preventDefault();

      if (ev.key === 'ArrowUp') {
        up();
      } else {
        down();
      }
    },
  };

  const listen = () => {
    els.input.addEventListener('keydown', listeners.keydown);
    els.input.addEventListener('input', reset);
  };

  const ignore = () => {
    els.input.removeEventListener('keydown', listeners.keydown);
    els.input.removeEventListener('input', reset);
  };

  listen();

  return {
    items,
    up,
    down,
    add,
    clear,
    reset,
    listen,
    ignore,
  };
};

type Logger = {
  /**
   * Logs a standard input to the terminal.
   * @param input Input to log.
   */
  stdin: (input: string) => void;

  /**
   * Logs a standard output to the terminal.
   * @param output Output to log.
   */
  stdout: (output: string) => void;

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

const createLogger = (els: TerminalElements, typer: Typer): Logger => {
  const write = (text: string) => {
    let finished = false;
    let lastScrollPos = els.main.scrollTop;
    let scrolled = false;

    const onscroll = () => {
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

      if (els.main.scrollTop <= lastScrollPos) {
        requestAnimationFrame(check);
        return;
      }

      els.main.scrollTo({
        top: els.main.scrollHeight,
      });

      lastScrollPos = els.main.scrollTop;
      requestAnimationFrame(check);
    };

    requestAnimationFrame(check);
    typer.cursor.show();
    // todo: async here
    typer.type(`${text}\n`);
    typer.cursor.hide();
    finished = true;

    els.main.removeEventListener('scroll', onscroll);
  };

  const stdin = (input: string) => write(`> ${input}`);
  const stdout = (output: string) => write(output);
  const stderr = (error: unknown) =>
    write(`ERROR: ${error instanceof Error ? error.message : error}`);

  const clear = typer.clear;

  return {
    stdin,
    stdout,
    stderr,
    clear,
  };
};
