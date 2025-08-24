import { type Program, ArgumentError } from '../program';

export const History: Program = {
  name: 'history',
  description: 'Handles the command history.',
  run:
    ([option = 'all', arg]) =>
    (ctx) => {
      if (arg) {
        ctx.logger.stderr(ArgumentError.unexpected(2, arg));
        return;
      }

      switch (option) {
        case 'all': {
          ctx.logger.stdout(ctx.history.items.join('\n'));
          break;
        }
        case 'clear': {
          ctx.history.clear();
          break;
        }
        default: {
          ctx.logger.stderr(ArgumentError.invalid(1, option));
          break;
        }
      }
    },
};
