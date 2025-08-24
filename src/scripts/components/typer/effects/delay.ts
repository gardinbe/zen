import { type Effect } from '../effect';
import { delay } from '../../../utils/delay';

export const Delay: Effect<number> = {
  name: 'delay',
  parse: (value) => parseFloat(value),
  run: (ms) => async (ctx) => {
    ctx.cursor.blink();

    try {
      await delay(ms, ctx.signal);
    } catch (err) {
      if (!ctx.signal.aborted) {
        throw err;
      }
    }
  },
};
