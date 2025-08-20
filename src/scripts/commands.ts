import type { Command } from './components/terminal';

/**
 * Object of available terminal commands.
 */
export const Commands = {
  help: {
    name: 'help',
    description: 'Provides information about available commands.',
    fn: (ctx) => {
      const commands = Object.values(Commands)
        .map((command) => `\n${command.name} - ${command.description}`)
        .join('');

      ctx.logger.write({
        stdout: 'Available commands:\n' + commands,
      });
    },
  },

  clear: {
    name: 'clear',
    description: 'Clears the terminal output.',
    fn: (ctx) => {
      ctx.logger.clear();
    },
  },

  history: {
    name: 'history',
    description: 'Displays the command history.',
    fn: (ctx, args) => {
      const [arg = 'all'] = args;

      switch (arg) {
        case 'all':
          ctx.logger.write({
            stdout: ctx.history.items.join('\n'),
          });
          break;
        case 'clear':
          ctx.history.clear();
          break;
        default:
          ctx.logger.write({
            stderr: `Unknown argument: ${arg}`.trim(),
          });
      }
    },
  },
} satisfies Record<string, Command>;

/**
 * Object of aliases for terminal commands.
 */
export const Aliases = {
  cls: Commands.clear,
} satisfies Record<string, Command>;
