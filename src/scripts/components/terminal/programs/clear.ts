import { type ProgramConstructor, ArgumentError } from '.';

export const ClearProgram: ProgramConstructor = {
  name: 'clear',
  description: 'Clears the terminal output.',
  exec:
    ([arg]) =>
    (ctx) => {
      if (arg) {
        ctx.logger.stderr(ArgumentError.unexpected(1, arg));
        return 1;
      }

      ctx.logger.clear();
      return 0;
    },
};
