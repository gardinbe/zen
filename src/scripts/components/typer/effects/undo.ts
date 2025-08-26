import { type EffectConstructor, EffectNodeState, WhitespaceRegex } from '.';
import { isPreformattedNode } from '..';
import { randomDelay } from '../../../utils/delay';

// todo: this effect is a bit broken

export const UndoEffect: EffectConstructor<[number]> = {
  name: 'undo',
  parse: (value) => [parseInt(value)],
  create: (quantity) => async (ctx) => {
    ctx.cursor.freeze();

    let prevChar: string | null = null;
    let i = 0;

    while (i < quantity) {
      const char = ctx.node.textContent!.slice(-1);

      if (!char) {
        const prevNode = ctx.nodes.at(ctx.nodes.indexOf(ctx.node) - 1);

        if (prevNode) {
          ctx.setActiveNode(prevNode);
        }

        continue;
      }

      i++;

      ctx.setNodeState(ctx.node, EffectNodeState.Active);
      ctx.node.textContent = ctx.node.textContent!.slice(0, -1);

      if (!ctx.node.textContent) {
        ctx.setNodeState(ctx.node, EffectNodeState.Incomplete);
      }

      if (
        !isPreformattedNode(ctx.node) &&
        WhitespaceRegex.test(char) &&
        prevChar &&
        WhitespaceRegex.test(prevChar)
      ) {
        continue;
      }

      prevChar = char;

      const fulfilled = await randomDelay(
        {
          min: 30,
          max: 60,
        },
        ctx.signal,
      );

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
