export type DialogElements = {
  main: HTMLFormElement;
  closeBtn: HTMLElement;
};

export type Dialog = {
  /**
   * Opens the dialog.
   */
  open: () => void;

  /**
   * Closes the dialog.
   */
  close: () => void;

  /**
   * Starts listening for events.
   */
  listen: () => void;

  /**
   * Stops listening for events.
   */
  ignore: () => void;
};

export type DialogOptions = {
  onClose: (alt: boolean) => void;
};

export const createDialog = (els: DialogElements, options: DialogOptions): Dialog => {
  const open = () => {
    els.main.hidden = false;
  };

  const close = (alt = false) => {
    els.main.hidden = true;
    options.onClose(alt);
  };

  const listeners = {
    keydown: (ev: KeyboardEvent) => {
      ctrl = ev.ctrlKey;
      els.closeBtn.textContent = (ctrl && els.closeBtn.dataset.alt) || originalBtnText;
      removeEventListener('keydown', listeners.keydown);
      addEventListener('keyup', listeners.keyup);
    },

    keyup: () => {
      ctrl = false;
      els.closeBtn.textContent = originalBtnText;
      removeEventListener('keyup', listeners.keyup);
      addEventListener('keydown', listeners.keydown);
    },

    submit: (ev: SubmitEvent) => {
      ev.preventDefault();
      close(ctrl);
    },
  };

  const listen = () => {
    addEventListener('keydown', listeners.keydown);
    els.main.addEventListener('submit', listeners.submit);
  };

  const ignore = () => {
    removeEventListener('keydown', listeners.keydown);
    removeEventListener('keyup', listeners.keyup);
    els.main.removeEventListener('submit', listeners.submit);
  };

  const originalBtnText = els.closeBtn.textContent;
  let ctrl = false;

  requestAnimationFrame(() => {
    els.closeBtn.focus();
  });
  listen();

  return {
    open,
    close,
    listen,
    ignore,
  };
};
