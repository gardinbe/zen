import { createCursor } from './cursor';

export type TerminalElements = {
  main: HTMLElement;
  output: HTMLElement;
  prompt: HTMLFormElement;
  prefix: HTMLElement;
  input: HTMLInputElement;
};

export const createTerminal = (els: TerminalElements) => {
  const cursor = createCursor();
  cursor.attach(els.input);
  cursor.hide();

  const logger = createLogger(els);

  const setValue = (value: string) => {
    els.input.value = value;
    resize();
  };

  const resize = () => {
    els.input.style.width = `${els.input.value.length}ch`;
  };

  const history = createHistory(els, setValue);

  els.input.addEventListener('focus', () => {
    cursor.show();
  });

  els.input.addEventListener('blur', () => {
    cursor.hide();
  });

  els.input.addEventListener('input', () => {
    resize();
    cursor.set('static');
    requestAnimationFrame(() => cursor.set('blink'));
  });

  els.main.addEventListener('click', () => {
    if (getSelection()?.toString()) {
      return;
    }

    els.input.focus();
  });

  requestAnimationFrame(() => {
    els.input.focus();
  });

  els.prompt.addEventListener('submit', (ev) => {
    ev.preventDefault();

    const command = els.input.value.trim();
    setValue('');

    if (!command) {
      return;
    }

    history.add(command);
    const log = parse(els, command);
    logger.write(log);
  });

  resize();
};

type History = {
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
  add: (command: string) => void;

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

const createHistory = (els: TerminalElements, setValue: (value: string) => void): History => {
  const items: string[] = [];
  let position = -1;
  let lastValue = '';

  const up = () => {
    if (!~position) {
      lastValue = els.input.value;
    }

    position = Math.min(position + 1, items.length - 1);
    const command = items[items.length - 1 - position] ?? items[0] ?? '';
    setValue(command);
  };

  const down = () => {
    position = Math.max(position - 1, -1);
    const command = items[items.length - 1 - position] ?? lastValue ?? '';
    setValue(command);
  };

  const add = (command: string) => {
    items.push(command);

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

  const keydown = (ev: KeyboardEvent) => {
    if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') {
      return;
    }

    ev.preventDefault();

    if (ev.key === 'ArrowUp') {
      up();
    } else {
      down();
    }
  };

  const listen = () => {
    els.input.addEventListener('keydown', keydown);
    els.input.addEventListener('input', reset);
  };

  const ignore = () => {
    els.input.removeEventListener('keydown', keydown);
    els.input.removeEventListener('input', reset);
  };

  listen();

  return {
    up,
    down,
    add,
    clear,
    reset,
    listen,
    ignore,
  };
};

const parse = (els: TerminalElements, command: string): Log => {
  switch (command) {
    case 'help': {
      return {
        stdout: 'Here are the available commands' + '\n- help',
      };
    }
    case 'clear':
    case 'cls': {
      els.output.innerHTML = '';
      return {};
    }
    default: {
      return {
        stderr: 'Command not found',
      };
    }
  }
};

type Log = {
  stdout?: string;
  stderr?: string;
};

const createLogger = (els: TerminalElements) => {
  const write = (log: Log) => {
    if (log.stdout) {
      els.output.innerHTML += (els.output.innerHTML ? '\n' : '') + log.stdout;
    }

    if (log.stderr) {
      els.output.innerHTML += (els.output.innerHTML ? '\n' : '') + 'ERROR: ' + log.stderr;
    }
  };

  return {
    write,
  };
};
