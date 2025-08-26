import { EffectNodeState, type EffectConstructor } from '.';

// todo: this effect is a bit broken

export const RemoveEffect: EffectConstructor<[number]> = {
  name: 'remove',
  parse: (value) => [parseInt(value)],
  create: (quantity) => (ctx) => {
    let remaining = quantity;

    while (remaining) {
      const text = ctx.node.textContent ?? '';
      const removed = Math.min(remaining, text.length);

      ctx.node.textContent = text.slice(0, text.length - removed);

      if (!ctx.node.textContent) {
        ctx.setNodeState(ctx.node, EffectNodeState.Incomplete);
      }

      remaining -= removed;

      if (!remaining) {
        break;
      }

      const prevNode = ctx.nodes.at(ctx.nodes.indexOf(ctx.node) - 1);

      if (prevNode) {
        ctx.setActiveNode(prevNode);
      }
    }
  },
};
