import { type Effect, WhitespaceRegex } from '../effect';
import { randomDelay } from '../../../utils/delay';

export const Undo: Effect<number> = {
  name: 'undo',
  parse: (value) => parseInt(value),
  run: (quantity) => async (ctx) => {
    ctx.cursor.freeze();

    let prevChar: string | null = null;
    let i = 0;

    while (i < quantity && ctx.node) {
      const char = ctx.node.textContent!.slice(-1);

      if (!char) {
        const nextIndex = ctx.nodes.indexOf(ctx.node) + 1;
        ctx.set(ctx.nodes[nextIndex] ?? null);
        continue;
      }

      ctx.setState('active');
      ctx.node.textContent = ctx.node.textContent!.slice(0, -1);

      if (!ctx.node.textContent) {
        ctx.setState('incomplete');
      }

      i++;

      if (
        // todo: this is dodgy
        !(ctx.node.parentElement instanceof HTMLPreElement) &&
        WhitespaceRegex.test(char) &&
        prevChar &&
        WhitespaceRegex.test(prevChar)
      ) {
        continue;
      }

      prevChar = char;

      try {
        await randomDelay(
          {
            min: 30,
            max: 60,
          },
          ctx.signal,
        );
      } catch (err) {
        if (!ctx.signal.aborted) {
          throw err;
        }

        break;
      }
    }

    ctx.setState('complete');
    ctx.cursor.blink();
  },
};
