export type Cursor = {
  /**
   * Attaches the cursor to the specified node.
   * @param node Target node.
   */
  attach: (node: Node) => void;

  /**
   * Sets the state of the cursor.
   * @param state Cursor state.
   */
  setState: (state: 'static' | 'blink') => void;

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
 * - 	 Lower Half Block
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
  const el = document.createElement('span');
  el.classList.add('zen-cursor');
  el.ariaHidden = 'true';
  el.textContent = Caret;

  const attach = (node: Node) => {
    const parent = node.parentElement;

    if (!parent || node.nextSibling === el) {
      return;
    }

    parent.insertBefore(el, node);
    parent.insertBefore(node, el);
  };

  const setState = (value: 'blink' | 'static') => {
    el.dataset.typerState = value;
  };

  const show = () => {
    el.hidden = false;
  };

  const hide = () => {
    el.hidden = true;
  };

  const setPosition = (offset: number) => {
    const parent = el.parentElement;

    if (!parent) {
      return;
    }

    el.style.translate = offset ? `-${offset}ch` : '';
  };

  setState('blink');

  return {
    attach,
    setState,
    setPosition,
    show,
    hide,
  };
};
