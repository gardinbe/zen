import { type EffectConstructor, WhitespaceRegex } from '../effect';
import { randomTimeout } from '../../../utils/delay';

// todo: this effect is a bit broken

export const UndoEffect: EffectConstructor<number> = {
  name: 'undo',
  parse: (value) => parseInt(value),
  create: (quantity) => async (ctx) => {
    try {
      ctx.cursor.freeze();

      let prevChar: string | null = null;
      let i = 0;

      while (i < quantity) {
        const char = ctx.node.textContent!.slice(-1);

        if (!char) {
          const prevNode = ctx.nodes[ctx.nodes.indexOf(ctx.node) - 1];

          if (prevNode) {
            ctx.setNode(prevNode);
          }

          continue;
        }

        ctx.setNodeState(ctx.node, 'active');
        ctx.node.textContent = ctx.node.textContent!.slice(0, -1);

        if (!ctx.node.textContent) {
          ctx.setNodeState(ctx.node, 'incomplete');
        }

        i++;

        if (
          ctx.isPreformattedNode(ctx.node) &&
          WhitespaceRegex.test(char) &&
          prevChar &&
          WhitespaceRegex.test(prevChar)
        ) {
          continue;
        }

        prevChar = char;

        await randomTimeout(
          {
            min: 30,
            max: 60,
          },
          ctx.signal,
        );
      }
    } catch (err) {
      if (!ctx.signal.aborted) {
        throw err;
      }
    } finally {
      ctx.setNodeState(ctx.node, 'complete');
      ctx.cursor.blink();
    }
  },
};
