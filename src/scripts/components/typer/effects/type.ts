import { type EffectConstructor, EffectNodeState, WhitespaceRegex } from '.';
import { isPreformattedNode } from '..';
import { randomDelay } from '../../../utils/delay';

export const TypeEffect: EffectConstructor<[string]> = {
  name: 'type',
  create: (text) => async (ctx) => {
    ctx.cursor.freeze();

    let prevChar: string | null = null;
    let i = 0;

    while (i < text.length) {
      ctx.setNodeState(ctx.node, EffectNodeState.Active);

      const char = text.at(i)!;
      i++;

      ctx.node.textContent! += char;

      if (
        !isPreformattedNode(ctx.node) &&
        WhitespaceRegex.test(char) &&
        prevChar &&
        WhitespaceRegex.test(prevChar)
      ) {
        continue;
      }

      prevChar = char;

      const fulfilled = await randomDelay(1, 4, ctx.signal);

      if (!fulfilled) {
        ctx.setNodeState(ctx.node, EffectNodeState.Complete);
        ctx.cursor.blink();
        return;
      }
    }

    ctx.setNodeState(ctx.node, EffectNodeState.Complete);
    ctx.cursor.blink();
  },
};
