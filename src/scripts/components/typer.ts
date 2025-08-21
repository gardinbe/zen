import { createCursor, type Cursor } from './cursor';

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
  type: (html: string) => void;

  /**
   * Starts the typer.
   */
  start: () => void;

  /**
   * Clears the main element.
   */
  clear: () => void;
};

export const createTyper = (els: TyperElements): Typer => {
  const cursor = createCursor();
  const queue = createEffectQueue();

  const createState = (..._nodes: Node[]): TyperState => {
    const nodes = getTextNodes(..._nodes).filter(
      (n) => n.parentElement instanceof HTMLPreElement || n.textContent!.trim(),
    );
    const effects = nodes.flatMap(parseEffects);

    return {
      nodes,
      effects,
    };
  };

  const createEffectRunners = (state: TyperState): EffectRunner[] => {
    let currentNode: Text | null = null;

    const setCurrentNode = (node: Text | null) => {
      currentNode = node;

      if (!node) {
        return;
      }

      cursor.attach(node);
    };

    return state.effects.map(
      (effect) => () =>
        effect({
          nodes: state.nodes,
          get currentNode() {
            return currentNode;
          },
          setCurrentNode,
          cursor,
        }),
    );
  };

  const start = () => {
    const state = createState(els.main);
    const runners = createEffectRunners(state);
    queue.push(...runners);
  };

  const type = (html: string) => {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const nodes = [...tpl.content.childNodes];
    els.main.append(...nodes);

    const state = createState(...nodes);
    const runners = createEffectRunners(state);
    queue.push(...runners);
  };

  const clear = async () => {
    await queue.clear();
    els.main.innerHTML = '';
  };

  return {
    cursor,
    type,
    start,
    clear,
  };
};

type TyperQueue = {
  /**
   * Pushes items to the queue.
   * @param runners Items to push.
   */
  push: (...runners: EffectRunner[]) => void;

  /**
   * Clears the queue.
   */
  clear: () => Promise<void>;
};

const createEffectQueue = (): TyperQueue => {
  let running = false;
  let active: Promise<void> | null = null;
  const runners: EffectRunner[] = [];

  const push = (..._runners: EffectRunner[]) => {
    runners.push(..._runners);
    active = run();
    active.then(() => {
      active = null;
    });
  };

  const clear = async () => {
    runners.length = 0;

    if (active) {
      await active;
    }

    runners.length = 0;
  };

  const run = async () => {
    if (running) {
      return;
    }
    running = true;

    while (runners.length) {
      await runners.shift()!();
    }

    running = false;
  };

  return {
    push,
    clear,
  };
};

type TyperState = {
  nodes: Text[];
  effects: Effect[];
};

const getTextNodes = (...nodes: Node[]): Text[] =>
  nodes.flatMap((node) =>
    node.nodeType === Node.TEXT_NODE ? [node as Text] : getTextNodes(...node.childNodes),
  );

type EffectContext = Readonly<{
  /**
   * All text nodes.
   */
  nodes: Text[];

  /**
   * Current text node.
   */
  currentNode: Text | null;

  /**
   * Sets the current text node.
   */
  setCurrentNode: (node: Text | null) => void;

  /**
   * Cursor instance.
   */
  cursor: Cursor;
}>;

type Effect = (ctx: EffectContext) => void | Promise<void>;

type EffectRunner = () => ReturnType<Effect>;

type EffectBuilder<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TArgs extends any[],
> = (...args: TArgs) => Effect;

type EffectsBuilder = {
  type: EffectBuilder<[text: string]>;
  insert: EffectBuilder<[text: string]>;
  undo: EffectBuilder<[quantity: number]>;
  remove: EffectBuilder<[quantity: number]>;
  delay: EffectBuilder<[ms: number]>;
};

type EffectName = keyof EffectsBuilder;

const WhitespaceRegex = /\s/;

