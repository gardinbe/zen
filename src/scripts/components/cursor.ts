export type Cursor = {
  /**
   * The cursor element.
   */
  readonly element: HTMLElement;

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
 * Symbol used for the caret.
 *
 * Suggested values:
 *
 * - ▏ Left One-Eighth Block
 * - ▎ Left One-Quarter Block
 * - ▍ Left Three-Eighths Block
 * - ▌ Left Half Block
 * - ▋ Left Five-Eighths Block
 * - ▊ Left Three-Quarters Block
 * - ▉ Left Seven-Eighths Block
 * - ▁ Lower One-Eighth Block
 * - ▂ Lower One-Quarter Block
 * - ▃ Lower Three-Eighths Block
 * - ▄ Lower Half Block
 * - █ Full Block
 * - _ Low Line (underscore)
 * - | Vertical Line (pipe)
 * - │ Box Drawings Light Vertical
 * - ▮ Black Vertical Rectangle - **not great on mobile**
 * - ■ Black Square
 * - □ White Square
 * - ● Black Circle
 * - ○ White Circle
 * - ◆ Black Diamond
 * - ◇ White Diamond
 * - ❖ Black Diamond Minus White X
 * - ☚ Black Left-Pointing Index
 * - \< Less-Than Sign
 * - \> Greater-Than Sign
 * - ◁ White Left-Pointing Triangle
 * - ▷ White Right-Pointing Triangle
 * - ‹ Single Left-Pointing Angle Quotation Mark
 * - › Single Right-Pointing Angle Quotation Mark
 */
const Caret = '▮';

export const createCursor = (): Cursor => {
  const attach = (node: Node) => {
    const parent = node.parentElement;

    if (!parent || node.nextSibling === caret) {
      return;
    }

    parent.insertBefore(cursor, node);
    parent.insertBefore(node, cursor);
  };

  const blink = () => {
    caret.dataset.cursorState = 'blink';
  };

  const freeze = () => {
    caret.dataset.cursorState = 'static';
  };

  const show = () => {
    cursor.hidden = false;
  };

  const hide = () => {
    cursor.hidden = true;
  };

  const setPosition = (offset: number) => {
    const parent = cursor.parentElement;

    if (!parent) {
      return;
    }

    caret.style.translate = offset ? `-${offset}ch` : '';
  };

  const cursor = document.createElement('span');
  cursor.classList.add('zen-cursor');
  cursor.textContent = '\u200B';

  const caret = document.createElement('span');
  caret.classList.add('zen-cursor-caret');
  caret.ariaHidden = 'true';
  caret.textContent = Caret;
  cursor.append(caret);

  blink();

  return {
    element: cursor,
    attach,
    blink,
    freeze,
    setPosition,
    show,
    hide,
  };
};
