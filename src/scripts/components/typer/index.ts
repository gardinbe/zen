import { type Cursor, createCursor } from '../cursor';
import { type EffectContext, type EffectNodeState, createEffects } from './effect';
import {
  type EffectBatch,
  type EffectBatchCallbacks,
  type EffectExecutor,
  createTyperQueue,
} from './queue';

export type TyperElements = {
  main: HTMLElement;
};

export type Typer = {
  /**
   * Cursor instance.
   */
  cursor: Cursor;

  /**
   * Appends HTML to the main element and types it.
   * @param text Text to type.
   * @param callbacks Callbacks.
   */
  type: (text: string, callbacks?: Partial<EffectBatchCallbacks>) => void;

  /**
   * Stops the typer.
   */
  stop: () => void;

  /**
   * Clears the main element.
   */
  clear: () => void;
};

// todo: this needs a tidy

export const createTyper = (els: TyperElements): Typer => {
  let currentNode: Text | null = null;

  const setNode = (node: Text) => {
    currentNode = node;

    if (!node) {
      return;
    }

    cursor.attach(node);
  };

  const setNodeState = (node: Node, state: EffectNodeState) => {
    const updateParent = (parent: HTMLElement) => {
      // todo: a check like this needs to be in place for remove/undo to work properly

      // if (parent.firstChild !== child) {
      //   return;
      // }

      parent.hidden = state === 'incomplete';
      parent.dataset.typerState = state;

      if (parent === els.main) {
        return;
      }

      updateParent(parent.parentElement!);
    };

    updateParent(node.parentElement!);
  };

  const createEffectExecutors = (..._nodes: Node[]): EffectExecutor[] => {
    const nodes = parseNodes(..._nodes);

    const executors = nodes.flatMap((node) => {
      const text = node.textContent!;
      node.textContent = '';

      return createEffects(text).map<EffectExecutor>((effect) => () => {
        setNode(node);

        const ctx: EffectContext = {
          signal: queue.signal,
          cursor,
          nodes,
          get node() {
            return currentNode!;
          },
          setNode,
          setNodeState,
          isPreformattedNode,
        };

        return effect(ctx);
      });
    });

    return executors;
  };

  const parseNodes = (...nodes: Node[]): Text[] =>
    nodes.flatMap((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!isPreformattedNode(node) && !node.textContent!.trim()) {
          return [];
        }

        return [node as Text];
      }

      if (node instanceof HTMLElement) {
        // todo: reconsider this
        // `hidden` applies to apply margin trimming based on base.css
        node.hidden = true;
        node.dataset.typerState = 'incomplete';
      }

      return parseNodes(...node.childNodes);
    });

  /**
   * Checks if the node is a preformatted node.
   *
   * todo: there is a super annoying edge case that is not handled.
   *
   * although i think its an 'intended' behavior
   *
   * if there is a <pre> within the typer output, and there is an empty text node (newline), then
   * the newline will not be hidden. this causes the cursor to flash onto the newline for an
   * instant. this is expected, because whitespace must be respected in preformatted elements.
   *
   * however, marked.js and markdown-it both insert newlines at the end of a <code> block within a
   * <pre>, so that fucks this up, causing a brief cursor flash at the end
   *
   * @param node Node to check.
   * @returns True if the node is a preformatted node.
   */
  const isPreformattedNode = (node: Node): boolean =>
    ['pre', 'pre-wrap', 'pre-line'].includes(getComputedStyle(node.parentElement!).whiteSpace);

  const createBatch = (nodes: Node[], callbacks?: Partial<EffectBatchCallbacks>): EffectBatch => {
    return {
      executors: createEffectExecutors(...nodes),
      onStart: () => {
        callbacks?.onStart?.();
      },
      onComplete: () => {
        callbacks?.onComplete?.();
      },
      onAbort: () => {
        callbacks?.onAbort?.();
      },
      onFinish: () => {
        callbacks?.onFinish?.();
      },
    };
  };

  const stop = () => queue.clear();

  const type = async (text: string, callbacks?: Partial<EffectBatchCallbacks>) => {
    const tpl = document.createElement('template');
    tpl.innerHTML = text;
    const nodes = [...tpl.content.childNodes];
    els.main.append(...nodes);

    const batch = createBatch(nodes, callbacks);
    queue.push(batch);
  };

  const clear = async () => {
    await stop();
    els.main.innerHTML = '';
  };

  const cursor = createCursor();
  const queue = createTyperQueue();

  return {
    cursor,
    type,
    stop,
    clear,
  };
};
