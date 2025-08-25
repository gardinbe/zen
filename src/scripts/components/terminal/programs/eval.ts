import { timeout } from '../../../utils/timeout';
import { type ProgramConstructor, ArgumentError } from '.';

export const EvalProgram: ProgramConstructor = {
  name: 'eval',
  description: 'Evaluates a JavaScript expression.',
  arguments: [
    {
      name: '[expression]',
      description: 'Expression to evaluate. Must be surrounded in quotes if it has spaces.',
    },
  ],
  exec:
    ([expression, arg]) =>
    async (ctx) => {
      if (arg) {
        ctx.logger.stderr(ArgumentError.unexpected(2, arg));
        return 1;
      }

      if (!expression) {
        ctx.logger.stderr(ArgumentError.missing(1));
        return 1;
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

        const result = eval?.(`void 'use strict';${expression}`);
        ctx.logger.stdout(result);
      } catch (error) {
        ctx.logger.stderr(error);
      }

      Object.assign(console, originalConsole);

      const error = await timeout(0, ctx.signal);

      if (error) {
        ctx.logger.stderr(error);
        return 1;
      }

      return 0;
    },
};
