import { type Cursor, createCursor } from '../cursor';
import {
  type EffectBatch,
  type EffectBatchCallbacks,
  type EffectExecutor,
  type TyperQueue,
  createTyperQueue,
} from './queue';
import { type EffectContext, EffectNodeState, createEffects } from './effects';

export type TyperElements = {
  main: HTMLElement;
};

export const createTyperElements = (): TyperElements => {
  const main = document.createElement('div');

  return {
    main,
  };
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
   * Appends HTML to the main element.
   * @param html HTML to append.
   */
  insert: (html: string) => void;

  /**
   * Appends HTML to the main element and types it.
   * @param html HTML to type.
   * @param callbacks Callbacks.
   */
  type: (html: string, callbacks?: Partial<EffectBatchCallbacks>) => void;

  /**
   * Stops the typer.
   */
  stop: () => Promise<void>;

  /**
   * Clears the typer queue.
   */
  clear: () => Promise<void>;
};

export type TyperOptions = {
  /**
   * Whether the typer should be scrollable.
   *
   * todo: make optional. do alongside event listener amends
   */
  scrollable: boolean;
};

/**
 * Creates a new typer instance.
 * @param els Typer elements.
 * @param options Typer options.
 * @returns Typer instance.
 */
export const createTyper = (els: TyperElements, options: TyperOptions): Typer => {
  const init = () => {
    els.main.classList.add('zen-typer', 'u-zen-crt-text');

    if (options.scrollable) {
      els.main.classList.add('zen-typer--scrollable');
    }
  };

  const createScroller = (): TyperScroller => {
    const tick: FrameRequestCallback = () => {
      if (els.main.scrollTop + LoggerScrollRegion <= prevScrollTop) {
        requestAnimationFrame(tick);
        return;
      }

      els.main.scrollTop = els.main.scrollHeight;
      prevScrollTop = els.main.scrollTop;

      if (!isRunning) {
        cancelAnimationFrame(id);
        return;
      }

      id = requestAnimationFrame(tick);
    };

    const start = () => {
      isRunning = true;
      id = requestAnimationFrame(tick);
    };

    const stop = () => {
      isRunning = false;
    };

    let prevScrollTop = 0;
    let isRunning = true;
    let id = 0;

    return {
      start,
      stop,
    };
  };

  const setActiveNode = (node: Node) => {
    activeNode = node;

    if (!node) {
      return;
    }

    cursor.attach(node);
  };

  const setNodeState = (node: Node, state: EffectNodeState) => {
    // todo: top level parent not getting right state (complete when it shouldn't be)

    const applyState = (el: HTMLElement, newState: EffectNodeState) => {
      if (el === els.main) {
        return;
      }

      el.dataset.typerState = newState;

      const parent = el.parentElement;

      if (!parent) {
        return;
      }

      const parentState = getParentState(parent);
      applyState(parent, parentState);
    };

    const el = node instanceof HTMLElement ? node : node.parentElement;

    if (!el) {
      return;
    }

    applyState(el, state);
  };

  const getParentState = (parent: HTMLElement): EffectNodeState => {
    const hasState = (state: EffectNodeState) =>
      !!parent.querySelector(`[data-typer-state='${state}']`);

    const hasComplete = hasState(EffectNodeState.Complete);
    const hasIncomplete = hasState(EffectNodeState.Incomplete);
    const hasActive = hasState(EffectNodeState.Active);

    if (hasComplete && !hasIncomplete && !hasActive) {
      return EffectNodeState.Complete;
    }

    if (hasIncomplete && !hasComplete && !hasActive) {
      return EffectNodeState.Incomplete;
    }

    return EffectNodeState.Active;
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
    const sourceEls = getChildrenDeep(...sourceNodes);

    sourceEls.forEach((el) => {
      el.dataset.typerState = EffectNodeState.Incomplete;
    });

    const leafNodes = getLeafNodesDeep(...sourceNodes);

    const leaves = leafNodes.map<LeafNode>((node) => ({
      node,
      text: isPreformattedNode(node)
        ? node.textContent
        : node.textContent?.trim()
          ? node.textContent
          : null,
    }));

    leafNodes.forEach((node) => {
      node.textContent = '';
    });

    const executors = leaves.flatMap((leaf) =>
      createEffects(leaf.text).map<EffectExecutor>((effect) => (signal) => {
        setActiveNode(leaf.node);

        const ctx: EffectContext = {
          signal,
          cursor,
          nodes: leafNodes,
          targetNode: leaf.node,
          get node() {
            return activeNode!;
          },
          setActiveNode,
          setNodeState,
        };

        return effect(ctx);
      }),
    );

    return executors;
  };

  const insert = (html: string) => {
    const scroller = createScroller();
    scroller.start();
    els.main.insertAdjacentHTML('beforeend', html);
    scroller.stop();
  };

  const type = (html: string, callbacks?: Partial<EffectBatchCallbacks>) => {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const nodes = Array.from(tpl.content.childNodes);
    els.main.append(...nodes);

    const scroller = createScroller();

    const batch = createBatch(nodes, {
      ...callbacks,
      onStart: () => {
        scroller.start();
        callbacks?.onStart?.();
      },
      onFinish: () => {
        scroller.stop();
        callbacks?.onFinish?.();
      },
    });

    queue.push(batch);
  };

  const stop = () => queue.clear();

  const clear = async () => {
    await stop();
    els.main.innerHTML = '';
  };

  let activeNode: Node | null = null;
  const cursor = createCursor();
  const queue = createTyperQueue();

  init();

  return {
    cursor,
    queue,
    insert,
    type,
    stop,
    clear,
  };
};

type TyperScroller = {
  /**
   * Starts the scroller.
   */
  start: () => void;

  /**
   * Stops the scroller.
   */
  stop: () => void;
};

/**
 * Region in which the logger will scroll to the bottom.
 */
const LoggerScrollRegion = 5;

type LeafNode<T extends Node = Node> = {
  node: T;
  text: string | null;
};

const getChildrenDeep = (...nodes: Node[]): HTMLElement[] =>
  nodes
    .filter((node) => node instanceof HTMLElement)
    .flatMap<HTMLElement>((node) => [node].concat(getChildrenDeep(...node.children)));

const getLeafNodesDeep = (...nodes: Node[]): Node[] =>
  nodes.flatMap<Node>((node) =>
    node.childNodes.length ? getLeafNodesDeep(...node.childNodes) : node,
  );

/**
 * Checks if the node is a preformatted node.
 *
 * todo: there is a super annoying edge case that is not handled:
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
export const isPreformattedNode = (node: Node): boolean =>
  !!node.parentElement &&
  ['preserve', 'preserve-breaks'].includes(getComputedStyle(node.parentElement).whiteSpaceCollapse);
