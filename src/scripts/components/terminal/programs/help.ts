import { type Program, ArgumentError, getProgram, Programs } from '../program';

export const HelpProgram: Program = {
  name: 'help',
  description: 'Provides information about available programs.',
  arguments: [
    {
      name: '[blank]',
      description: 'Prints information about all available programs.',
    },
    {
      name: '[program]',
      description: 'Prints information about a specific program.',
    },
  ],
  exec:
    ([command, arg]) =>
    (ctx) => {
      if (arg) {
        ctx.logger.stderr(ArgumentError.unexpected(2, arg));
        return;
      }

      if (command) {
        const program = getProgram(command);

        if (!program) {
          ctx.logger.stderr(ArgumentError.invalid(1, `Unknown program: ${command}`));
          return;
        }

        let str =
          `<strong>Name</strong>: ${program.name}` +
          `\n<strong>Description</strong>: ${program.description}`;

        if (program.arguments) {
          const spacer = createSpacer(program.arguments.map((_arg) => _arg.name));
          str +=
            '\n<strong>Arguments</strong>:\n' +
            program.arguments
              .map((_arg) => `${_arg.name}${spacer(_arg.name)}${_arg.description}`)
              .join('\n');
        }

        ctx.logger.stdout(str);
        return;
      }

      const spacer = createSpacer(Programs.map((program) => program.name));
      const str =
        '<strong>Available programs</strong>:\n\n' +
        Programs.map(
          (program) => `${program.name}${spacer(program.name)}${program.description}`,
        ).join('\n');

      ctx.logger.stdout(str);
    },
};

const createSpacer = (strings: string[]): ((str: string) => string) => {
  const gap = 4;
  const length = strings.map((str) => str.length).reduce((a, b) => Math.max(a, b), 0);
  return (str: string) => new Array(length + gap - str.length + 1).join(' ');
};
