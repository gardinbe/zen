import { type Program, ArgumentError } from '../program';

export const Eval: Program = {
  name: 'eval',
  description: 'Evaluates a JavaScript expression.',
  run:
    ([expression, arg]) =>
    (ctx) => {
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
};
