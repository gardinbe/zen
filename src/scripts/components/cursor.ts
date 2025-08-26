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
  const createElement = () => {
    const cursor = document.createElement('div');
    cursor.classList.add('zen-cursor');
    cursor.ariaHidden = 'true';
    cursor.innerHTML = '\u200B';

    const caret = document.createElement('div');
    caret.classList.add('zen-cursor-caret');

    cursor.append(caret);
    return cursor;
  };

  const attach = (node: Node) => {
    const parent = node.parentElement;

    if (!parent || node.nextSibling === cursor) {
      return;
    }

    parent.insertBefore(cursor, node);
    parent.insertBefore(node, cursor);
  };

  const blink = () => {
    cursor.dataset.cursorState = 'blink';
  };

  const freeze = () => {
    cursor.dataset.cursorState = 'static';
  };

  const show = () => {
    cursor.hidden = false;
  };

  const hide = () => {
    cursor.hidden = true;
  };

  const setPosition = (offset: number) => {
    cursor.style.translate = offset ? `-${offset}ch` : '';
  };

  const cursor = createElement();
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
