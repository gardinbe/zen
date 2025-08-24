import { type Effect } from '../effect';

export const Remove: Effect<number> = {
  name: 'remove',
  parse: (value) => parseInt(value),
  run: (quantity) => (ctx) => {
    let remaining = quantity;

    while (remaining > 0 && ctx.node) {
      const text = ctx.node.textContent ?? '';
      const removed = Math.min(remaining, text.length);

      ctx.node.textContent = text.slice(0, text.length - removed);

      if (!ctx.node.textContent) {
        ctx.setState('incomplete');
      }

      remaining -= removed;

      if (!remaining) {
        break;
      }

      const nextIndex = ctx.nodes.indexOf(ctx.node) + 1;
      ctx.set(ctx.nodes[nextIndex] ?? null);
    }
  },
};
