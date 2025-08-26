import { type ProgramConstructor, Arg } from '.';

export const TipsProgram: ProgramConstructor = {
  name: 'tips',
  description: 'Lists useful tips.',
  exec:
    ([arg]) =>
    (ctx) => {
      if (arg) {
        ctx.logger.stderr(Arg.unexpected(1, arg));
        return 1;
      }

      const tips =
        '[[insert:\n]]Tips:\n\n' +
        '<ul class="u-no-margin"><li>Hold <kbd>CTRL</kbd> before pressing start to return to the terminal.</li>' +
        '<li>Use <code>clear</code> to clear the terminal.</li>' +
        '<li>Use <code>ls</code> to list saved documents.</li>' +
        '<li>Use <code>print</code> to print a document to the terminal.</li></ul>';

      ctx.logger.stdout(tips, { noNewlines: true });
      return 0;
    },
};
