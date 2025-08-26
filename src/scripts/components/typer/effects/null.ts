import { EffectNodeState, type EffectConstructor } from '.';

export const NullEffect: EffectConstructor<never[]> = {
  name: 'null',
  create: () => (ctx) => {
    ctx.setNodeState(ctx.node, EffectNodeState.Complete);
  },
};
