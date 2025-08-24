import { type EffectConstructor } from '../effect';

export const InsertEffect: EffectConstructor<string> = {
  name: 'insert',
  parse: (value) => value,
  create: (text) => (ctx) => {
    ctx.node.textContent += text;
    ctx.setNodeState(ctx.node, 'complete');
  },
};
