export type DialogElements = {
  main: HTMLFormElement;
  closeBtn: HTMLElement;
};

export type Dialog = {
  open: () => void;
  close: () => void;
};

export type DialogOptions = {
  onClose?: (alt: boolean) => void;
};

export const createDialog = (els: DialogElements, options?: Partial<DialogOptions>): Dialog => {
  const open = () => {
    els.main.hidden = false;
  };

  const close = (alt = false) => {
    els.main.hidden = true;
    options?.onClose?.(alt);
  };

  let ctrl = false;

  const keydown = (ev: KeyboardEvent) => {
    ctrl = ev.ctrlKey;
    removeEventListener('keydown', keydown);
    addEventListener('keyup', keyup);
  };

  const keyup = () => {
    ctrl = false;
    removeEventListener('keyup', keyup);
    addEventListener('keydown', keydown);
  };

  addEventListener('keydown', keydown);

  els.main.addEventListener('submit', (ev) => {
    ev.preventDefault();
    close(ctrl);
  });

  requestAnimationFrame(() => {
    els.closeBtn.focus();
  });

  return {
    open,
    close,
  };
};
