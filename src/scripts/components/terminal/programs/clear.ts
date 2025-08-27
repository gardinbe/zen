import { type ProgramConstructor, Arg } from '.';

export const ClearProgram: ProgramConstructor = {
  name: 'clear',
  description: 'Clears the terminal output.',
  exec:
    ([arg]) =>
    async (ctx) => {
      if (arg) {
        ctx.logger.stderr(Arg.unexpected(1, arg));
        return 1;
      }

      await ctx.logger.clear();
      return 0;
    },
};
