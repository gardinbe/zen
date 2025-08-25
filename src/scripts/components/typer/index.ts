import { isTruthy } from '../../utils/predicates';
import { type Cursor, createCursor } from '../cursor';
import { type EffectContext, type EffectNodeState, createEffects } from './effects';
import {
  type EffectBatch,
  type EffectBatchCallbacks,
  type EffectExecutor,
  type TyperQueue,
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
   * Queue instance.
   */
  queue: TyperQueue;

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

export const createTyper = (els: TyperElements): Typer => {
  const setActiveNode = (node: Node) => {
    activeNode = node;

    if (!node) {
      return;
    }

    cursor.attach(node);
  };

  const setNodeState = (node: Node, state: EffectNodeState) => {
    const set = (element: HTMLElement, newState: EffectNodeState) => {
      if (element === els.main) {
        return;
      }

      element.dataset.typerState = newState;

      const parent = element.parentElement;

      if (!parent) {
        return;
      }

      // todo: tidy

      const has = (givenState: EffectNodeState) =>
        !!parent.querySelector(`[data-typer-state='${givenState}']`);

      const hasComplete = has('complete');
      const hasIncomplete = has('incomplete');
      const hasActive = has('active');

      const complete = hasComplete && !hasIncomplete && !hasActive;
      const incomplete = hasIncomplete && !hasComplete && !hasActive;

      const parentState: EffectNodeState = complete
        ? 'complete'
        : incomplete
          ? 'incomplete'
          : 'active';

      set(parent, parentState);
    };

    const element = node instanceof HTMLElement ? node : node.parentElement;

    if (!element) {
      return;
    }

    set(element, state);
  };

  const createBatch = (nodes: Node[], callbacks?: Partial<EffectBatchCallbacks>): EffectBatch => ({
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
  });

  const createEffectExecutors = (...sourceNodes: Node[]): EffectExecutor[] => {
    const nodes = getLeafNodes(...sourceNodes);

    const leaves = nodes.map<LeafNode>((node) => ({
      node,
      text: isPreformattedNode(node) ? node.textContent : node.textContent?.trim() || null,
    }));

    nodes.forEach((node) => {
      node.textContent = '';
    });

    nodes
      .map((node) => (node instanceof HTMLElement ? node : node.parentElement))
      .filter(isTruthy)
      .forEach((element) => {
        element.dataset.typerState = 'incomplete';
      });

    const executors = leaves.flatMap((leaf) =>
      createEffects(leaf.text).map<EffectExecutor>((effect) => (signal) => {
        setActiveNode(leaf.node);

        const ctx: EffectContext = {
          signal,
          cursor,
          nodes,
          targetNode: leaf.node,
          get node() {
            return activeNode!;
          },
          setActiveNode,
          setNodeState,
          isPreformattedNode,
        };

        return effect(ctx);
      }),
    );

    return executors;
  };

  const stop = () => queue.clear();

  const type = (text: string, callbacks?: Partial<EffectBatchCallbacks>) => {
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

  let activeNode: Node | null = null;

  const cursor = createCursor();
  const queue = createTyperQueue();

  return {
    cursor,
    queue,
    type,
    stop,
    clear,
  };
};

type LeafNode<T extends Node = Node> = {
  node: T;
  text: string | null;
};

const getLeafNodes = (...nodes: Node[]): Node[] =>
  nodes.flatMap<Node>((node) => (node.childNodes.length ? getLeafNodes(...node.childNodes) : node));

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
  !!node.parentElement &&
  ['preserve', 'preserve-breaks'].includes(getComputedStyle(node.parentElement).whiteSpaceCollapse);
