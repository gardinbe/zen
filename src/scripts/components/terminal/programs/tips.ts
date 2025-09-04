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

      ctx.logger.stdout('Tips:\n\n');

      const html = /*html*/ `
        <ul>
          <li>
            Hold <kbd>CTRL</kbd> before pressing start to return to the terminal.
          </li>
          <li>
            If on mobile, hold down the <strong>Start</strong> button and shake your device abruptly.
          </li>
          <li>
            Press <kbd>Tab</kbd>/<kbd>Shift+Tab</kbd> to cycle through suggestions.
          </li>
          <li>
            Press <kbd>Up</kbd>/<kbd>Down</kbd> to navigate through the command history.
          </li>
          <li>
            Press <kbd>CTRL+C</kbd> to terminate a running program.
          </li>
        </ul>
      `;

      ctx.logger.stdout(html, {
        collapse: true,
      });
      return 0;
    },
};
