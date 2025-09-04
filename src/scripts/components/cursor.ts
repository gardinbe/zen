export type Cursor = {
  /**
   * Attaches the cursor to the specified node.
   * @param node Target node.
   */
  attach: (node: Node) => void;

  /**
   * Blinks the cursor.
   */
  blink: () => void;

  /**
   * Stops blinking the cursor.
   */
  freeze: () => void;

  /**
   * Sets the position offset of the cursor.
   *
   * Offset 0 is the end of the string. Positive values move the cursor backward.
   * @param offset Position offset.
   */
  setPosition: (offset: number) => void;

  /**
   * Shows the cursor.
   */
  show: () => void;

  /**
   * Hides the cursor.
   */
  hide: () => void;
};

/**
 * Creates a cursor instance.
 * @returns Cursor instance.
 */
export const createCursor = (): Cursor => {
  const attach = (node: Node) => {
    const parent = node.parentElement;

    if (!parent || node.nextSibling === els.main) {
      return;
    }

    parent.insertBefore(els.main, node);
    parent.insertBefore(node, els.main);
  };

  const blink = () => {
    els.main.dataset.cursorState = 'blink';
  };

  const freeze = () => {
    els.main.dataset.cursorState = 'static';
  };

  const show = () => {
    els.main.hidden = false;
  };

  const hide = () => {
    els.main.hidden = true;
  };

  const setPosition = (offset: number) => {
    els.main.style.translate = offset ? `-${offset}ch` : '';
  };

  const els = createCursorElements();

  blink();

  return {
    attach,
    blink,
    freeze,
    setPosition,
    show,
    hide,
  };
};

type CursorElements = {
  main: HTMLElement;
  caret: HTMLElement;
};

const createCursorElements = (): CursorElements => {
  const main = document.createElement('div');
  main.classList.add('zen-cursor');
  main.ariaHidden = 'true';
  main.innerHTML = '\u200B';

  const caret = document.createElement('div');
  caret.classList.add('zen-cursor-caret');

  main.append(caret);

  return {
    main,
    caret,
  };
};
