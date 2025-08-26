import { EffectNodeState, type EffectConstructor } from '.';

export const InsertEffect: EffectConstructor<[string]> = {
  name: 'insert',
  create: (text) => (ctx) => {
    ctx.node.textContent! += text;
    ctx.setNodeState(ctx.node, EffectNodeState.Complete);
  },
};
