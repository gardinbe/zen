import { type EffectConstructor, WhitespaceRegex } from '../effect';
import { randomTimeout } from '../../../utils/delay';

export const TypeEffect: EffectConstructor<string> = {
  name: 'type',
  parse: (value) => value,
  create: (text) => async (ctx) => {
    try {
      ctx.cursor.freeze();

      let prevChar: string | null = null;
      let i = 0;

      while (i < text.length) {
        ctx.setNodeState(ctx.node, 'active');

        const char = text[i]!;
        ctx.node.textContent! += char;
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
            min: 2,
            max: 5,
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