const createEffectsBuilder = (node: Text): EffectsBuilder => {
  return {
    type: (text) => async (ctx) => {
      ctx.setCurrentNode(node);
      ctx.cursor.freeze();

      let prevChar: string | null = null;
      let i = 0;

      while (ctx.currentNode && i < text.length) {
        const char = text[i]!;
        ctx.currentNode.textContent! += char;
        i++;

        if (
          !(ctx.currentNode.parentElement instanceof HTMLPreElement) &&
          WhitespaceRegex.test(char) &&
          prevChar &&
          WhitespaceRegex.test(prevChar)
        ) {
          continue;
        }

        prevChar = char;

        await randomDelay(5, 30);
      }

      ctx.cursor.blink();
    },

    insert: (text) => (ctx) => {
      ctx.setCurrentNode(node);

      if (!ctx.currentNode) {
        return;
      }

      ctx.currentNode.textContent += text;
    },

    undo: (quantity) => async (ctx) => {
      ctx.setCurrentNode(node);
      ctx.cursor.freeze();

      let prevChar: string | null = null;
      let i = 0;

      while (ctx.currentNode && i < quantity) {
        const char = ctx.currentNode.textContent!.slice(-1);

        if (!char) {
          const nextIndex = ctx.nodes.indexOf(ctx.currentNode) + 1;
          ctx.setCurrentNode(ctx.nodes[nextIndex] ?? null);
          continue;
        }

        ctx.currentNode.textContent = ctx.currentNode.textContent!.slice(0, -1);
        i++;

        if (
          !(ctx.currentNode.parentElement instanceof HTMLPreElement) &&
          WhitespaceRegex.test(char) &&
          prevChar &&
          WhitespaceRegex.test(prevChar)
        ) {
          continue;
        }

        prevChar = char;

        await randomDelay(5, 30);
      }

      ctx.cursor.blink();
    },

    remove: (quantity) => (ctx) => {
      ctx.setCurrentNode(node);

      let remaining = quantity;

      while (ctx.currentNode && remaining > 0) {
        const text = ctx.currentNode.textContent ?? '';
        const removed = Math.min(remaining, text.length);

        ctx.currentNode.textContent = text.slice(0, text.length - removed);
        remaining -= removed;

        if (!remaining) {
          break;
        }

        const nextIndex = ctx.nodes.indexOf(ctx.currentNode) + 1;
        ctx.setCurrentNode(ctx.nodes[nextIndex] ?? null);
      }
    },

    delay: (ms) => async (ctx) => {
      ctx.setCurrentNode(node);
      ctx.cursor.blink();
      await delay(ms);
    },
  };
};

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const randomDelay = (min: number, max: number) => delay(Math.random() * (max - min) + min);

/**
 * group 0: full string
 * group 1: key
 * group 2: value
 * group 3: periods
 * group 4: commas
 */
const Regex = /(?:\[\[\s*(.*?)\s*:(.*?)\]\]|\S(\.)\s|\S(,)\s)/dgs;

const parseEffects = (node: Text): Effect[] => {
  const text =
    node.parentElement instanceof HTMLPreElement ? node.textContent! : node.textContent!.trim();

  node.textContent = '';

  const builder = createEffectsBuilder(node);

  let last = 0;

  const parseEffect = (match: RegExpExecArray) => {
    const [full, key, value, period, comma] = match;

    if (period) {
      return {
        effect: builder.delay(300),
        end: match.index + full.length,
      };
    }

    if (comma) {
      return {
        effect: builder.delay(100),
        end: match.index + full.length,
      };
    }

    if (key && value) {
      const end = match.index;

      switch (key as EffectName) {
        case 'type': {
          return {
            effect: builder.type(value),
            end,
          };
        }
        case 'insert': {
          return {
            effect: builder.insert(value),
            end,
          };
        }
        case 'undo': {
          const parsed = parseInt(value);

          if (isNaN(parsed)) {
            throw new Error('Invalid typer effect quantity');
          }

          return {
            effect: builder.undo(parsed),
            end,
          };
        }
        case 'remove': {
          const parsed = parseInt(value);

          if (isNaN(parsed)) {
            throw new Error('Invalid typer effect quantity');
          }

          return {
            effect: builder.remove(parsed),
            end,
          };
        }
        case 'delay': {
          const parsed = parseFloat(value);

          if (isNaN(parsed)) {
            throw new Error('Invalid typer effect delay');
          }

          return {
            effect: builder.delay(parsed),
            end,
          };
        }
        default: {
          throw new Error('Unknown typer effect');
        }
      }
    }

    throw new Error('Error parsing typer');
  };

  const effects = [...text.matchAll(Regex)].flatMap<Effect>((match) => {
    const [full] = match;
    const { effect, end } = parseEffect(match);

    const slice = text.slice(last, end);
    last = match.index + full.length;

    if (!slice) {
      return effect;
    }

    return [builder.type(slice), effect];
  });

  const slice = text.slice(last);

  if (slice) {
    effects.push(builder.type(slice));
  }

  return effects;
};
