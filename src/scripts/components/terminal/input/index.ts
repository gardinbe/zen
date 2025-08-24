import { type TerminalElements } from '../';
import { type Cursor, createCursor } from '../../cursor';
import {
  type TerminalInputSuggester,
  type TerminalInputSuggesterOptions,
  createTerminalInputSuggester,
} from './suggester';

export type TerminalInput = {
  /**
   * Cursor instance.
   */
  cursor: Cursor;

  /**
   * Suggester instance.
   */
  suggester: TerminalInputSuggester;

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
   * Invoked when the user cancels the input.
   *
   * I.e. whenever Ctrl+C is pressed.
   */
  onCancel: () => void;

  /**
   * Invoked when the user submits the input.
   * @param value Input value.
   */
  onSubmit: (value: string) => void;

  /**
   * Suggester options.
   */
  suggester: TerminalInputSuggesterOptions;
};

export const createTerminalInput = (
  els: TerminalElements,
  options: TerminalInputOptions,
): TerminalInput => {
  const set = (value: string) => {
    els.input.value = value;
    resize();
  };

  const clear = () => {
    set('');
  };

  const resize = () => {
    els.input.style.width = `${els.input.value.length}ch`;
  };

  const repositionCursor = () =>
    cursor.setPosition(els.input.value.length - (els.input.selectionEnd ?? 0));

  const listeners = {
    input: () => {
      suggester.reset();
      resize();
      cursor.freeze();
      requestAnimationFrame(cursor.blink);
    },

    keydown: async (ev: KeyboardEvent) => {
      if (ev.key === 'Delete') {
        requestAnimationFrame(repositionCursor);
        return;
      }

      if (ev.ctrlKey && ev.key === 'c') {
        const selection = getSelection();

        if (
          selection?.toString() &&
          (selection.anchorNode?.contains(els.input) || selection.focusNode?.contains(els.input))
        ) {
          return;
        }

        ev.preventDefault();
        clear();
        options.onCancel();
        return;
      }

      if (ev.key === 'Tab') {
        ev.preventDefault();
        const suggestion = suggester.get(els.input.value);

        if (!suggestion) {
          return;
        }

        set(suggestion);
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
      const value = els.input.value;
      clear();
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
  const suggester = createTerminalInputSuggester({
    getSuggestions: options.suggester.getSuggestions,
  });

  cursor.attach(els.input);
  cursor.hide();

  requestAnimationFrame(() => {
    els.input.focus();
  });
  resize();
  listen();

  return {
    cursor,
    suggester,
    set,
    clear,
    listen,
    ignore,
  };
};
