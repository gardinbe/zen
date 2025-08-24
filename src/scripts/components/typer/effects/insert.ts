import { type Effect } from '../effect';

export const Insert: Effect<string> = {
  name: 'insert',
  parse: (value) => value,
  run: (text) => (ctx) => {
    if (!ctx.node) {
      return;
    }

    ctx.node.textContent += text;
    ctx.setState('complete');
  },
};
