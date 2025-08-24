import { type Program, Programs, ArgumentError } from '../program';

export const Help: Program = {
  name: 'help',
  description: 'Provides information about available commands.',
  run:
    ([arg]) =>
    (ctx) => {
      if (arg) {
        ctx.logger.stderr(ArgumentError.unexpected(1, arg));
        return;
      }

      const programs = Object.values(Programs);
      const gap = 4;
      const length = programs
        .map((program) => program.name.length)
        .reduce((a, b) => Math.max(a, b), 0);
      const text = programs
        .map(
          (program) =>
            `\n${program.name}${new Array(length + gap - program.name.length + 1).join(' ')}${program.description}`,
        )
        .join('');

      ctx.logger.stdout('Available programs:\n' + text);
    },
};
