import { type ProgramConstructor, Arg } from '.';
import { timeout } from '../../../utils/timeout';

export const EvalProgram: ProgramConstructor = {
  name: 'eval',
  description: 'Evaluates a JavaScript expression.',
  arguments: [
    {
      name: '[expression]',
      description: 'Expression to evaluate. Must be surrounded in quotes if contains spaces.',
    },
  ],
  exec:
    ([expression, arg]) =>
    async (ctx) => {
      if (arg) {
        ctx.logger.stderr(Arg.unexpected(2, arg));
        return 1;
      }

      if (!expression) {
        ctx.logger.stderr(Arg.missing(1));
        return 1;
      }

      const originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        clear: console.clear,
      };

      let result;

      try {
        console.log = ctx.logger.stdout;
        console.info = ctx.logger.stdout;
        console.warn = ctx.logger.stdout;
        console.error = ctx.logger.stderr;
        console.clear = ctx.logger.clear;

        result = eval?.(`void 'use strict';${expression}`);
      } catch (error) {
        ctx.logger.stderr(error);
      }

      Object.assign(console, originalConsole);

      const fulfilled = await timeout(0, null);

      if (!fulfilled) {
        ctx.logger.stderr(fulfilled);
        return 1;
      }

      ctx.logger.stdout(result);
      return 0;
    },
};
