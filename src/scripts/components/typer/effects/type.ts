import { type EffectConstructor, WhitespaceRegex } from '../effect';
import { randomTimeout } from '../../../utils/timeout';

export const TypeEffect: EffectConstructor<string> = {
  name: 'type',
  parse: (value) => value,
  create: (text) => async (ctx) => {
    ctx.cursor.freeze();

    let prevChar: string | null = null;
    let i = 0;

    while (i < text.length) {
      ctx.setNodeState(ctx.node, 'active');

      const char = text.at(i)!;
      i++;

      ctx.node.textContent! += char;

      if (
        !ctx.isPreformattedNode(ctx.node) &&
        WhitespaceRegex.test(char) &&
        prevChar &&
        WhitespaceRegex.test(prevChar)
      ) {
        continue;
      }

      prevChar = char;

      const error = await randomTimeout(
        {
          min: 1,
          max: 5,
        },
        ctx.signal,
      );

      if (error) {
        ctx.setNodeState(ctx.node, 'complete');
        ctx.cursor.blink();
        return;
      }
    }

    ctx.setNodeState(ctx.node, 'complete');
    ctx.cursor.blink();
  },
};
