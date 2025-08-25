import { type ProgramConstructor, ArgumentError, getProgram, ProgramsConstructors } from '.';

export const HelpProgram: ProgramConstructor = {
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
        return 1;
      }

      if (command) {
        const program = getProgram(command);

        if (!program) {
          ctx.logger.stderr(ArgumentError.invalid(1, `Unknown program: ${command}`));
          return 1;
        }

        let str = program.description;

        if (program.arguments) {
          const spacer = createSpacer(program.arguments.map((argument) => argument.name));
          str +=
            '\n\n' +
            program.arguments
              .map((argument) => `${argument.name}${spacer(argument.name)}${argument.description}`)
              .join('\n');
        }

        ctx.logger.stdout(str);
        return 1;
      }

      const spacer = createSpacer(ProgramsConstructors.map((program) => program.name));
      const str =
        'Available programs:\n\n' +
        ProgramsConstructors.map(
          (program) =>
            `<strong>${program.name}</strong>${spacer(program.name)}${program.description}`,
        ).join('\n') +
        '\n\nType `help [program]` for more information.';

      ctx.logger.stdout(str);

      return 0;
    },
};

const createSpacer = (strings: string[]): ((str: string) => string) => {
  const gap = 4;
  const length = strings.map((str) => str.length).reduce((a, b) => Math.max(a, b), 0);
  return (str: string) => new Array(length + gap - str.length + 1).join(' ');
};
