import { type ProgramConstructor, ArgumentError } from '.';

export const HistoryProgram: ProgramConstructor = {
  name: 'history',
  description: 'Handles the command history.',
  arguments: [
    {
      name: '[blank] | all',
      description: 'Prints the command history.',
    },
    {
      name: 'clear',
      description: 'Clears the command history.',
    },
  ],
  exec:
    ([option = 'all', arg]) =>
    (ctx) => {
      if (arg) {
        ctx.logger.stderr(ArgumentError.unexpected(2, arg));
        return 1;
      }

      switch (option) {
        case 'all': {
          ctx.logger.stdout(ctx.history.entries.join('\n'));
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

      return 0;
    },
};
