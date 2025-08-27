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
        '<ul class="u-no-margin">' +
        '<li>Hold <kbd>CTRL</kbd> before pressing start to return to the terminal.</li>' +
        '<li>If on mobile, hold down the start button and shake your device abruptly.</li>' +
        '<li>Press <kbd>Tab</kbd>/<kbd>Shift+Tab</kbd> to cycle through suggestions.</li>' +
        '<li>Press <kbd>Up</kbd>/<kbd>Down</kbd> to navigate through command history.</li>' +
        '</ul>';

      ctx.logger.stdout(tips, {
        noNewlines: true,
      });
      return 0;
    },
};
