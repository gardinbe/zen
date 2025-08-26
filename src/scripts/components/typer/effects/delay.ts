import { type EffectConstructor } from '.';
import { delay } from '../../../utils/delay';

export const DelayEffect: EffectConstructor<[number]> = {
  name: 'delay',
  parse: (value) => [parseFloat(value)],
  create: (ms) => async (ctx) => {
    ctx.cursor.blink();
    await delay(ms, ctx.signal);
  },
};
