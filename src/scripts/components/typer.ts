import { createCursor, type Cursor } from './cursor';

export type TyperElements = {
  main: HTMLElement;
};

export type Typer = {
  /**
   * Starts the typer.
   */
  run: () => Promise<void>;
};

export const createTyper = (els: TyperElements): Typer => {
  const { nodes, effects } = parse(els);
  let currentNode: Text | null = null;

  const cursor = createCursor();

  const setCurrentNode = (node: Text | null) => {
    currentNode = node;

    if (!node) {
      return;
    }

    cursor.attach(node);
  };

  const run = async () => {
    for (const effect of effects) {
      const ctx: EffectContext = {
        nodes,
        get currentNode() {
          return currentNode;
        },
        setCurrentNode,
        cursor,
      };

      await effect(ctx);
    }
  };

  return {
    run,
  };
};

const parse = (
  els: TyperElements,
): {
  nodes: Text[];
  effects: Effect[];
} => {
  const nodes = getTextNodes(els.main).filter(
    (node) => node.parentElement instanceof HTMLPreElement || node.textContent!.trim(),
  );
  const effects = nodes.flatMap(parseEffects);

  return {
    nodes,
    effects,
  };
};

const getTextNodes = (node: Node): Text[] =>
  node.nodeType === Node.TEXT_NODE ? [node as Text] : [...node.childNodes].flatMap(getTextNodes);

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

type EffectBuilder = {
  type: (text: string) => Effect;
  insert: (text: string) => Effect;
  undo: (quantity: number) => Effect;
  remove: (quantity: number) => Effect;
  delay: (ms: number) => Effect;
};

const WhitespaceRegex = /\s/;

const createEffectBuilder = (node: Text): EffectBuilder => {
  return {
    type: (text) => async (ctx) => {
      ctx.setCurrentNode(node);
      ctx.cursor.setState('static');

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

      ctx.cursor.setState('blink');
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
      ctx.cursor.setState('static');

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

      ctx.cursor.setState('blink');
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
      ctx.cursor.setState('blink');
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

  const builder = createEffectBuilder(node);

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

      switch (key) {
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
