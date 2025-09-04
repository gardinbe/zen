export type DialogElements = {
  main: HTMLFormElement;
  inner: HTMLElement;
  heading: HTMLElement;
  actions: HTMLElement;
  closeBtn: HTMLButtonElement;
};

export const createDialogElements = (): DialogElements => {
  const main = document.createElement('form');
  const inner = document.createElement('div');
  const heading = document.createElement('div');
  const actions = document.createElement('div');
  const closeBtn = document.createElement('button');

  actions.append(closeBtn);
  inner.append(heading, actions);
  main.append(inner);

  return {
    main,
    inner,
    heading,
    actions,
    closeBtn,
  };
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
  /**
   * Invoked when the dialog is closed.
   */
  onClose: (alt: boolean) => void;
};

/**
 * Creates a dialog instance.
 * @param els Dialog elements.
 * @param options Dialog options.
 * @returns Dialog instance.
 */
export const createDialog = (elements: DialogElements, options: DialogOptions): Dialog => {
  const init = () => {
    elements.main.classList.add('zen-dialog');
    elements.inner.classList.add('zen-dialog-inner');
    elements.heading.classList.add('zen-dialog-heading');
    elements.actions.classList.add('zen-dialog-actions');
    elements.closeBtn.classList.add('zen-dialog-btn', 'u-zen-btn');
    elements.closeBtn.type = 'submit';
  };

  const open = () => {
    elements.main.hidden = false;
  };

  const close = () => {
    elements.main.hidden = true;
    options.onClose(isAlternate);
  };

  const useOriginal = () => {
    isAlternate = false;
    elements.closeBtn.innerHTML = originalBtnText ?? '';
  };

  const useAlternate = () => {
    isAlternate = true;
    elements.closeBtn.innerHTML = (elements.closeBtn.dataset.alt || originalBtnText) ?? '';
  };

  const listeners = {
    touchstart: () => {
      isTouching = true;
      elements.closeBtn.removeEventListener('touchstart', listeners.touchstart);
      elements.closeBtn.addEventListener('touchend', listeners.touchend);
    },

    touchend: () => {
      isTouching = false;
      elements.closeBtn.removeEventListener('touchend', listeners.touchstart);
      elements.closeBtn.addEventListener('touchstart', listeners.touchend, {
        passive: true,
      });
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
    elements.closeBtn.addEventListener('touchstart', listeners.touchstart, {
      passive: true,
    });
    addEventListener('devicemotion', listeners.devicemotion);
    addEventListener('keydown', listeners.keydown);
    elements.main.addEventListener('submit', listeners.submit);
  };

  const ignore = () => {
    elements.closeBtn.removeEventListener('touchstart', listeners.touchstart);
    elements.closeBtn.removeEventListener('touchend', listeners.touchend);
    removeEventListener('devicemotion', listeners.devicemotion);
    removeEventListener('keydown', listeners.keydown);
    removeEventListener('keyup', listeners.keyup);
    elements.main.removeEventListener('submit', listeners.submit);
  };

  const originalBtnText = elements.closeBtn.textContent;
  let isAlternate = false;
  let isTouching = false;
  let isCtrl = false;

  init();
  listen();

  return {
    open,
    close,
    listen,
    ignore,
  };
};
