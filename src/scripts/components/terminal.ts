import { Aliases, Commands } from '../commands';
import { createCursor, type Cursor } from './cursor';

export type TerminalElements = {
  main: HTMLElement;
  output: HTMLElement;
  prompt: HTMLFormElement;
  prefix: HTMLElement;
  input: HTMLInputElement;
};

export type Terminal = {
  /**
   * Cursor instance.
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
  exec: ExecFunction;

  /**
   * Starts listening for events.
   */
  listen: () => void;

  /**
   * Stops listening for events.
   */
  ignore: () => void;
};

type ExecFunction = (value: string) => void | Promise<void>;

export const createTerminal = (els: TerminalElements): Terminal => {
  const setInput = (value: string) => {
    els.input.value = value;
    resizeInput();
  };

  const cursor = createCursor();
  const logger = createLogger(els);
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

    const [name, ...args] = value.trim().split(' ');

    if (!name) {
      return;
    }

    logger.write({
      stdin: value,
    });

    const command = parse(name);

    if (!command) {
      logger.write({
        stderr: `Unknown command: ${name}`,
      });
      return;
    }

    const ctx: CommandContext = {
      cursor,
      logger,
      history,
    };

    return command.fn(ctx, args);
  };

  const repositionCursor = () =>
    cursor.setPosition(els.input.value.length - (els.input.selectionEnd ?? 0));

  const listeners = {
    input: () => {
      resizeInput();
      cursor.setState('static');
      requestAnimationFrame(() => cursor.setState('blink'));
    },

    keydown: (ev: KeyboardEvent) => {
      if (ev.key === 'Delete') {
        requestAnimationFrame(repositionCursor);
        return;
      }

      if (ev.ctrlKey && ev.key === 'c') {
        ev.preventDefault();
        logger.write({
          stdout: els.input.value + '^C',
        });
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
      repositionCursor();
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
   * Cursor instance.
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
}>;

export type Command = {
  name: string;
  description: string;
  fn: (ctx: CommandContext, args: string[]) => void | Promise<void>;
};

const parse = (value: string): Command | null =>
  Object.entries(Aliases).find(
    ([name]) => name.toLocaleUpperCase() === value.toLocaleUpperCase(),
  )?.[1] ??
  Object.values(Commands).find(
    (command) => command.name.toLocaleUpperCase() === value.toLocaleUpperCase(),
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
  let position = -1;
  let lastValue = '';

  const up = () => {
    if (!~position) {
      lastValue = els.input.value;
    }

    position = Math.min(position + 1, items.length - 1);
    const value = items[items.length - 1 - position] ?? items[0] ?? '';
    setInput(value);
  };

  const down = () => {
    position = Math.max(position - 1, -1);
    const value = items[items.length - 1 - position] ?? lastValue ?? '';
    setInput(value);
  };

  const add = (value: string) => {
    items.push(value);

    if (!~position) {
      return;
    }

    position++;
  };

  const clear = () => {
    items.length = 0;
    reset();
  };

  const reset = () => {
    position = -1;
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

type Log = {
  stdin?: string;
  stdout?: string;
  stderr?: string;
};

type Logger = {
  /**
   * Writes a log to the terminal output.
   * @param log Log.
   */
  write: (log: Log) => void;

  /**
   * Clears the terminal output.
   */
  clear: () => void;
};

const createLogger = (els: TerminalElements): Logger => {
  const write = (log: Log) => {
    let msg = '';

    if (log.stdin) {
      msg += `$: ${log.stdin}\n`;
    }

    if (log.stdout) {
      msg += `${log.stdout}\n`;
    }

    if (log.stderr) {
      msg += `ERROR: ${log.stderr}\n`;
    }

    els.output.innerHTML += msg;

    requestAnimationFrame(() =>
      els.main.scrollTo({
        top: els.main.scrollHeight,
      }),
    );
  };

  const clear = () => {
    els.output.innerHTML = '';
  };

  return {
    write,
    clear,
  };
};
