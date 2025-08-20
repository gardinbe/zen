/**
 * Alias for `ParentNode.querySelector` whose generic extends `HTMLElement`.
 *
 * Throws an error if the element is not found.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelector
 * @throws {Error} If the element is not found.
 */
export const query = <T extends HTMLElement>(selector: string, parent: ParentNode = document) => {
  const el = parent.querySelector<T>(selector);

  if (!el) {
    throw new Error(`Element not found: ${selector}`);
  }

  return el;
};

/**
 * Alias for `ParentNode.querySelectorAll` whose generic extends `HTMLElement`.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll
 */
export const queryAll = <T extends HTMLElement>(
  selector: string,
  parent: ParentNode = document
) => [...parent.querySelectorAll<T>(selector)];
