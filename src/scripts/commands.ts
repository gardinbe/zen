import type { Command } from './components/terminal';

/**
 * Object of available terminal commands.
 */
export const Commands = {
  help: {
    name: 'help',
    description: 'Provides information about available commands.',
    fn: (ctx, [arg]) => {
      if (arg) {
        ctx.logger.stderr(ArgumentError.unexpected(1, arg));
        return;
      }

      const commands = Object.values(Commands);
      const gap = 4;
      const length = commands
        .map((command) => command.name.length)
        .reduce((a, b) => Math.max(a, b), 0);
      const text = commands
        .map(
          (command) =>
            `\n${command.name}${new Array(length + gap - command.name.length + 1).join(' ')}${command.description}`,
        )
        .join('');

      ctx.logger.stdout('Available commands:\n' + text);
    },
  },

  clear: {
    name: 'clear',
    description: 'Clears the terminal output.',
    fn: (ctx, [arg]) => {
      if (arg) {
        ctx.logger.stderr(ArgumentError.unexpected(1, arg));
        return;
      }

      ctx.logger.clear();
    },
  },

  history: {
    name: 'history',
    description: 'Displays the command history.',
    fn: (ctx, [option = 'all', arg]) => {
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
  },

  eval: {
    name: 'eval',
    description: 'Evaluates a JavaScript expression.',
    fn: (ctx, [expression, arg]) => {
      if (arg) {
        ctx.logger.stderr(ArgumentError.unexpected(2, arg));
        return;
      }

      if (!expression) {
        ctx.logger.stderr(ArgumentError.missing(1));
        return;
      }

      const originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        clear: console.clear,
      };

      try {
        console.log = ctx.logger.stdout;
        console.info = ctx.logger.stdout;
        console.warn = ctx.logger.stdout;
        console.error = ctx.logger.stderr;
        console.clear = ctx.logger.clear;

        const result = eval?.(`'use strict';${expression}`);
        ctx.logger.stdout(result);
      } catch (err) {
        ctx.logger.stderr(err);
      } finally {
        Object.assign(console, originalConsole);
      }
    },
  },
} as const satisfies Record<string, Command>;

const ArgumentError = {
  unexpected: (pos: number, msg: string) => `Unexpected argument at position ${pos}: ${msg}`,
  missing: (pos: number) => `Missing argument at position ${pos}`,
  invalid: (pos: number, msg: string) => `Invalid argument at position ${pos}: ${msg}`,
};

/**
 * Object of aliases for terminal commands.
 */
export const Aliases = {
  cls: Commands.clear,
} as const satisfies Record<string, Command>;
