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

const parseNodes = (...nodes: Node[]): Text[] =>
  nodes.flatMap((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // todo: very dodgy
      if (!node.textContent!.trim() && !isPreformattedNode(node)) {
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

const isPreformattedNode = (node: Node) =>
  getComputedStyle(node.parentElement!).whiteSpace !== 'pre-wrap';
