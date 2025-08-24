import { type Program, ArgumentError } from '../program';

export const Clear: Program = {
  name: 'clear',
  description: 'Clears the terminal output.',
  run:
    ([arg]) =>
    (ctx) => {
      if (arg) {
        ctx.logger.stderr(ArgumentError.unexpected(1, arg));
        return;
      }

      ctx.logger.clear();
    },
};
