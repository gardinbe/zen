import { type TerminalElements } from '.';
import { type Cursor, createCursor } from '../cursor';

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
   * Invoked whenever the input value changes.
   * @param value Input value.
   */
  onInput: (value: string) => void;

  /**
   * Invoked when the user submits the input.
   * @param value Input value.
   */
  onSubmit: (value: string) => void;

  /**
   * Invoked when the user cancels the input.
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
};

/**
 * Creates a terminal input instance.
 * @param els Terminal elements.
 * @param options Input options.
 * @returns Terminal input instance.
 */
export const createTerminalInput = (
  els: TerminalElements,
  options: TerminalInputOptions,
): TerminalInput => {
  const get = () => els.input.value;

  const set = (value: string) => {
    els.input.value = value;
    resize();
  };

  const clear = () => {
    set('');
  };

  const resize = () => {
    els.input.style.width = `${get().length}ch`;
  };

  const repositionCursor = () => cursor.setPosition(get().length - (els.input.selectionEnd ?? 0));

  const listeners = {
    input: () => {
      resize();
      cursor.freeze();
      requestAnimationFrame(cursor.blink);
      options.onInput(get());
    },

    keydown: (ev: KeyboardEvent) => {
      switch (ev.key) {
        case 'Tab': {
          ev.preventDefault();

          if (ev.shiftKey) {
            options.onShiftTab();
          } else {
            options.onTab();
          }

          return;
        }

        case 'ArrowUp': {
          ev.preventDefault();
          options.onUp();
          return;
        }

        case 'ArrowDown': {
          ev.preventDefault();
          options.onDown();
          return;
        }

        case 'c': {
          if (!ev.ctrlKey) {
            return;
          }

          const selection = getSelection();

          if (
            selection?.toString() &&
            (selection.anchorNode?.contains(els.input) || selection.focusNode?.contains(els.input))
          ) {
            return;
          }

          ev.preventDefault();
          const value = get();
          clear();
          options.onCancel(value);
          return;
        }

        case 'Delete': {
          requestAnimationFrame(repositionCursor);
          return;
        }
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

    submit: (ev: SubmitEvent) => {
      ev.preventDefault();
      const value = get();
      clear();
      repositionCursor();
      options.onSubmit(value);
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

  const cursor = createCursor();

  cursor.attach(els.input);
  cursor.hide();

  requestAnimationFrame(() => {
    els.input.focus();
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
