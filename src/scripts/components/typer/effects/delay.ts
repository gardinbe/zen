import { type EffectConstructor } from '../effect';
import { timeout } from '../../../utils/delay';

export const DelayEffect: EffectConstructor<number> = {
  name: 'delay',
  parse: (value) => parseFloat(value),
  create: (ms) => async (ctx) => {
    try {
      ctx.cursor.blink();
      await timeout(ms, ctx.signal);
    } catch (err) {
      if (!ctx.signal.aborted) {
        throw err;
      }
    }
  },
};
