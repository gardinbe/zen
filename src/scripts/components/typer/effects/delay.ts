import { type EffectConstructor } from '.';
import { timeout } from '../../../utils/timeout';

export const DelayEffect: EffectConstructor<number> = {
  name: 'delay',
  parse: (value) => parseFloat(value),
  create: (ms) => async (ctx) => {
    ctx.cursor.blink();
    await timeout(ms, ctx.signal);
  },
};
