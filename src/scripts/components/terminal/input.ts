import { type TerminalElements } from '.';
import { type Cursor, createCursor } from '../cursor';
import { TerminalSpawnDirection } from './manager';

export type TerminalInput = {
  /**
   * Cursor instance.
   */
  cursor: Cursor;

  /**
   * Returns the input value.
   */
  readonly value: string;

  /**
   * Sets the input value.
   */
  set: (value: string) => void;

  /**
   * Clears the input value.
   */
  clear: () => void;

  /**
   * Starts listening for events.
   */
  listen: () => void;

  /**
   * Stops listening for events.
   */
  ignore: () => void;
};

export type TerminalInputOptions = {
  /**
   * Invoked when the user inputs a value.
   * @param value Input value.
   */
  onInput: (value: string) => void;

  /**
   * Invoked when the user presses the submit key bind.
   * @param value Input value.
   */
  onSubmit: (value: string) => void;

  /**
   * Invoked when the user presses the cancel key bind.
   *
   * I.e. whenever Ctrl+C is pressed.
   * @param value Input value.
   */
  onCancel: (value: string) => void;

  /**
   * Invoked when the user presses the up arrow key.
   */
  onUp: () => void;

  /**
   * Invoked when the user presses the down arrow key.
   */
  onDown: () => void;

  /**
   * Invoked when the user presses the tab key.
   */
  onTab: () => void;

  /**
   * Invoked when the user presses the shift and tab keys simultaneously.
   */
  onShiftTab: () => void;

  /**
   * Invoked when the user presses the terminal spawn key bind.
   * @param direction Spawn direction.
   */
  onSpawn: (direction: TerminalSpawnDirection) => void;
};

/**
 * Creates a terminal input instance.
 * @param elements Terminal elements.
 * @param options Input options.
 * @returns Terminal input instance.
 */
export const createTerminalInput = (
  elements: TerminalElements,
  options: TerminalInputOptions,
): TerminalInput => {
  const get = () => elements.input.value;

  const set = (value: string) => {
    elements.input.value = value;
    resize();
  };

  const clear = () => {
    set('');
  };

  const resize = () => {
    elements.input.style.width = `${get().length}ch`;
  };

  const repositionCursor = () =>
    cursor.setPosition(get().length - (elements.input.selectionEnd ?? 0));

  const listeners = {
    input: () => {
      resize();
      cursor.freeze();
      requestAnimationFrame(cursor.blink);
      options.onInput(get());
    },

    keydown: (ev: KeyboardEvent) => {
      if (ev.key === 'Delete') {
        requestAnimationFrame(repositionCursor);
        return;
      }

      if (ev.ctrlKey && ev.key === 'c') {
        const selection = getSelection();

        if (
          selection?.toString() &&
          (selection.anchorNode?.contains(elements.input) ||
            selection.focusNode?.contains(elements.input))
        ) {
          return;
        }

        ev.preventDefault();
        const value = get();
        clear();
        options.onCancel(value);
        return;
      }

      if (ev.key === 'Tab') {
        ev.preventDefault();

        if (ev.shiftKey) {
          options.onShiftTab();
        } else {
          options.onTab();
        }

        return;
      }

      if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        options.onUp();
        return;
      }

      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        options.onDown();
        return;
      }

      if (ev.ctrlKey && ev.altKey) {
        ev.preventDefault();

        let direction: TerminalSpawnDirection;

        if (ev.key === 'ArrowRight' || ev.key === 'd') {
          direction = TerminalSpawnDirection.East;
        } else if (ev.key === 'ArrowLeft' || ev.key === 'a') {
          direction = TerminalSpawnDirection.West;
        } else if (ev.key === 'ArrowUp' || ev.key === 'w') {
          direction = TerminalSpawnDirection.North;
        } else if (ev.key === 'ArrowDown' || ev.key === 's') {
          direction = TerminalSpawnDirection.South;
        } else {
          return;
        }

        options.onSpawn(direction);
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

      elements.input.focus();
    },

    submit: (ev: SubmitEvent) => {
      ev.preventDefault();
      const value = get();
      clear();
      repositionCursor();
      options.onSubmit(value);
    },
  };

  const listen = () => {
    elements.input.addEventListener('focus', cursor.show);
    elements.input.addEventListener('blur', cursor.hide);
    elements.input.addEventListener('input', listeners.input);
    elements.input.addEventListener('keydown', listeners.keydown);
    elements.input.addEventListener('selectionchange', listeners.selectionchange);
    elements.main.addEventListener('click', listeners.click);
    elements.prompt.addEventListener('submit', listeners.submit);
  };

  const ignore = () => {
    elements.input.removeEventListener('focus', cursor.show);
    elements.input.removeEventListener('blur', cursor.hide);
    elements.input.removeEventListener('input', listeners.input);
    elements.input.removeEventListener('selectionchange', listeners.selectionchange);
    elements.main.removeEventListener('click', listeners.click);
    elements.prompt.removeEventListener('submit', listeners.submit);
  };

  const cursor = createCursor();

  cursor.attach(elements.input);
  cursor.hide();

  requestAnimationFrame(() => {
    elements.input.focus();
  });
  resize();
  listen();

  return {
    cursor,
    get value() {
      return get();
    },
    set,
    clear,
    listen,
    ignore,
  };
};
