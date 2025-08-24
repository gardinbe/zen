import {
  type ProgramConstructor,
  ArgumentError,
  getProgram,
  ProgramsConstructors,
} from '../program';

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
        return;
      }

      if (command) {
        const program = getProgram(command);

        if (!program) {
          ctx.logger.stderr(ArgumentError.invalid(1, `Unknown program: ${command}`));
          return;
        }

        let str = program.description;

        if (program.arguments) {
          const spacer = createSpacer(program.arguments.map((_arg) => _arg.name));
          str +=
            '\n\n' +
            program.arguments
              .map((_arg) => `${_arg.name}${spacer(_arg.name)}${_arg.description}`)
              .join('\n');
        }

        ctx.logger.stdout(str);
        return;
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
    },
};

const createSpacer = (strings: string[]): ((str: string) => string) => {
  const gap = 4;
  const length = strings.map((str) => str.length).reduce((a, b) => Math.max(a, b), 0);
  return (str: string) => new Array(length + gap - str.length + 1).join(' ');
};
