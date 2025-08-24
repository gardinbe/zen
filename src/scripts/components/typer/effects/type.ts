import { type Effect, WhitespaceRegex } from '../effect';
import { randomDelay } from '../../../utils/delay';

export const Type: Effect<string> = {
  name: 'type',
  parse: (value) => value,
  run: (text) => async (ctx) => {
    ctx.cursor.freeze();

    let prevChar: string | null = null;
    let i = 0;

    while (i < text.length && ctx.node) {
      ctx.setState('active');

      const char = text[i]!;
      ctx.node.textContent! += char;
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
            min: 2,
            max: 5,
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
