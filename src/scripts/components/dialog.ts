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

/**
 * Creates a dialog instance.
 * @param els Dialog elements.
 * @param options Dialog options.
 * @returns Dialog instance.
 */
export const createDialog = (els: DialogElements, options: DialogOptions): Dialog => {
  const open = () => {
    els.main.hidden = false;
  };

  const close = () => {
    els.main.hidden = true;
    options.onClose(isAlternate);
  };

  const useOriginal = () => {
    isAlternate = false;
    els.closeBtn.textContent = originalBtnText;
  };

  const useAlternate = () => {
    isAlternate = true;
    els.closeBtn.textContent = els.closeBtn.dataset.alt || originalBtnText;
  };

  const listeners = {
    touchstart: () => {
      isTouching = true;
      els.closeBtn.removeEventListener('touchstart', listeners.touchstart);
      els.closeBtn.addEventListener('touchend', listeners.touchend);
    },

    touchend: () => {
      isTouching = false;
      els.closeBtn.removeEventListener('touchend', listeners.touchstart);
      els.closeBtn.addEventListener('touchstart', listeners.touchend);
    },

    devicemotion: (ev: DeviceMotionEvent) => {
      if (!isTouching || !ev.acceleration?.x || Math.abs(ev.acceleration.x) <= 10) {
        return;
      }

      useAlternate();
    },

    keydown: (ev: KeyboardEvent) => {
      isCtrl = ev.ctrlKey;

      if (!isCtrl) {
        return;
      }

      useAlternate();
      removeEventListener('keydown', listeners.keydown);
      addEventListener('keyup', listeners.keyup);
    },

    keyup: () => {
      isCtrl = false;
      useOriginal();
      removeEventListener('keyup', listeners.keyup);
      addEventListener('keydown', listeners.keydown);
    },

    submit: (ev: SubmitEvent) => {
      ev.preventDefault();
      close();
    },
  };

  const listen = () => {
    els.closeBtn.addEventListener('touchstart', listeners.touchstart);
    addEventListener('devicemotion', listeners.devicemotion);
    addEventListener('keydown', listeners.keydown);
    els.main.addEventListener('submit', listeners.submit);
  };

  const ignore = () => {
    els.closeBtn.removeEventListener('touchstart', listeners.touchstart);
    els.closeBtn.removeEventListener('touchend', listeners.touchend);
    removeEventListener('devicemotion', listeners.devicemotion);
    removeEventListener('keydown', listeners.keydown);
    removeEventListener('keyup', listeners.keyup);
    els.main.removeEventListener('submit', listeners.submit);
  };

  const originalBtnText = els.closeBtn.textContent;
  let isAlternate = false;
  let isTouching = false;
  let isCtrl = false;
  listen();

  return {
    open,
    close,
    listen,
    ignore,
  };
};
