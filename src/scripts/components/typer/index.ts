import { type Cursor, createCursor } from '../cursor';
import { type EffectNodeState, createEffects } from './effect';
import {
  type EffectBatch,
  type EffectBatchCallbacks,
  type EffectRunner,
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
   * @param html HTML string.
   */
  type: (html: string, callbacks?: Partial<EffectBatchCallbacks>) => void;

  /**
   * Stops the typer.
   */
  stop: () => void;

  /**
   * Clears the main element.
   */
  clear: () => void;
};

export const createTyper = (els: TyperElements): Typer => {
  let currentNode: Text | null = null;

  const set = (node: Text | null) => {
    currentNode = node;

    if (!node) {
      return;
    }

    cursor.attach(node);
  };

  const setState = (state: EffectNodeState) => {
    if (!currentNode) {
      return;
    }

    const updateParent = (parent: HTMLElement) => {
      // todo: a check like this needs to be in place for remove/undo to work
      // need to address ALL the shitty parentElement hacks in place

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

    updateParent(currentNode.parentElement!);
  };

  const createEffectRunners = (..._nodes: Node[]) => {
    const nodes = parseNodes(..._nodes);

    const runners = nodes.flatMap((node) => {
      const text = node.textContent!;
      node.textContent = '';

      return createEffects(text).map<EffectRunner>((fn) => () => {
        set(node);
        return fn({
          signal: queue.signal,
          cursor,
          nodes,
          get node() {
            return currentNode;
          },
          set,
          setState,
        });
      });
    });

    return runners;
  };

  const createBatch = (nodes: Node[], callbacks?: Partial<EffectBatchCallbacks>): EffectBatch => {
    return {
      runners: createEffectRunners(...nodes),
      callbacks: {
        onStart: () => {
          callbacks?.onStart?.();
        },
        onComplete: () => {
          callbacks?.onComplete?.();
        },
        onAbort: () => {
          callbacks?.onAbort?.();
        },
        onEnd: () => {
          callbacks?.onEnd?.();
        },
      },
    };
  };

  const stop = () => queue.clear();

  const type = async (html: string, callbacks?: Partial<EffectBatchCallbacks>) => {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
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

const parseNodes = (...nodes: Node[]): Text[] =>
  nodes.flatMap((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // todo: very dodgy
      if (!node.textContent?.trim() && !(node.parentElement instanceof HTMLPreElement)) {
        return [];
      }

      return [node as Text];
    }

    if (node instanceof HTMLElement) {
      node.hidden = true;
      node.dataset.typerState = 'incomplete';
    }

    return parseNodes(...node.childNodes);
  });
